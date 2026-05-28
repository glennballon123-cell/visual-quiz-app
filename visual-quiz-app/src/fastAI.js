// src/utils/fastAI.js - Optimized for MAXIMUM SPEED
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';

// Force WebGL backend for fastest performance
await tf.setBackend('webgl');
await tf.ready();

class FastImageAI {
  constructor() {
    this.model = null;
    this.isLoading = true;
    this.loadPromise = null;
  }

  // Load model once and cache it
  async loadModel() {
    if (this.model) return this.model;
    
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        try {
          // Use lighter model configuration
          this.model = await mobilenet.load({
            version: 1,
            alpha: 0.25 // Smaller alpha = faster but slightly less accurate
          });
          this.isLoading = false;
          console.log('Fast AI Model ready!');
          return this.model;
        } catch (error) {
          console.error('Model load failed:', error);
          this.isLoading = false;
          return null;
        }
      })();
    }
    
    return this.loadPromise;
  }

  // Ultra-fast image analysis
  async analyzeImageFast(imageElement) {
    if (!this.model) {
      await this.loadModel();
    }
    
    if (!this.model) {
      return "AI model failed to load";
    }
    
    const startTime = performance.now();
    
    // Resize image for faster processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Downsample to 224x224 (MobileNet input size)
    canvas.width = 224;
    canvas.height = 224;
    ctx.drawImage(imageElement, 0, 0, 224, 224);
    
    // Create tensor from canvas
    const tensor = tf.browser.fromPixels(canvas);
    
    // Classify with optimized settings
    const predictions = await this.model.classify(tensor);
    
    // Clean up tensor to prevent memory leaks
    tensor.dispose();
    
    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);
    
    if (predictions && predictions.length > 0) {
      const top3 = predictions.slice(0, 3);
      let result = `🎯 **Top Match:** ${top3[0].className} (${Math.round(top3[0].probability * 100)}%)\n`;
      
      if (top3.length > 1) {
        result += `📌 **Also possible:** ${top3[1].className} (${Math.round(top3[1].probability * 100)}%)\n`;
      }
      
      result += `⚡ **Processed in:** ${processingTime}ms`;
      
      return {
        answer: result,
        topMatch: top3[0].className,
        confidence: Math.round(top3[0].probability * 100),
        processingTime: processingTime
      };
    }
    
    return {
      answer: "Could not identify image",
      confidence: 0,
      processingTime: processingTime
    };
  }
}

export const fastAI = new FastImageAI();