// src/cloudAI.js (directly in src folder, NOT in utils)

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

class CloudAI {
  constructor() {
    this.isReady = false;
  }

  async init() {
    if (!API_KEY) {
      console.error("Cloud AI init failed: Missing VITE_GEMINI_API_KEY in .env file");
      return false;
    }
    this.isReady = true;
    console.log("Cloud AI Direct Fetch Client Ready!");
    return true;
  }

  async analyzeImageFast(imageDataUrl, question = "What is in this image?") {
    if (!this.isReady) {
      await this.init();
    }

    const startTime = performance.now();
    
    try {
      // 1. Extract the raw Base64 data from the canvas Data URL string
      const base64Data = imageDataUrl.split(',')[1];
      if (!base64Data) {
        throw new Error("Invalid image data format received.");
      }
      
      // 2. Structure the clean JSON payload exactly how Google wants it
      const prompt = `${question} Answer in 10 words or less. Be specific.`;
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ]
      };

      // 3. Directly target the v1beta endpoint to prevent the 404 version routing error
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // 4. Extract the generated text out of Google's nested response object
      const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response text generated.";
      
      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);
      
      return {
        answer: answer.trim(),
        processingTime: `${processingTime}ms`,
        confidence: "High"
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      return {
        answer: `Analysis failed: ${error.message}`,
        processingTime: "Error",
        confidence: "Low"
      };
    }
  }
}

export const cloudAI = new CloudAI();