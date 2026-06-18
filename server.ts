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

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          success: false,
          error: 'GEMINI_API_KEY is missing in your server environment variables. Please go to your Render Dashboard -> Environment tab, and add GEMINI_API_KEY with your API key from Google AI Studio.' 
        });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
              permanentAddress: { type: Type.STRING, description: "Full permanent address" },
              presentAddress: { type: Type.STRING, description: "Full present address (if available on the document)" },
              emergencyContactAddress: { type: Type.STRING, description: "Full emergency contact address or details (if available on the document)" },
              fatherName: { type: Type.STRING, description: "Father's name" },
              motherName: { type: Type.STRING, description: "Mother's name" },
              spouseName: { type: Type.STRING, description: "Spouse's name (if any, otherwise empty)" },
              passportNumber: { type: Type.STRING, description: "Alphanumeric passport number" },
              nidOrBirthCertNumber: { type: Type.STRING, description: "National ID / NID or Personal No." },
              issueDate: { type: Type.STRING, description: "Date of issue (must be formatted as dd/mm/yyyy)" },
              expiryDate: { type: Type.STRING, description: "Date of expiry (must be formatted as dd/mm/yyyy)" },
              mobileNumber: { type: Type.STRING, description: "Mobile number if visible anywhere, otherwise empty" }
            },
            required: [
              "givenName", "surname", "dob", "birthPlace", 
              "permanentAddress", "fatherName", "motherName", 
              "spouseName", "passportNumber", "nidOrBirthCertNumber", 
              "issueDate", "expiryDate", "mobileNumber"
            ]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        res.json({ success: true, data: result });
      } else {
        res.status(500).json({ error: 'Failed to extract data from image' });
      }

    } catch (error: any) {
      console.error('Extraction Error:', error);
      
      let errorMessage = 'Server error during extraction';
      
      // Try to parse clean error message from Gemini API response
      if (error && error.message) {
        if (error.message.includes('503') || error.message.includes('high demand') || error.message.includes('UNAVAILABLE')) {
          errorMessage = 'The AI system is currently experiencing high demand. Please try again in a few moments.';
        } else {
          // If the error message is a JSON string, try to parse it
          try {
            // Find JSON-like structure in the error message string
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
