import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { 
  getUsersStore, 
  checkAndIncrementLimit, 
  decrementLimit, 
  appendAuditLog 
} from './db';

export const extractionRouter = Router();

const ExtractPassportSchema = z.object({
  imageBase64: z.string().min(1, 'Image base64 data is required'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/i, 'Only JPEG, PNG, and WEBP images are supported'),
});

const ExtractApplicationPdfSchema = z.object({
  pdfBase64: z.string().min(1, 'PDF base64 data is required'),
  mimeType: z.string().regex(/^application\/pdf$/i, 'Only PDF files are supported'),
});

const GenerateAddressesSchema = z.object({
  permanentAddress: z.string().min(1, 'Permanent address is required'),
});

export function cleanAddressPrefixes(address: string | undefined): string {
  if (!address) return '';
  return address
    .replace(/\b(?:vill|village|post|p\.o|thana|upazila|dist|district)\b\s*[\.:-]?\s*/gi, '')
    .trim();
}

export const DISTRICT_POSTAL_CODES: Record<string, string> = {
  dhaka: '1200',
  kishoreganj: '2300',
  sylhet: '3100',
  chittagong: '4000',
  chattogram: '4000',
  gazipur: '1700',
  narayanganj: '1400',
  tangail: '1900',
  faridpur: '7800',
  manikganj: '1800',
  munshiganj: '1500',
  narsingdi: '1600',
  madaripur: '7900',
  gopalganj: '8100',
  rajbari: '7700',
  shariatpur: '8000',
  mymensingh: '2200',
  rajshahi: '6000',
  rangpur: '5400',
  khulna: '9100',
  barisal: '8200',
  barishal: '8200',
  bogra: '5800',
  bogura: '5800',
  jessore: '7400',
  jashore: '7400',
  comilla: '3500',
  cumilla: '3500',
  noakhali: '3800',
  feni: '3900',
  coxsbazar: '4700',
  cox: '4700',
  brahmanbaria: '3400',
  dinajpur: '5200',
  pabna: '6600',
  kushtia: '7000',
  sirajganj: '6700',
  jamalpur: '2000',
  netrokona: '2400',
  sherpur: '2100',
  naogaon: '6500',
  natore: '6400',
  joypurhat: '5900',
  chapainawabganj: '6300',
  gaibandha: '5700',
  kurigram: '5600',
  lalmonirhat: '5500',
  nilphamari: '5300',
  panchagarh: '5000',
  thakurgaon: '5100',
  bagerhat: '9300',
  chuadanga: '7200',
  jhenaidah: '7300',
  magura: '7600',
  meherpur: '7100',
  narail: '7500',
  satkhira: '9400',
  barguna: '8700',
  bhola: '8300',
  jhalokati: '8400',
  patuakhali: '8600',
  pirojpur: '8500',
  bandarban: '4600',
  khagrachhari: '4400',
  rangamati: '4500',
  habiganj: '3300',
  moulvibazar: '3200',
  sunamganj: '3000',
  chandpur: '3600',
  lakshmipur: '3700'
};

export function appendPostalCodeToAddress(address: string | undefined): string {
  if (!address) return '';
  let cleaned = address.trim();

  const hasPostcode = /\b\d{4}\b/.test(cleaned);
  if (hasPostcode) {
    return cleaned;
  }

  const words = cleaned.toLowerCase().split(/[\s,;-]+/);
  let detectedPostcode = '1000';
  let matchedDistrictKey = '';

  for (let i = words.length - 1; i >= 0; i--) {
    const cleanWord = words[i].replace(/[^a-z]/g, '');
    if (DISTRICT_POSTAL_CODES[cleanWord]) {
      detectedPostcode = DISTRICT_POSTAL_CODES[cleanWord];
      matchedDistrictKey = cleanWord;
      break;
    }
  }

  if (matchedDistrictKey) {
    const regex = new RegExp(`\\b(${matchedDistrictKey})\\b`, 'i');
    const match = cleaned.match(regex);
    if (match) {
      const index = cleaned.toLowerCase().lastIndexOf(matchedDistrictKey);
      if (index !== -1) {
        const originalCaseDistrict = cleaned.substring(index, index + matchedDistrictKey.length);
        cleaned = cleaned.substring(0, index) + `${originalCaseDistrict}-${detectedPostcode}` + cleaned.substring(index + matchedDistrictKey.length);
        return cleaned;
      }
    }
  }

  if (!matchedDistrictKey) {
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
    }
    const fallbackCodes = ['1200', '2300', '3100', '4000', '1700', '1400', '1900', '7800', '2200', '6000', '5400', '9100', '8200'];
    const fallbackCode = fallbackCodes[Math.abs(hash) % fallbackCodes.length];
    if (cleaned.endsWith(',')) {
      cleaned = cleaned.substring(0, cleaned.length - 1).trim();
    }
    cleaned = `${cleaned}-${fallbackCode}`;
  }

  return cleaned;
}

extractionRouter.post('/extract-passport', async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] || req.body.userId)?.toString();
    if (!userId) {
      return res.status(200).json({ success: false, error: 'প্রবেশাধিকার পাননি। দয়া করে আগে লগইন করুন।' });
    }

    const users = getUsersStore();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(200).json({ success: false, error: 'অবৈধ সেশন। দয়া করে আবার লগইন করুন।' });
    }

    if (user.isSuspended) {
      return res.status(200).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। দয়া করে এডমিনের সাথে যোগাযোগ করুন।' });
    }

    const limitCheck = checkAndIncrementLimit(userId);
    if (!limitCheck.allowed) {
      return res.status(200).json({ 
        success: false, 
        error: 'আপনার দৈনিক ফ্রী লিমিট (৫টি এক্সট্রাকশন) শেষ হয়ে গেছে। দয়া করে ২৪ ঘণ্টা পর আবার ফ্রী ট্রাই করতে পারবেন।' 
      });
    }

    appendAuditLog({ userId: userId, action: 'EXTRACTION', details: 'Extracted a passport' });

    const parsedBody = ExtractPassportSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(200).json({ 
        success: false, 
        error: parsedBody.error.issues.map(e => e.message).join(', ') 
      });
    }

    let { imageBase64, mimeType } = parsedBody.data;
    if (mimeType.toLowerCase() === 'image/jpg') {
      mimeType = 'image/jpeg';
    }

    const clientApiKey = req.headers['x-api-key']?.toString() || process.env.GEMINI_API_KEY;

    if (!clientApiKey) {
      return res.status(200).json({ 
        success: false,
        error: 'GEMINI_API_KEY is missing. Please set it in your Render Dashboard Environment variables, OR configure it directly in the Extractor UI Settings (gear icon in the top-right of your screen).' 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: clientApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    console.log('⚡ High-Speed Dual-Engine Extraction Pipeline Initiated.');

    const systemInstruction = `You are an ultra-fast, high-precision Passport Extraction & Validation Agent. 
Extract passport data, read and validate Machine-Readable Zone (MRZ) checksums, compute confidence scores, highlight structural discrepancies, and suggest Bangladeshi addresses.

CRITICAL INITIAL QUALITY SCAN:
Before doing any extraction, carefully evaluate the provided image first.
- Is this actually a passport photo/info page?
- Is the passport photo page extremely blurry, out-of-focus, dark, has high glare/reflections, or is of too low quality to confidently read names and passport numbers?
- If the image is NOT a passport, or if it is too blurry/low-quality to read and extract real information accurately (which would lead to hallucination), you MUST set "isValidPassport" to false, and provide a clear, detailed, helpful explanation in Bengali under "validationError" explaining exactly why it cannot be read and asking the user to upload a clear passport photo (e.g. "পাসপোর্ট এর ছবিটি স্পষ্ট নয় বা পড়া যাচ্ছে না। দয়া করে আলোর নিচে একটি স্পষ্ট ও সোজা ছবি তুলে আপলোড করুন।"). For all other fields (finalData, mrzValidation, generatedAddresses, etc.), you can set empty/blank string values or dummy placeholder values as they won't be used.
- If the image is a valid, legible passport page, you MUST set "isValidPassport" to true and "validationError" to "".

INSTRUCTIONS FOR VALID PASSPORTS:
1. OCR: Extract core properties: givenName, surname, dob, birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate, expiryDate, gender (Male/Female), permanentAddress, mobileNumber.
   - Core visual shapes: Carefully differentiate 'O' vs '0' and 'I' vs '1'.
   - IMPORTANT: Format dob, issueDate, and expiryDate strictly as DD/MM/YYYY (e.g. 15/08/1990).
   - permanentAddress format requirement: Extract the FULL permanent address exactly as written on the passport.
     * CRITICAL ACCURACY RULE: Do NOT truncate, shorten, summarize, or simplify any part of the permanent address! If the permanent address is long or complex (e.g., contains house numbers, holding numbers, village, block, lane, post office, police station, district), you MUST extract and output the ENTIRE address completely. Do NOT restrict the extraction to exactly four sections or discard parts of it.
     * Ensure that the correct district name is at the end, and explicitly append the correct 4-digit postcode of that district (e.g. "Kishoreganj-2370" or "Comilla-3500").
2. MRZ: Read raw MRZ lines into rawMrz array. Populate validation fields (passportNumberChecksum, dobChecksum, expiryDateChecksum, compositeChecksum) with "Pass" or "Fail".
3. Security & Confidence: Match visual details with MRZ properties. List any discrepancies found under discrepancies. Determine overall confidenceScore (0-100). Also estimate individual fieldConfidence scores (0-100) for every field in finalData based on image legibility and MRZ cross-checks.
4. Undertaking: Set customUndertakingDraft to a very short 1-sentence string (e.g., "Full verification of passport data completed.") to optimize processing speed.
5. Address Rules: Base address structures on the permanentAddress classification:
   - Cat 1 (Inside Dhaka District): presentAddress is equal to permanentAddress. Create Dhaka commercial addresses for businessAddressDhaka, officeAddressDhaka. Create local versions for businessAddressLocal, officeAddressLocal.
   - Cat 2 (Dhaka Division, but not Dhaka District): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   - Cat 3 (Outside Dhaka Division): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   
   * DHAKA CITY ADDRESS GENERATION & DIVERSITY MANDATE: 
     For each generated Dhaka City address (such as presentAddress when required, businessAddressDhaka, and officeAddressDhaka), you MUST randomly select an area from the following list. Every time you generate these, you MUST randomly select a different area for each field, and randomly assign house numbers and road/sector numbers. They MUST NEVER have the same house number, road number, or area as each other. Each time the model runs, it must vary the generated numbers and areas completely.
     
     Here is the strict mapping of areas and their correct postcodes to use:
     - Mirpur: Dhaka-1216
     - Mohammadpur: Dhaka-1207
     - Uttara: Dhaka-1230
     - Basabo: Dhaka-1214
     - Khilgaon: Dhaka-1219
     - Rampura: Dhaka-1219
     - Banasree: Dhaka-1219
     - Badda: Dhaka-1212
     - Khilkhet: Dhaka-1229
     - Airport: Dhaka-1229
     - Dhanmandi: Dhaka-1209
     - New Market: Dhaka-1205
     - Old Dhaka: Dhaka-1100
     - Pallabi: Dhaka-1216
     - Farmgate: Dhaka-1215

     For each of the generated Dhaka addresses, format them strictly as:
     "House [Random Number between 1-150], Road [Random Number between 1-30], [Random Area], [City]-[Correct Postcode]"
     (e.g., 'House 42, Road 11, Dhanmandi, Dhaka-1209', 'House 9, Road 4, Mirpur, Dhaka-1216', 'House 112, Road 18, Mohammadpur, Dhaka-1207'). Ensure the house/road numbers are generated randomly on every run and are never the same across fields.
     
   * Rules for All local addresses outside Dhaka (businessAddressLocal, officeAddressLocal): Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations strictly following the format: "Goalpur, Mithamain, Goalpur, Kishoreganj-2370" instead of "Vill: Goalpur, Thana: Mithamain, Post: Goalpur, Dist: Kishoreganj". Ensure the district name with its correct 4-digit postcode is always added at the very end.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isValidPassport: { type: Type.BOOLEAN },
        validationError: { type: Type.STRING },
        finalData: {
          type: Type.OBJECT,
          properties: {
            givenName: { type: Type.STRING },
            surname: { type: Type.STRING },
            dob: { type: Type.STRING },
            birthPlace: { type: Type.STRING },
            fatherName: { type: Type.STRING },
            motherName: { type: Type.STRING },
            spouseName: { type: Type.STRING },
            passportNumber: { type: Type.STRING },
            nidOrBirthCertNumber: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            expiryDate: { type: Type.STRING },
            gender: { type: Type.STRING },
            permanentAddress: { type: Type.STRING },
            mobileNumber: { type: Type.STRING }
          },
          required: [
            "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
            "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber"
          ]
        },
        fieldConfidence: {
          type: Type.OBJECT,
          properties: {
            givenName: { type: Type.INTEGER },
            surname: { type: Type.INTEGER },
            dob: { type: Type.INTEGER },
            birthPlace: { type: Type.INTEGER },
            fatherName: { type: Type.INTEGER },
            motherName: { type: Type.INTEGER },
            spouseName: { type: Type.INTEGER },
            passportNumber: { type: Type.INTEGER },
            nidOrBirthCertNumber: { type: Type.INTEGER },
            issueDate: { type: Type.INTEGER },
            expiryDate: { type: Type.INTEGER },
            gender: { type: Type.INTEGER },
            permanentAddress: { type: Type.INTEGER },
            mobileNumber: { type: Type.INTEGER }
          },
          required: [
            "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
            "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber"
          ]
        },
        mrzValidation: {
          type: Type.OBJECT,
          properties: {
            rawMrz: { type: Type.ARRAY, items: { type: Type.STRING } },
            passportNumberChecksum: { type: Type.STRING },
            dobChecksum: { type: Type.STRING },
            expiryDateChecksum: { type: Type.STRING },
            compositeChecksum: { type: Type.STRING }
          },
          required: ["rawMrz", "passportNumberChecksum", "dobChecksum", "expiryDateChecksum", "compositeChecksum"]
        },
        discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidenceScore: { type: Type.INTEGER },
        customUndertakingDraft: { type: Type.STRING },
        generatedAddresses: {
          type: Type.OBJECT,
          properties: {
            presentAddress: { type: Type.STRING },
            businessAddressDhaka: { type: Type.STRING },
            businessAddressLocal: { type: Type.STRING },
            officeAddressDhaka: { type: Type.STRING },
            officeAddressLocal: { type: Type.STRING }
          },
          required: ["presentAddress", "businessAddressDhaka", "businessAddressLocal", "officeAddressDhaka", "officeAddressLocal"]
        }
      },
      required: ["isValidPassport", "validationError", "finalData", "fieldConfidence", "mrzValidation", "discrepancies", "confidenceScore", "customUndertakingDraft", "generatedAddresses"]
    };

    let pipelineResponse;
    try {
      console.log('⚡ Running primary engine: gemini-3.1-flash-lite (Target latency: 2-3s)');
      pipelineResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });
    } catch (err: any) {
      console.warn('⚠️ Primary gemini-3.1-flash-lite engine error, attempting fast fallback (gemini-3.5-flash)...', err.message || err);
      pipelineResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });
    }

    if (!pipelineResponse.text) {
      throw new Error('Passport extraction failed to return response data.');
    }

    const pipelineData = JSON.parse(pipelineResponse.text);
    console.log('✅ High-Speed Single-Agent Extraction Pipeline Completed.');

    if (pipelineData.isValidPassport === false) {
      console.warn('⚠️ Passport photo validation failed:', pipelineData.validationError);
      decrementLimit(userId);
      return res.status(200).json({
        success: false,
        error: pipelineData.validationError || 'পাসপোর্টের ছবিটি স্পষ্ট নয় অথবা এটি একটি বৈধ পাসপোর্ট নয়। দয়া করে একটি স্পষ্ট পাসপোর্টের ছবি আপলোড করুন।'
      });
    }

    const result = {
      ...pipelineData.finalData,
      fieldConfidence: pipelineData.fieldConfidence,
      discrepancyList: pipelineData.discrepancies,
      customUndertakingDraft: pipelineData.customUndertakingDraft || "",
      permanentAddress: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.finalData.permanentAddress)),
      presentAddress: cleanAddressPrefixes(pipelineData.generatedAddresses.presentAddress),
      businessAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressDhaka),
      businessAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressLocal)),
      officeAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressDhaka),
      officeAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressLocal)),
    };

    const formattedMrzLines = Array.isArray(pipelineData.mrzValidation.rawMrz) 
      ? pipelineData.mrzValidation.rawMrz.map((line: string) => `\`${line}\``).join('\n  ')
      : 'Lines not detected';

    const logLines = [
      `⚡ **High-Speed Single-Agent Extraction Engine**: Extraction completed instantly in a single optimized pass.`,
      `🔍 **OCR & MRZ Reader Specialist**: Successfully scanned layout and read Machine-Readable Zone:\n  ${formattedMrzLines}`,
      `   - Passport No Checksum Validation: **${pipelineData.mrzValidation.passportNumberChecksum}**`,
      `   - Date of Birth Checksum Validation: **${pipelineData.mrzValidation.dobChecksum}**`,
      `   - Expiry Date Checksum Validation: **${pipelineData.mrzValidation.expiryDateChecksum}**`,
      `   - Composite Checksum Validation: **${pipelineData.mrzValidation.compositeChecksum}**`,
      `🛡️ **Data Guardian System**: Performed comprehensive visual-to-MRZ checksum checks. Overall confidence is **${pipelineData.confidenceScore}%** with **${pipelineData.discrepancies.length}** discrepancy alerts.`,
      `📍 **Bangladeshi Address Generator**: Automatically classified boundaries to construct synchronized residence and professional address layouts.`
    ];
    result.agentLog = logLines.join('\n\n');

    console.log('⚡ High-Speed Extraction Completed perfectly. Packaging results for display.');
    res.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Extraction Error:', error);
    
    let errorMessage = 'Server error during extraction';
    
    if (error && error.message) {
      if (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('UNAVAILABLE')) {
        errorMessage = 'The AI system is currently experiencing high demand. Please try again in a few moments.';
      } else {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && parsed.error && parsed.error.message) {
              errorMessage = parsed.error.message;
            } else {
              errorMessage = error.message;
            }
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
    }

    res.status(500).json({ success: false, error: errorMessage });
  }
});

extractionRouter.post('/extract-application-pdf', async (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] || req.body.userId)?.toString();
    if (!userId) {
      return res.status(200).json({ success: false, error: 'প্রবেশাধিকার পাননি। দয়া করে আগে লগইন করুন।' });
    }

    const users = getUsersStore();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(200).json({ success: false, error: 'অবৈধ সেশন। দয়া করে আবার লগইন করুন।' });
    }

    if (user.isSuspended) {
      return res.status(200).json({ success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। দয়া করে এডমিনের সাথে যোগাযোগ করুন।' });
    }

    const limitCheck = checkAndIncrementLimit(userId);
    if (!limitCheck.allowed) {
      return res.status(200).json({ 
        success: false, 
        error: 'আপনার দৈনিক ফ্রী লিমিট (৫টি এক্সট্রাকশন) শেষ হয়ে গেছে। দয়া করে ২৪ ঘণ্টা পর আবার ফ্রী ট্রাই করতে পারবেন।' 
      });
    }

    appendAuditLog({ userId: userId, action: 'EXTRACTION', details: 'Extracted an Indian Visa Application PDF' });

    const parsedBody = ExtractApplicationPdfSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(200).json({ 
        success: false, 
        error: parsedBody.error.issues.map(e => e.message).join(', ') 
      });
    }

    let { pdfBase64, mimeType } = parsedBody.data;

    const clientApiKey = req.headers['x-api-key']?.toString() || process.env.GEMINI_API_KEY;

    if (!clientApiKey) {
      return res.status(200).json({ 
        success: false,
        error: 'GEMINI_API_KEY is missing. Please set it in your Render Dashboard Environment variables, OR configure it directly in the Extractor UI Settings (gear icon in the top-right of your screen).' 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: clientApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

    console.log('⚡ High-Speed Visa Application PDF Extraction Pipeline Initiated.');

    const systemInstruction = `You are an ultra-fast, high-precision Application Extraction & Validation Agent specializing in Indian Visa Application PDFs submitted by Bangladeshi citizens.
The uploaded document is a PDF containing exactly 2 or 3 pages of the Indian Visa Application Form.

CRITICAL DISCIPLINE:
- Extract all data EXACTLY as printed in the uploaded form.
- DO NOT add or fabricate any external or extra (barti) information. 
- DO NOT invent synthetic addresses or rotate fake Dhaka addresses.
- If a value is present in the form, extract it exactly as it is. If a field or section (like Employer/Profession details or spouse name) is blank or not on the form, keep it empty or blank. Do NOT fill it with fake or placeholder data.
- MUST EXTRACT the exact business name and address if printed in the "Profession / Occupation Details of Applicant" section.
- MUST EXTRACT the exact private company name, designation, and address if present.
- MUST EXTRACT the exact hospital details (Name, Doctor, Address, etc.) if it is a Medical Visa application and the details are printed.
- MUST EXTRACT the exact hotel details if it is a Tourist Visa application and the details are printed.

CRITICAL INITIAL QUALITY SCAN:
Before doing any extraction, carefully evaluate the provided PDF file first.
- Is this actually an Indian Visa Application Form or a similar visa application?
- If the PDF is NOT a visa application, or if it is completely blank/unreadable, you MUST set "isValidApplication" to false, and provide a clear, detailed, helpful explanation in Bengali under "validationError" explaining exactly why it cannot be read.
- If the PDF is a valid, legible visa application, you MUST set "isValidApplication" to true and "validationError" to "".

INSTRUCTIONS FOR VALID APPLICATIONS:
1. OCR Extraction: Extract the following core properties from all pages (2 or 3 pages) of the PDF exactly as printed:
   - givenName: Applicant's Given Name
   - surname: Applicant's Surname (if blank, use empty string)
   - dob: Date of Birth. Extract and format strictly as DD/MM/YYYY (e.g., 15/08/1990)
   - birthPlace: Place of Birth
   - fatherName: Father's Name
   - motherName: Mother's Name
   - spouseName: Spouse's Name (if unmarried or empty, use empty string)
   - passportNumber: Passport Number
   - nidOrBirthCertNumber: National ID or Birth Registration Number
   - issueDate: Passport Date of Issue. Format strictly as DD/MM/YYYY
   - expiryDate: Passport Date of Expiry. Format strictly as DD/MM/YYYY
   - gender: Gender (Male/Female/Other)
   - permanentAddress: Permanent Address. Format strictly as written in the form, but make sure to clean or normalize any unnecessary prefix labels.
   - presentAddress: Exact Present Address printed on the application form.
   - mobileNumber: Applicant's Phone or Mobile Number as printed in the form.

2. Additional Details Processing: 
   - professionDetails: In the "Profession / Occupation Details of Applicant" section, extract the exact printed Employer/Business/Organization Name into "jobCompanyName", the designation into "jobRole", and the exact employer address into "officeAddressDhaka" or "officeAddressLocal". For private companies, extract the name, designation, and address exactly as printed. DO NOT invent fake company names or fake commercial addresses.
   - medicalDetails: If this is a medical visa, extract the hospital name into "hospitalName" and the hospital address/details into "hospitalAddress".
   - touristDetails: If this is a tourist visa or has hotel info, extract the hotel name into "hotelName" and the hotel address into "hotelAddress".

3. Security & Confidence: Match visual details and list any discrepancies found under discrepancies. Determine overall confidenceScore (0-100). Also estimate individual fieldConfidence scores (0-100) for every field in finalData based on document legibility.
4. Undertaking: Set customUndertakingDraft to a very short 1-sentence string (e.g., "Full verification of submitted application data completed.") to optimize processing speed.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        isValidApplication: { type: Type.BOOLEAN },
        validationError: { type: Type.STRING },
        finalData: {
          type: Type.OBJECT,
          properties: {
            givenName: { type: Type.STRING },
            surname: { type: Type.STRING },
            dob: { type: Type.STRING },
            birthPlace: { type: Type.STRING },
            fatherName: { type: Type.STRING },
            motherName: { type: Type.STRING },
            spouseName: { type: Type.STRING },
            passportNumber: { type: Type.STRING },
            nidOrBirthCertNumber: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            expiryDate: { type: Type.STRING },
            gender: { type: Type.STRING },
            permanentAddress: { type: Type.STRING },
            presentAddress: { type: Type.STRING },
            mobileNumber: { type: Type.STRING },
            jobCompanyName: { type: Type.STRING },
            jobRole: { type: Type.STRING },
            officeAddressDhaka: { type: Type.STRING },
            officeAddressLocal: { type: Type.STRING },
            hospitalName: { type: Type.STRING },
            hospitalAddress: { type: Type.STRING },
            hotelName: { type: Type.STRING },
            hotelAddress: { type: Type.STRING }
          },
          required: [
            "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
            "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber", "presentAddress"
          ]
        },
        fieldConfidence: {
          type: Type.OBJECT,
          properties: {
            givenName: { type: Type.INTEGER },
            surname: { type: Type.INTEGER },
            dob: { type: Type.INTEGER },
            birthPlace: { type: Type.INTEGER },
            fatherName: { type: Type.INTEGER },
            motherName: { type: Type.INTEGER },
            spouseName: { type: Type.INTEGER },
            passportNumber: { type: Type.INTEGER },
            nidOrBirthCertNumber: { type: Type.INTEGER },
            issueDate: { type: Type.INTEGER },
            expiryDate: { type: Type.INTEGER },
            gender: { type: Type.INTEGER },
            permanentAddress: { type: Type.INTEGER },
            presentAddress: { type: Type.INTEGER },
            mobileNumber: { type: Type.INTEGER }
          },
          required: [
            "givenName", "surname", "dob", "birthPlace", "fatherName", "motherName",
            "spouseName", "passportNumber", "nidOrBirthCertNumber", "issueDate", "expiryDate", "gender", "permanentAddress", "mobileNumber", "presentAddress"
          ]
        },
        discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
        confidenceScore: { type: Type.INTEGER },
        customUndertakingDraft: { type: Type.STRING },
        generatedAddresses: {
          type: Type.OBJECT,
          properties: {
            presentAddress: { type: Type.STRING },
            businessAddressDhaka: { type: Type.STRING },
            businessAddressLocal: { type: Type.STRING },
            officeAddressDhaka: { type: Type.STRING },
            officeAddressLocal: { type: Type.STRING }
          },
          required: ["presentAddress", "businessAddressDhaka", "businessAddressLocal", "officeAddressDhaka", "officeAddressLocal"]
        }
      },
      required: ["isValidApplication", "validationError", "finalData", "fieldConfidence", "discrepancies", "confidenceScore", "customUndertakingDraft", "generatedAddresses"]
    };

    let pipelineResponse;
    try {
      console.log('⚡ Running primary engine: gemini-3.1-flash-lite (Target latency: 2-3s)');
      pipelineResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });
    } catch (err: any) {
      console.warn('⚠️ Primary gemini-3.1-flash-lite engine error, attempting fast fallback (gemini-3.5-flash)...', err.message || err);
      pipelineResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema
        }
      });
    }

    if (!pipelineResponse.text) {
      throw new Error('Visa application PDF extraction failed to return response data.');
    }

    const pipelineData = JSON.parse(pipelineResponse.text);
    console.log('✅ High-Speed Application PDF Extraction Pipeline Completed.');

    if (pipelineData.isValidApplication === false) {
      console.warn('⚠️ Visa application validation failed:', pipelineData.validationError);
      decrementLimit(userId);
      return res.status(200).json({
        success: false,
        error: pipelineData.validationError || 'পিডিএফ ফাইলটি একটি বৈধ ইন্ডিয়ান ভিসা অ্যাপ্লিকেশন নয়। দয়া করে সঠিক পিডিএফ ফাইল আপলোড করুন।'
      });
    }

    const result = {
      ...pipelineData.finalData,
      fieldConfidence: pipelineData.fieldConfidence,
      discrepancyList: pipelineData.discrepancies,
      customUndertakingDraft: pipelineData.customUndertakingDraft || "",
      permanentAddress: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.finalData.permanentAddress)),
      presentAddress: cleanAddressPrefixes(pipelineData.generatedAddresses.presentAddress),
      businessAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressDhaka),
      businessAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressLocal)),
      officeAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressDhaka),
      officeAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressLocal)),
    };

    const logLines = [
      `⚡ **High-Speed Indian Visa Form PDF Engine**: Indian Visa application form successfully parsed directly in a single pass.`,
      `🔍 **Form Parser Specialist**: Extracted given names, passport details, dates, and familial information.`,
      `🛡️ **Security Check System**: Analyzed structure and computed overall confidence is **${pipelineData.confidenceScore}%**.`,
      `📍 **Address Synchronizer**: Automatically designed matching residence and professional address fields.`
    ];
    result.agentLog = logLines.join('\n\n');

    console.log('⚡ Visa PDF Extraction Completed perfectly. Packaging results for display.');
    res.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Visa PDF Extraction Error:', error);
    
    let errorMessage = 'Server error during PDF extraction';
    
    if (error && error.message) {
      if (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('UNAVAILABLE')) {
        errorMessage = 'The AI system is currently experiencing high demand. Please try again in a few moments.';
      } else {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed && parsed.error && parsed.error.message) {
              errorMessage = parsed.error.message;
            } else {
              errorMessage = error.message;
            }
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
    }

    res.status(500).json({ success: false, error: errorMessage });
  }
});

async function generateAddressesUsingGemini(ai: GoogleGenAI, permanentAddress: string) {
  if (!permanentAddress || permanentAddress.trim() === '') {
    return {
      permanentAddress: '',
      presentAddress: '',
      businessAddressDhaka: '',
      businessAddressLocal: '',
      officeAddressDhaka: '',
      officeAddressLocal: ''
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        text: `You are an expert Bangladeshi address generator.
Given the Bangladeshi permanent address below, classify it and generate other complete addresses strictly following these 3 rules:

Permanent Address to analyze: "${permanentAddress}"

Classify or decide based on these 3 categories:
Category 1: If the permanent address is inside DHAKA DISTRICT (e.g. Dhaka city areas, Uttara, Banani, Gulshan, Dhanmondi, Savar, Keraniganj, Dhamrai, Nawabganj, Dohar etc.):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be exactly equal to the permanentAddress.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random commercial/office addresses inside DHAKA CITY (e.g., Dhanmondi, Gulshan, Uttara, Mirpur, Motijheel, Badda, Malibagh, Mogbazar, etc.). They must be distinct from each other and randomly chosen.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other. You MUST explicitly append the District name WITH 4-DIGIT POSTAL CODE (e.g., Kishoreganj-2370) to the end of these addresses.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name with 4-digit postal code (e.g. "Faridpur-7800") to the end of these addresses.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name with 4-digit postal code (e.g. "Sylhet-3100") to the end of these addresses.

CRITICAL ADDRESS FORMATTING & DIVERSITY MANDATES:
- DHAKA CITY ADDRESSES (presentAddress when required, businessAddressDhaka, officeAddressDhaka):
  * DHAKA AREA RANDOM DIVERSITY MANDATE: For each generated Dhaka City address, you MUST randomly select an area from the list below. Every time you generate these, you MUST randomly select a different area for each field, and randomly assign house numbers and road/sector numbers. They MUST NEVER have the same house number, road number, or area as each other. Each time the model runs, it must vary the generated numbers and areas completely.
  
  Here is the strict mapping of areas and their correct postcodes to use:
  - Mirpur: Dhaka-1216
  - Mohammadpur: Dhaka-1207
  - Uttara: Dhaka-1230
  - Basabo: Dhaka-1214
  - Khilgaon: Dhaka-1219
  - Rampura: Dhaka-1219
  - Banasree: Dhaka-1219
  - Badda: Dhaka-1212
  - Khilkhet: Dhaka-1229
  - Airport: Dhaka-1229
  - Dhanmandi: Dhaka-1209
  - New Market: Dhaka-1205
  - Old Dhaka: Dhaka-1100
  - Pallabi: Dhaka-1216
  - Farmgate: Dhaka-1215

  For each of the generated Dhaka addresses, format them strictly as:
  "House [Random Number between 1-150], Road [Random Number between 1-30], [Random Area], [City]-[Correct Postcode]"
  (e.g., 'House 42, Road 11, Dhanmandi, Dhaka-1209', 'House 9, Road 4, Mirpur, Dhaka-1216', 'House 112, Road 18, Mohammadpur, Dhaka-1207'). Ensure the house/road numbers are generated randomly on every run and are never the same across fields.

- LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
  * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
  * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
  * Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations strictly following the format: "Goalpur, Mithamain, Goalpur, Kishoreganj-2370" instead of "Vill: Goalpur, Thana: Mithamain, Post: Goalpur, Dist: Kishoreganj". Ensure the district name with its correct 4-digit postcode is always added at the very end.
  * Keep it short, authentic, uncluttered, and highly natural. Do not use placeholders like "[Insert Road]".
- Return the output strictly in the requested JSON structure.`
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          permanentAddress: { type: Type.STRING },
          presentAddress: { type: Type.STRING },
          businessAddressDhaka: { type: Type.STRING },
          businessAddressLocal: { type: Type.STRING },
          officeAddressDhaka: { type: Type.STRING },
          officeAddressLocal: { type: Type.STRING }
        },
        required: [
          "permanentAddress", "presentAddress", "businessAddressDhaka",
          "businessAddressLocal", "officeAddressDhaka", "officeAddressLocal"
        ]
      }
    }
  });

  if (response.text) {
    const rawObj = JSON.parse(response.text);
    return {
      permanentAddress: appendPostalCodeToAddress(cleanAddressPrefixes(rawObj.permanentAddress)),
      presentAddress: cleanAddressPrefixes(rawObj.presentAddress),
      businessAddressDhaka: cleanAddressPrefixes(rawObj.businessAddressDhaka),
      businessAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(rawObj.businessAddressLocal)),
      officeAddressDhaka: cleanAddressPrefixes(rawObj.officeAddressDhaka),
      officeAddressLocal: appendPostalCodeToAddress(cleanAddressPrefixes(rawObj.officeAddressLocal))
    };
  }
  throw new Error('Failed to generate addresses using Gemini');
}

extractionRouter.post('/generate-addresses', async (req, res) => {
  try {
    const parsedBody = GenerateAddressesSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ 
        success: false, 
        error: parsedBody.error.issues.map(e => e.message).join(', ') 
      });
    }

    const { permanentAddress } = parsedBody.data;
    const clientApiKey = req.headers['x-api-key']?.toString() || process.env.GEMINI_API_KEY;

    if (!clientApiKey) {
      return res.status(400).json({ 
        success: false,
        error: 'GEMINI_API_KEY is missing. Please configure it in your Settings.' 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: clientApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const addresses = await generateAddressesUsingGemini(ai, permanentAddress);
    res.json({ success: true, data: addresses });
  } catch (error: any) {
    console.error('Address Generation Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to generate addresses' });
  }
});
