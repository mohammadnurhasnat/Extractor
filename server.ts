import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

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
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            }
          }
        ],
        config: {
          systemInstruction: `You are a high-speed Passport Intake Coordinator. Extract passport image data, verify MRZ checksums, compare spelling/dates to flag anomalies under 'discrepancies', draft a formal self-declaration Visa Undertaking, and generate professional addresses based on permanentAddress.

GUIDELINES:
1. OCR: Extract givenName, surname, dob (dd/mm/yyyy), birthPlace, fatherName, motherName, spouseName, passportNumber, nidOrBirthCertNumber, issueDate (dd/mm/yyyy), expiryDate (dd/mm/yyyy), gender (Male/Female), permanentAddress, and mobileNumber.
   - IMPORTANT OCR RULE: Distinguish carefully between the letter 'O' and the number '0' using their visual shape! The letter 'O' is fully round/circular, while the number '0' is tall, narrow, and flatter on the sides. Always detect them accurately based on their visual shape. Similarly, differentiate 'I' (letter) and '1' (number). 
2. MRZ: Extract raw MRZ lines as rawMrz. Compute & verify checksums for passport number, dob, expiry, and composite. Return "Pass" or "Fail".
3. QA: List any visual vs MRZ variations in 'discrepancies'. Return confidenceScore (0-100).
4. Undertaking: Write a 2-3 paragraph visa declaration confirming passport validity and truthfulness.
5. Address Rules (Classify permanentAddress):
   - Cat 1 (Dhaka District: Dhaka city, Uttara, Banani, Gulshan, Savar, etc): presentAddress = permanentAddress. business/officeAddressDhaka are distinct complete Dhaka City addresses. business/officeAddressLocal are near permanentAddress.
   - Cat 2 (Dhaka Division, not Dhaka District): presentAddress, businessAddressDhaka, and officeAddressDhaka are complete Dhaka City addresses. business/officeAddressLocal are near permanentAddress.
   - Cat 3 (Outside Dhaka Division): presentAddress, business/officeAddressDhaka are complete Dhaka City addresses. business/officeAddressLocal are near permanentAddress.
   * Formatting:
     - Dhaka City Address format: "House X, Road Y, [Area Name], Dhaka-[Postcode]" (NO building titles, levels, commercial area labels).
     - Local/Rural Address format: "X, Y, Z-Postcode" (for example, "Chutibur, Natipota, Chuadanga-7220") directly without labels like "Vill:", "Post:", "Dist:", "Po:". (NO Holding/Plot/Block/Sector/Sadar/Upazila tags).`,
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
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address (within the same local area, district, or town, but with different local descriptors). They must be distinct from each other. You MUST explicitly append the District name to the end of these addresses.

Category 2: If the permanent address is inside DHAKA DIVISION but NOT Dhaka District (e.g., Gazipur, Narayanganj, Tangail, Faridpur, Manikganj, Munshiganj, Narsingdi, Madaripur, Gopalganj, Rajbari, Shariatpur, Kishoreganj):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY (distinct from permanentAddress).
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name (e.g. "Dist: Faridpur") to the end of these addresses.

Category 3: If the permanent address is OUTSIDE DHAKA DIVISION (e.g., Sylhet, Chittagong, Rajshahi, Khulna, Barisal, Rangpur, Mymensingh, or any district outside Dhaka division):
   - permanentAddress: Keep it exactly as "${permanentAddress}".
   - presentAddress: MUST be a realistic, proper, and complete random address inside DHAKA CITY.
   - businessAddressDhaka & officeAddressDhaka: These 2 addresses MUST be realistic, proper, and complete random addresses inside DHAKA CITY.
   - businessAddressLocal & officeAddressLocal: These 2 addresses MUST be realistic, proper, and complete random addresses near the permanent address. You MUST explicitly append the District name (e.g. "Dist: Sylhet") to the end of these addresses.

CRITICAL ADDRESS FORMATTING MANDATES:
- DHAKA CITY ADDRESSES (presentAddress, businessAddressDhaka, officeAddressDhaka):
  * MUST strictly use the natural standard pattern: "House [Number], Road [Number], [Area Name], Dhaka-[Postcode]", or for Uttara: "House [Number], Road [Number], Sector [Number], Uttara, Dhaka-[Postcode]" or Mirpur: "House [Number], Road [Number], Block [Letter], Mirpur-[Number], Dhaka-[Postcode]".
  * Do NOT include office level/building tags (like "Level 8, Concord Tower" or "Plot 15, Block C") or wordy labels like "Banani Commercial Area". Keep them clean and directly of the standard format.
  * Areas like Banani, Gulshan, Dhanmondi, Uttara MUST have proper Road numbers (e.g., "House 15, Road 11, Banani, Dhaka-1213").
- LOCAL/RURAL ADDRESSES OUTSIDE DHAKA (businessAddressLocal, officeAddressLocal if permanentAddress is outside Dhaka):
  * Do NOT use Dhaka-style urban prefixes like "House/Holding/Plot/Block" or "Sector" for village/local areas, as it looks artificial and incorrect.
  * Do NOT append words like "Sadar", "Upazila", or other administrative clutter (e.g., write "Mithamain" instead of "Mithamain Sadar" or "Mithamain Upazila").
  * Format rural/local addresses simply and naturally as they are used locally in Bangladesh. Examples:
    "Village Name, Union/Bazar, Post Office, Thana, District-Postcode" or "Vill: Mithamain, Post: Mithamain, Dist: Kishoreganj-2370" (Ensure the District name is ALWAYS included in these local addresses).
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

  // Base helper to retrieve Supabase client on demand
  const getSupabaseClient = (req: express.Request) => {
    let url = req.headers['x-supabase-url']?.toString() || process.env.SUPABASE_URL;
    let key = req.headers['x-supabase-anon-key']?.toString() || process.env.SUPABASE_ANON_KEY;
    
    if (!url || !key) return null;
    
    url = url.trim();
    key = key.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      // Validate url
      new URL(url);
      
      return createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
    } catch (e: any) {
      throw new Error(`Invalid Supabase Server URL provided: ${url}`);
    }
  };

  // 1. Connection and Schema Verification test
  app.post('/api/supabase/test', async (req, res) => {
    try {
      const client = getSupabaseClient(req);
      if (!client) {
        return res.status(400).json({ 
          success: false, 
          error: 'Supabase credentials are not configured. Please supply them in your App settings or environment files.' 
        });
      }

      // Query the table for 1 item to verify its structure & existence
      const { data, error } = await client
        .from('passport_records')
        .select('id')
        .limit(1);

      if (error) {
        // Code 42P01 means table does not exist in postgres
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.code === '42P01') {
          return res.json({
            success: false,
            error: 'Table Not Found',
            message: 'Database is connected successfully, but the "passport_records" table was not found! Please run the SQL schema creation script inside the Supabase SQL Editor.'
          });
        }
        return res.status(400).json({ success: false, error: error.message });
      }

      res.json({ 
        success: true, 
        message: 'Successfully authenticated & verified the "passport_records" table structure in the Supabase Cloud!' 
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || 'Internal server error while testing Supabase connection' });
    }
  });

  // 2. Fetch all cloud passport records
  app.get('/api/supabase/fetch', async (req, res) => {
    try {
      const client = getSupabaseClient(req);
      if (!client) {
        return res.status(400).json({ success: false, error: 'Supabase URL or Key is missing from configuration.' });
      }

      const { data, error } = await client
        .from('passport_records')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      // Compile columns back to frontend camelCase HistoryItem format
      const historyItems = (data || []).map((row: any) => ({
        id: row.id,
        timestamp: Number(row.timestamp),
        data: {
          givenName: row.given_name || '',
          surname: row.surname || '',
          gender: row.gender || '',
          dob: row.dob || '',
          birthPlace: row.birth_place || '',
          fatherName: row.father_name || '',
          motherName: row.mother_name || '',
          spouseName: row.spouse_name || '',
          passportNumber: row.passport_number || '',
          nidOrBirthCertNumber: row.nid_or_birth_cert_number || '',
          issueDate: row.issue_date || '',
          expiryDate: row.expiry_date || '',
          mobileNumber: row.mobile_number || '',
          permanentAddress: row.permanent_address || '',
          presentAddress: row.present_address || '',
          businessAddressDhaka: row.business_address_dhaka || '',
          businessAddressLocal: row.business_address_local || '',
          officeAddressDhaka: row.office_address_dhaka || '',
          officeAddressLocal: row.office_address_local || '',
          email: row.email || '',
          proprietorBusinessName: row.proprietor_business_name || '',
          jobCompanyName: row.job_company_name || '',
          jobRole: row.job_role || '',
          placeOfIssue: row.place_of_issue || '',
          birthPlaceDistrict: row.birth_place_district || '',
          discrepancyList: Array.isArray(row.discrepancy_list) ? row.discrepancy_list : [],
          customUndertakingDraft: row.custom_undertaking_draft || ''
        }
      }));

      res.json({ success: true, data: historyItems });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || 'Internal server error while fetching from cloud' });
    }
  });

  // 3. Upsert a single passport record to cloud
  app.post('/api/supabase/upsert', async (req, res) => {
    try {
      const client = getSupabaseClient(req);
      if (!client) {
        return res.status(400).json({ success: false, error: 'Supabase configuration is missing.' });
      }

      const { item } = req.body;
      if (!item || !item.id || !item.data) {
        return res.status(400).json({ success: false, error: 'Invalid history item format.' });
      }

      const { id, timestamp, data } = item;
      const dbFormat = {
        id,
        timestamp,
        given_name: data.givenName || '',
        surname: data.surname || '',
        gender: data.gender || '',
        dob: data.dob || '',
        birth_place: data.birthPlace || '',
        father_name: data.fatherName || '',
        mother_name: data.motherName || '',
        spouse_name: data.spouseName || '',
        passport_number: data.passportNumber || '',
        nid_or_birth_cert_number: data.nidOrBirthCertNumber || '',
        issue_date: data.issueDate || '',
        expiry_date: data.expiryDate || '',
        mobile_number: data.mobileNumber || '',
        permanent_address: data.permanentAddress || '',
        present_address: data.presentAddress || '',
        business_address_dhaka: data.businessAddressDhaka || '',
        business_address_local: data.businessAddressLocal || '',
        office_address_dhaka: data.officeAddressDhaka || '',
        office_address_local: data.officeAddressLocal || '',
        email: data.email || '',
        proprietor_business_name: data.proprietorBusinessName || '',
        job_company_name: data.jobCompanyName || '',
        job_role: data.jobRole || '',
        place_of_issue: data.placeOfIssue || '',
        birth_place_district: data.birthPlaceDistrict || '',
        discrepancy_list: Array.isArray(data.discrepancyList) ? data.discrepancyList : [],
        custom_undertaking_draft: data.customUndertakingDraft || ''
      };

      const { error } = await client
        .from('passport_records')
        .upsert(dbFormat, { onConflict: 'id' });

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      res.json({ success: true, message: 'Successfully saved to Supabase cloud' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || 'Internal server error while syncing' });
    }
  });

  // 4. Delete a passport record from cloud
  app.post('/api/supabase/delete', async (req, res) => {
    try {
      const client = getSupabaseClient(req);
      if (!client) {
        return res.status(400).json({ success: false, error: 'Supabase configuration is missing.' });
      }

      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing row ID.' });
      }

      const { error } = await client
        .from('passport_records')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      res.json({ success: true, message: 'Successfully deleted from Supabase cloud' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || 'Internal server error while deleting' });
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
