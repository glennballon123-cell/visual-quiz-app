// src/utils/cloudAI.js - Fast Cloud AI
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

class CloudAI {
  constructor() {
    this.model = null;
    this.isReady = false;
  }

  async init() {
    try {
      this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.isReady = true;
      console.log("Cloud AI Ready!");
      return true;
    } catch (error) {
      console.error("Cloud AI init failed:", error);
      return false;
    }
  }

  async analyzeImageFast(imageDataUrl, question = "What is in this image?") {
    if (!this.isReady) {
      await this.init();
    }

    const startTime = performance.now();
    
    try {
      const base64Data = imageDataUrl.split(',')[1];
      
      const prompt = `${question} Answer in 10 words or less. Be specific.`;
      
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ]);
      
      const answer = result.response.text();
      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);
      
      return {
        answer: answer,
        processingTime: `${processingTime}ms`,
        confidence: "High"
      };
    } catch (error) {
      console.error("Analysis failed:", error);
      return {
        answer: "Analysis failed. Please try again.",
        processingTime: "Error",
        confidence: "Low"
      };
    }
  }
}

export const cloudAI = new CloudAI();