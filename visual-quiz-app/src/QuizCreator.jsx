// src/components/QuizCreator.jsx - With Auto AI Detection & Image Compression
import React, { useState } from 'react';

const QuizCreator = ({ onAddQuiz, isAnalyzing }) => {
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [autoDetect, setAutoDetect] = useState(true);

  // OPTIMIZED: Compresses images locally using Canvas before API transit
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimension bounds for scaling down
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          
          // Constrain layout dimensions proportionally
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Paint and condense data down onto Canvas surface
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress structural output to JPEG at 70% quality scale
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          setImageDataUrl(compressedDataUrl);
          setImagePreview(compressedDataUrl);
          
          // Clear previous answer when new image uploaded
          if (autoDetect) {
            setAnswerText('AI will analyze this image...');
          }
        };
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!imageDataUrl) {
      alert('Please upload an image');
      return;
    }
    
    const newQuiz = {
      question: questionText.trim(),
      answer: answerText.trim(),
      imageUrl: imageDataUrl,
      createdAt: new Date().toISOString()
    };
    
    await onAddQuiz(newQuiz, autoDetect);
    
    // Reset form
    setQuestionText('');
    setAnswerText('');
    setImageDataUrl('');
    setImagePreview('');
    
    const fileInput = document.getElementById('image-input');
    if (fileInput) fileInput.value = '';
  };

  const triggerFileUpload = () => {
    document.getElementById('image-input').click();
  };

  return (
    <section className="card" aria-label="Quiz creation form">
      <div className="card-header">
        <h2>🤖 AI-Powered Quiz Creator</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="image-upload-area" onClick={triggerFileUpload}>
            <div className="upload-icon">🖼️</div>
            <p>Click to upload an image</p>
            <p className="text-muted">Supports JPG, PNG, GIF - AI will analyze automatically!</p>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              aria-label="Upload quiz image"
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Uploaded visual" />
              </div>
            )}
          </div>

          {/* Auto-detect toggle */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoDetect} 
                onChange={(e) => setAutoDetect(e.target.checked)}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              🤖 Auto-detect answer from image (AI analyzes automatically)
            </label>
            <p className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
              When enabled, AI will automatically identify what's in the image
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="question">Question / Prompt (optional)</label>
            <input
              id="question"
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., What is shown in this image? (leave empty for auto)"
              disabled={isAnalyzing}
            />
          </div>

          <div className="input-group">
            <label htmlFor="answer">
              Correct Answer {autoDetect && <span style={{ color: '#a78bfa' }}>(AI will generate)</span>}
            </label>
            <textarea
              id="answer"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={autoDetect ? "AI will automatically analyze the image..." : "Enter the correct answer"}
              disabled={isAnalyzing || autoDetect}
            />
          </div>

          <button type="submit" className="button-primary" disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>🤖 AI Analyzing Image...</>
            ) : (
              <>✨ Create AI Quiz Card</>
            )}
          </button>
          
          {isAnalyzing && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              AI is analyzing your image...
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default QuizCreator;