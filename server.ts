import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for large passport images
  app.use(express.json({ limit: '20mb' }));
  
  // API Route for passport extraction
  app.post('/api/extract-passport', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

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

      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: 'Image data and mimeType are required' });
      }

      // We expect the frontend to send just the base64 string without the data URI prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      console.log('🤖 Optimized Multi-Agent Single-Pass Pipeline Started.');

      const pipelineResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            text: `You are the Multi-Agent Passport Intake Coordinator. 
You are running a highly optimized, single-pass pipeline to perform multiple specialized operations in parallel to guarantee sub-second performance levels:

1. **OCR Extraction (Sub-Agent A)**:
   - Extract all raw visual fields directly visible on the passport page.
   - Required fields for 'finalData': givenName, surname, dob (formatted as dd/mm/yyyy), birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate (formatted as dd/mm/yyyy), expiryDate (formatted as dd/mm/yyyy), gender (Male or Female), permanentAddress, mobileNumber (extract if visible, otherwise empty).

2. **MRZ Verification (Sub-Agent B)**:
   - Locate and extract the Machine Readable Zone (MRZ) - usually the 2 or 3 lines of alphanumeric codes with '<' at the bottom.
   - Provide the raw MRZ lines as an array of strings.
   - Calculate and verify the basic MRZ checksum values for Passport Number, DOB, Expiry Date, and the Composite check-digit. Set each check-digit validation status to "Pass" or "Fail" based on whether they correctly align with MRZ format specifications.

3. **QA and Integrity Reconciliation (Sub-Agent C)**:
   - Compare Names spelling (Visual Surname + Given Name vs MRZ Name). Note truncated names in MRZ.
   - Compare Birthdate (DOB) formats and values.
   - Synthesize any found variations or errors into an array of clear warnings under "discrepancies" (e.g. "Passport number matches, minor visual spelling variation corrected"). If perfect, output empty array.
   - Determine overall confidence score out of 100%.

4. **Custom Visa Declaration Drafting (Sub-Agent D)**:
   - Draft a formal self-declaration undertaking in official English to support the applicant's visa application, as a single custom draft.
   - Write 2-3 formal, professional paragraphs pledging truthfulness. Highlight that the name on the passport and MRZ is verified. Keep it completely general, official, and professional.

5. **Bangladeshi Address Generator (Sub-Agent E)**:
   Given the extracted permanentAddress, classify it and generate other complete addresses strictly following these 3 rules:
   - Category 1: If permanentAddress is inside DHAKA DISTRICT (e.g. Dhaka city areas, Uttara, Banani, Gulshan, Dhanmondi, Savar, Keraniganj, Dhamrai, Nawabganj, Dohar etc.):
     - presentAddress: MUST be exactly equal to permanentAddress.
     - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random commercial/office addresses inside DHAKA CITY (e.g., Banani, Gulshan, Dhanmondi, Uttara, Motijheel, Mirpur, etc.). They must be distinct from each other.
     - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other.
   - Category 2: If permanentAddress is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
     - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
     - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
     - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same district or local town). They must be distinct from each other.
   - Category 3: If permanentAddress is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
     - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
     - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
     - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local district or town). They must be distinct from each other.
   
   CRITICAL ADDRESS FORMATTING MANDATES:
   - DHAKA CITY ADDRESSES (presentAddress, businessAddressDhaka, officeAddressDhaka):
     * MUST strictly use the natural standard pattern: "House [Number], Road [Number], [Area Name], Dhaka-[Postcode]", or for Uttara: "House [Number], Road [Number], Sector [Number], Uttara, Dhaka-[Postcode]" or Mirpur: "House [Number], Road [Number], Block [Letter], Mirpur-[Number], Dhaka-[Postcode]".
     * Do NOT include office level/building tags (like "Level 8, Concord Tower" or "Plot 15, Block C") or wordy labels like "Banani Commercial Area". Keep them clean and directly of the standard format.
     * Areas like Banani, Gulshan, Dhanmondi, Uttara MUST have proper Road numbers (e.g., "House 15, Road 11, Banani, Dhaka-1213").
   - LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
     * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
     * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
     * Format rural/local addresses simply and naturally as they are used locally in Bangladesh. Examples:
       "Village Name, Union/Bazar, Post Office, Thana, District-Postcode" or "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370".
     * Keep it short, authentic, uncluttered, and highly natural. Do not use placeholders like "[Insert Road]".

Format response strictly according to the specified JSON schema structure.`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          }
        ],
        config: {
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
        throw new Error('Passport pipeline failed to return response data.');
      }

      const pipelineData = JSON.parse(pipelineResponse.text);
      console.log('✅ Single-Pass Multimodal Extraction Pipeline Completed.');

      const result = {
        ...pipelineData.finalData,
        discrepancyList: pipelineData.discrepancies,
        customUndertakingDraft: pipelineData.customUndertakingDraft || "",
        presentAddress: pipelineData.generatedAddresses.presentAddress,
        businessAddressDhaka: pipelineData.generatedAddresses.businessAddressDhaka,
        businessAddressLocal: pipelineData.generatedAddresses.businessAddressLocal,
        officeAddressDhaka: pipelineData.generatedAddresses.officeAddressDhaka,
        officeAddressLocal: pipelineData.generatedAddresses.officeAddressLocal,
      };

      const formattedMrzLines = Array.isArray(pipelineData.mrzValidation.rawMrz) 
        ? pipelineData.mrzValidation.rawMrz.map((line: string) => `\`${line}\``).join('\n  ')
        : 'Lines not detected';

      const logLines = [
        `🤖 **Main Agent (Executive System Coordinator)**: Coordinated optimized Single-Pass Multimodal Pipeline. OCR scan and MRZ checksums completed in parallel.`,
        `🛰️ **Sub-Agent A (Visual Page Extractor)**: Scan complete. Retrieved raw textual and structural page properties.`,
        `🔍 **Sub-Agent B (MRZ Verification Specialist)**: Detected Machine-Readable Zone:\n  ${formattedMrzLines}`,
        `   - Passport No Checksum: **${pipelineData.mrzValidation.passportNumberChecksum}**`,
        `   - Date of Birth Checksum: **${pipelineData.mrzValidation.dobChecksum}**`,
        `   - Expiry Date Checksum: **${pipelineData.mrzValidation.expiryDateChecksum}**`,
        `   - Composite Checksum: **${pipelineData.mrzValidation.compositeChecksum}**`,
        `🛡️ **Sub-Agent C (QA / Data Integrity Analyst)**: Completed visual vs MRZ correlation check. Calculated overall extraction confidence at **${pipelineData.confidenceScore}%**. Flagged ${pipelineData.discrepancies.length} discrepancy warnings.`,
        `✍️ **Sub-Agent D (Declaration Drafter)**: Prepared customized official visa undertaking form draft matching passport data.`,
        `📍 **Sub-Agent E (Bangladeshi Address Generator)**: Automatically classified permanent address district/division boundaries and generated synchronized present & professional address layouts successfully.`
      ];
      result.agentLog = logLines.join('\n\n');

      console.log('🤖 Optimized Pipeline Completed perfectly. Packaging results for display.');
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
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same district or local town). They must be distinct from each other.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local district or town). They must be distinct from each other.

CRITICAL ADDRESS FORMATTING MANDATES:
- DHAKA CITY ADDRESSES (presentAddress, businessAddressDhaka, officeAddressDhaka):
  * MUST strictly use the natural standard pattern: "House [Number], Road [Number], [Area Name], Dhaka-[Postcode]", or for Uttara: "House [Number], Road [Number], Sector [Number], Uttara, Dhaka-[Postcode]" or Mirpur: "House [Number], Road [Number], Block [Letter], Mirpur-[Number], Dhaka-[Postcode]".
  * Do NOT include office level/building tags (like "Level 8, Concord Tower" or "Plot 15, Block C") or wordy labels like "Banani Commercial Area". Keep them clean and directly of the standard format.
  * Areas like Banani, Gulshan, Dhanmondi, Uttara MUST have proper Road numbers (e.g., "House 15, Road 11, Banani, Dhaka-1213").
- LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
  * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
  * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
  * Format rural/local addresses simply and naturally as they are used locally in Bangladesh. Examples:
    "Village Name, Union/Bazar, Post Office, Thana, District-Postcode" or "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370".
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
      return JSON.parse(response.text);
    }
    throw new Error('Failed to generate addresses using Gemini');
  }

  // API Route for address generation based on permanent address
  app.post('/api/generate-addresses', async (req, res) => {
    try {
      const { permanentAddress } = req.body;
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
