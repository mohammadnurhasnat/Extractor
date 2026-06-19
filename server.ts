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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            text: `Extract the requested information from this passport image. 
            If any information is not clearly visible or not present, return an empty string "".
            CRITICAL: All date fields (dob, issueDate, expiryDate) MUST be strictly formatted as dd/mm/yyyy.
            Return ONLY the raw data corresponding to the fields, properly formatted.`
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
              givenName: { type: Type.STRING, description: "First name and middle name(s)" },
              surname: { type: Type.STRING, description: "Last name" },
              dob: { type: Type.STRING, description: "Date of Birth (must be formatted as dd/mm/yyyy)" },
              birthPlace: { type: Type.STRING, description: "Place of birth (e.g., DHAKA)" },
              fatherName: { type: Type.STRING, description: "Father's name" },
              motherName: { type: Type.STRING, description: "Mother's name" },
              spouseName: { type: Type.STRING, description: "Spouse's name (if any, otherwise empty)" },
              passportNumber: { type: Type.STRING, description: "Alphanumeric passport number" },
              nidOrBirthCertNumber: { type: Type.STRING, description: "National ID / NID or Personal No." },
              issueDate: { type: Type.STRING, description: "Date of issue (must be formatted as dd/mm/yyyy)" },
              expiryDate: { type: Type.STRING, description: "Date of expiry (must be formatted as dd/mm/yyyy)" },
              gender: { type: Type.STRING, description: "Gender or Sex (Extract M or F from the image, Male is M, Female is F, then convert to 'Male' or 'Female')" },
              mobileNumber: { type: Type.STRING, description: "Mobile number if visible anywhere, otherwise empty" },
              permanentAddress: { type: Type.STRING, description: "Full permanent address of the passport bearer" }
            },
            required: [
              "givenName", "surname", "dob", "birthPlace", 
              "fatherName", "motherName", 
              "spouseName", "passportNumber", "nidOrBirthCertNumber", 
              "issueDate", "expiryDate", "mobileNumber", "gender", "permanentAddress"
            ]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        
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

        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: 'Failed to extract data from image' });
      }

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
