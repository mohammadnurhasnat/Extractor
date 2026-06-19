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

      console.log('🤖 Multi-Agent Pipeline Started: Main Agent Coordinating.');

      // --- STAGE 1: Combined Dual-Agent Multimodal Scan (Sub-Agent A & B) ---
      // This combined call lets both image-level agents process the image parallelly 
      // in a single API pass to save substantial image-token costs.
      const intakeResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            text: `You are the Multi-Agent Passport Intake Coordinator. 
            You are running two specialized sub-agents in parallel to process this passport image:
            
            1. **Sub-Agent A (Visual OCR Checker)**:
               - Extract all raw visual fields directly visible on the passport page.
               - Fields required: givenName, surname, dob (formatted as dd/mm/yyyy), birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate (formatted as dd/mm/yyyy), expiryDate (formatted as dd/mm/yyyy), gender (Extract sex field as M or F or Male or Female), permanentAddress, mobileNumber (extract if visible, otherwise empty).
               
            2. **Sub-Agent B (MRZ Verification & Validation Specialist)**:
               - Locate and extract the Machine Readable Zone (MRZ) - usually the 2 or 3 lines of alphanumeric codes with '<' at the bottom.
               - Extract the raw MRZ lines as an array of strings.
               - Parse individual fields from the MRZ: passportNumber, dob (formatted as dd/mm/yyyy), expiryDate (formatted as dd/mm/yyyy), gender (M/F), surname, and givenName.
               - Calculate or verify basic MRZ checksum values for Passport Number check-digit, DOB check-digit, Expiry Date check-digit, and the Composite check-digit. 
               - Set each check-digit validation status to "Pass" or "Fail" based on whether they correctly align with MRZ format specifications.
            
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
              subAgentA: {
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
              subAgentB: {
                type: Type.OBJECT,
                properties: {
                  rawMrz: { type: Type.ARRAY, items: { type: Type.STRING } },
                  parsedFields: {
                    type: Type.OBJECT,
                    properties: {
                      passportNumber: { type: Type.STRING },
                      dob: { type: Type.STRING },
                      expiryDate: { type: Type.STRING },
                      gender: { type: Type.STRING },
                      surname: { type: Type.STRING },
                      givenName: { type: Type.STRING }
                    },
                    required: ["passportNumber", "dob", "expiryDate", "gender", "surname", "givenName"]
                  },
                  checksumStatus: {
                    type: Type.OBJECT,
                    properties: {
                      passportNumberChecksum: { type: Type.STRING, description: "Pass or Fail" },
                      dobChecksum: { type: Type.STRING, description: "Pass or Fail" },
                      expiryDateChecksum: { type: Type.STRING, description: "Pass or Fail" },
                      compositeChecksum: { type: Type.STRING, description: "Pass or Fail" }
                    },
                    required: ["passportNumberChecksum", "dobChecksum", "expiryDateChecksum", "compositeChecksum"]
                  }
                },
                required: ["rawMrz", "parsedFields", "checksumStatus"]
              }
            },
            required: ["subAgentA", "subAgentB"]
          }
        }
      });

      if (!intakeResponse.text) {
        throw new Error('Sub-Agent A & B failed to return scan data.');
      }

      const intakeData = JSON.parse(intakeResponse.text);
      console.log('✅ Stage 1 Complete: Visual and MRZ scan gathered.');

      // --- STAGE 2: QA and Integrity Reconciliation (Sub-Agent C) ---
      // This is a text-only call. It cross-checks Visual data against MRZ data,
      // reports mismatching spellings or format discrepancies, and computes a confidence score.
      const qaResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are **Sub-Agent C (QA / Verification Analyst)**.
        Analyze and reconcile the outputs from Sub-Agent A (Visual Page) and Sub-Agent B (MRZ Zone).
        
        Sub-Agent A (Visual OCR Check):
        ${JSON.stringify(intakeData.subAgentA, null, 2)}
        
        Sub-Agent B (MRZ Specialist Check):
        ${JSON.stringify(intakeData.subAgentB, null, 2)}
        
        Tasks:
        1. Compare Names spelling (Visual Surname + Given Name vs MRZ Name). Note truncated names in MRZ.
        2. Compare Birthdate (DOB) formats and values.
        3. Compare Passport Numbers, Sex/Gender, and Expiration Dates.
        4. Synthesize any found variations or errors into an array of clear warnings under "discrepancies". Write them in clear English (e.g. "Passport number matches, minor visual spelling variation corrected"). If perfect, output empty array.
        5. Formulate the ultimate correct dataset for "finalData", converting sex/gender code M/F to fully written "Male" or "Female", and dates to proper dd/mm/yyyy.
        6. Determine overall confidence score out of 100%.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              discrepancies: { type: Type.ARRAY, items: { type: Type.STRING } },
              confidenceScore: { type: Type.INTEGER },
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
              }
            },
            required: ["discrepancies", "confidenceScore", "finalData"]
          }
        }
      });

      if (!qaResponse.text) {
        throw new Error('Sub-Agent C failed to reconcile the parsed passport data.');
      }

      const qaData = JSON.parse(qaResponse.text);
      console.log('✅ Stage 2 Complete: QA Cross-Check completed.');

      // --- STAGE 3: Custom Visa Declaration Drafting (Sub-Agent D) ---
      // This is a text-only call. It drafts a general, highly professional undertaking 
      // based on the finalized dataset, strictly ignoring minor-age rules or single parent rules.
      const undertakingDraftResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `You are **Sub-Agent D (Declaration / Undertaking Generator)**.
        Your task is to draft a formal self-declaration undertaking in official English to support the applicant's visa application.
        
        Applicant Data:
        - Full Name: ${qaData.finalData.givenName} ${qaData.finalData.surname}
        - Passport Number: ${qaData.finalData.passportNumber}
        - Date of Birth: ${qaData.finalData.dob}
        - Gender: ${qaData.finalData.gender}
        - Place of Birth: ${qaData.finalData.birthPlace}
        
        Discrepancy warnings flagged: ${JSON.stringify(qaData.discrepancies)}
        
        STRICT CONSTRAINTS from the system design:
        1. Do NOT write automated parent/guardian clauses regardless of age.
        2. Do NOT omit spouse sections or add single-parent conditional formatting clauses.
        3. Keep the undertaking completely general, official, and professional for the applicant.
        
        Write 2-3 formal paragraphs. If there was a discrepancy reported in the names, add a supportive sentence confirming that the names represent the exact same individual and any differences are minor spelling variations in the digital scan process. Else, standard pledge of truthfulness.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              customDraft: { type: Type.STRING }
            },
            required: ["customDraft"]
          }
        }
      });

      const subAgentDData = undertakingDraftResponse.text ? JSON.parse(undertakingDraftResponse.text) : { customDraft: "" };
      console.log('✅ Stage 3 Complete: Undertaking draft created by Sub-Agent D.');

      // --- STAGE 4: Main Agent Coordination & Data Packaging ---
      // Combine results into final package, inject generated addresses and formatted coordination log
      const result = { ...qaData.finalData };
      result.discrepancyList = qaData.discrepancies;
      result.customUndertakingDraft = subAgentDData.customDraft || "";

      // Generate coordination logs in markdown
      const formattedMrzLines = Array.isArray(intakeData.subAgentB.rawMrz) 
        ? intakeData.subAgentB.rawMrz.map((line: string) => `\`${line}\``).join('\n  ')
        : 'Lines not detected';

      const logLines = [
        `🤖 **Main Agent (Executive System Coordinator)**: Initiated Multi-Agent Session. Coordinated parallel execution flows.`,
        `🛰️ **Sub-Agent A (Visual Page Extractor)**: Scan complete. Retrieved raw textual and structural page properties.`,
        `🔍 **Sub-Agent B (MRZ Verification Specialist)**: Detected Machine-Readable Zone:\n  ${formattedMrzLines}`,
        `   - Passport No Checksum: **${intakeData.subAgentB.checksumStatus.passportNumberChecksum}**`,
        `   - Date of Birth Checksum: **${intakeData.subAgentB.checksumStatus.dobChecksum}**`,
        `   - Expiry Date Checksum: **${intakeData.subAgentB.checksumStatus.expiryDateChecksum}**`,
        `   - Composite Checksum: **${intakeData.subAgentB.checksumStatus.compositeChecksum}**`,
        `🛡️ **Sub-Agent C (QA / Data Integrity Analyst)**: Completed visual vs MRZ correlation check. Calculated overall extraction confidence at **${qaData.confidenceScore}%**. Flagged ${qaData.discrepancies.length} discrepancy warnings.`,
        `✍️ **Sub-Agent D (Declaration Drafter)**: Prepared customized official visa undertaking form draft matching passport data.`
      ];
      result.agentLog = logLines.join('\n\n');

      // Now add addresses
      if (result.permanentAddress) {
        try {
          const enriched = await generateAddressesUsingGemini(ai, result.permanentAddress);
          result.presentAddress = enriched.presentAddress;
          result.businessAddressDhaka = enriched.businessAddressDhaka;
          result.businessAddressLocal = enriched.businessAddressLocal;
          result.officeAddressDhaka = enriched.officeAddressDhaka;
          result.officeAddressLocal = enriched.officeAddressLocal;
        } catch (addrErr) {
          console.error('Failed to pre-enrich addresses:', addrErr);
          result.presentAddress = '';
          result.businessAddressDhaka = '';
          result.businessAddressLocal = '';
          result.officeAddressDhaka = '';
          result.officeAddressLocal = '';
        }
      } else {
        result.presentAddress = '';
        result.businessAddressDhaka = '';
        result.businessAddressLocal = '';
        result.officeAddressDhaka = '';
        result.officeAddressLocal = '';
      }

      console.log('🤖 Multi-Agent Pipeline Completed. Packaging results for display.');
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
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY (e.g., Banani, Gulshan, Dhanmondi, Uttara, Motijheel, Mirpur, etc.) featuring proper House, Road, Area, and Zip Code. They must be distinct from each other.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same area or district, but with different building/road/holding numbers). They must be distinct from each other.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same district / local area, but different building/road/holding numbers). They must be distinct from each other.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local district, but different building/road/holding numbers). They must be distinct from each other.

CRITICAL INSTRUCTIONS FOR ALL GENERATED ADDRESSES:
- Each generated address MUST be a complete, realistic, and fully formatted Bangladeshi address including House/Holding number, Road, Area/Sector, Block (if applicable), Thana/Police Station, District, and Zip/Post Code of that specific area.
- Do not return placeholders like "[Insert Road]". Use actual real-sounding numbers and details.
- Avoid using exact same text/templates. All five addresses must be fully cohesive and professional.
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
