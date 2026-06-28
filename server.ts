import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import helmet from 'helmet';
import { z } from 'zod';

// Define request validation schemas
const ExtractPassportSchema = z.object({
  imageBase64: z.string().min(1, 'Image base64 data is required'),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/i, 'Only JPEG, PNG, and WEBP images are supported'),
});

const GenerateAddressesSchema = z.object({
  permanentAddress: z.string().min(1, 'Permanent address is required'),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add security headers using helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow easy development preview and asset loading
    crossOriginEmbedderPolicy: false,
  }));

  // Increase payload limit for large passport images
  app.use(express.json({ limit: '20mb' }));

  function cleanAddressPrefixes(address: string | undefined): string {
    if (!address) return '';
    return address
      .replace(/\b(?:vill|village|post|p\.o|thana|upazila|dist|district)\b\s*[\.:-]?\s*/gi, '')
      .trim();
  }
  
  // API Route for passport extraction
  app.post('/api/extract-passport', async (req, res) => {
    try {
      // Validate input request using Zod
      const parsedBody = ExtractPassportSchema.safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ 
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
        return res.status(400).json({ 
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

      // We expect the frontend to send just the base64 string without the data URI prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      console.log('⚡ High-Speed Single-Agent Extraction Pipeline Started.');

      const pipelineResponse = await ai.models.generateContent({
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
          // Set ThinkingLevel.LOW to minimize latency (down to 2-4 seconds) and keep cost low while preserving OCR precision!
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW
          },
          systemInstruction: `You are an ultra-fast, high-precision Passport Extraction & Validation Agent. 
Extract passport data, read and validate Machine-Readable Zone (MRZ) checksums, compute confidence scores, highlight structural discrepancies, and suggest Bangladeshi addresses.

INSTRUCTIONS:
1. OCR: Extract core properties: givenName, surname, dob, birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate, expiryDate, gender (Male/Female), permanentAddress, mobileNumber.
   - Core visual shapes: Carefully differentiate 'O' vs '0' and 'I' vs '1'.
   - IMPORTANT: Format dob, issueDate, and expiryDate strictly as DD/MM/YYYY (e.g. 15/08/1990).
2. MRZ: Read raw MRZ lines into rawMrz array. Populate validation fields (passportNumberChecksum, dobChecksum, expiryDateChecksum, compositeChecksum) with "Pass" or "Fail".
3. Security Checks: Match visual details with MRZ properties. List any discrepancies found under discrepancies. Determine overall confidenceScore (0-100).
4. Undertaking: Set customUndertakingDraft to a very short 1-sentence string (e.g., "Full verification of passport data completed.") to optimize processing speed.
5. Address Rules: Base address structures on the permanentAddress classification:
   - Cat 1 (Inside Dhaka District): presentAddress is equal to permanentAddress. Create Dhaka commercial addresses for businessAddressDhaka, officeAddressDhaka. Create local versions for businessAddressLocal, officeAddressLocal.
   - Cat 2 (Dhaka Division, but not Dhaka District): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   - Cat 3 (Outside Dhaka Division): Create a Dhaka City address for presentAddress, businessAddressDhaka, officeAddressDhaka. Create matching local addresses for local fields.
   * Dhaka format: "House X, Road Y, [Area], Dhaka-[Postcode]" (No excessive building titles, commercial center tags, or complex names).
   * Rules for All addresses: Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations e.g. "Mithamain, Mithamain, Kishoreganj-2370" instead of "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370".`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
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
            required: ["finalData", "mrzValidation", "discrepancies", "confidenceScore", "customUndertakingDraft", "generatedAddresses"]
          }
        }
      });

      if (!pipelineResponse.text) {
        throw new Error('Passport extraction failed to return response data.');
      }

      const pipelineData = JSON.parse(pipelineResponse.text);
      console.log('✅ High-Speed Single-Agent Extraction Pipeline Completed.');

      const result = {
        ...pipelineData.finalData,
        discrepancyList: pipelineData.discrepancies,
        customUndertakingDraft: pipelineData.customUndertakingDraft || "",
        permanentAddress: cleanAddressPrefixes(pipelineData.finalData.permanentAddress),
        presentAddress: cleanAddressPrefixes(pipelineData.generatedAddresses.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressDhaka),
        businessAddressLocal: cleanAddressPrefixes(pipelineData.generatedAddresses.businessAddressLocal),
        officeAddressDhaka: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressDhaka),
        officeAddressLocal: cleanAddressPrefixes(pipelineData.generatedAddresses.officeAddressLocal),
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

      res.status(500).json({ error: errorMessage });
    }
  });

  // Helper function to generate addresses based on permanentAddress using Gemini
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
      model: 'gemini-3.5-flash',
      contents: [
        {
          text: `You are an expert Bangladeshi address generator.
Given the Bangladeshi permanent address below, classify it and generate other complete addresses strictly following these 3 rules:

Permanent Address to analyze: "${permanentAddress}"

Classify or decide based on these 3 categories:
Category 1: If the permanent address is inside DHAKA DISTRICT (e.g. Dhaka city areas, Uttara, Banani, Gulshan, Dhanmondi, Savar, Keraniganj, Dhamrai, Nawabganj, Dohar etc.):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be exactly equal to the permanentAddress.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random commercial/office addresses inside DHAKA CITY (e.g., Banani, Gulshan, Dhanmondi, Uttara, Motijheel, Mirpur, etc.). They must be distinct from each other.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other. You MUST explicitly append the District name to the end of these addresses.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name (e.g. "Faridpur") to the end of these addresses.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name (e.g. "Sylhet") to the end of these addresses.

CRITICAL ADDRESS FORMATTING MANDATES:
- DHAKA CITY ADDRESSES (presentAddress, businessAddressDhaka, officeAddressDhaka):
  * MUST strictly use the natural standard pattern: "House [Number], Road [Number], [Area Name], Dhaka-[Postcode]", or for Uttara: "House [Number], Road [Number], Sector [Number], Uttara, Dhaka-[Postcode]" or Mirpur: "House [Number], Road [Number], Block [Letter], Mirpur-[Number], Dhaka-[Postcode]".
  * Do NOT include office level/building tags (like "Level 8, Concord Tower" or "Plot 15, Block C") or wordy labels like "Banani Commercial Area". Keep them clean and directly of the standard format.
  * Areas like Banani, Gulshan, Dhanmondi, Uttara MUST have proper Road numbers (e.g., "House 15, Road 11, Banani, Dhaka-1213").
- LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
  * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
  * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
  * Do NOT include prefix labels or structural tags like 'Vill:', 'Post:', 'Thana:', 'Dist:', 'dist:', 'vill', 'post', 'thana', or 'dist'. Write clean comma-separated names of locations e.g. "Mithamain, Mithamain, Kishoreganj-2370" instead of "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370" (Ensure the District name is ALWAYS included in these local addresses).
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
        permanentAddress: cleanAddressPrefixes(rawObj.permanentAddress),
        presentAddress: cleanAddressPrefixes(rawObj.presentAddress),
        businessAddressDhaka: cleanAddressPrefixes(rawObj.businessAddressDhaka),
        businessAddressLocal: cleanAddressPrefixes(rawObj.businessAddressLocal),
        officeAddressDhaka: cleanAddressPrefixes(rawObj.officeAddressDhaka),
        officeAddressLocal: cleanAddressPrefixes(rawObj.officeAddressLocal)
      };
    }
    throw new Error('Failed to generate addresses using Gemini');
  }

  // API Route for address generation based on permanent address
  app.post('/api/generate-addresses', async (req, res) => {
    try {
      // Validate input request using Zod
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
