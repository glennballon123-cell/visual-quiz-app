// src/components/QuizCreator.jsx - Fast Cloud AI
import React, { useState } from 'react';

const QuizCreator = ({ onAddQuiz, isAnalyzing, aiReady, processingTime }) => {
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [autoDetect, setAutoDetect] = useState(true);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImageDataUrl(dataUrl);
        setImagePreview(dataUrl);
        
        if (autoDetect && aiReady) {
          setAnswerText('☁️ Cloud AI will analyze instantly...');
        }
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
    
    await onAddQuiz(newQuiz, autoDetect && aiReady);
    
    if (!autoDetect) {
      setQuestionText('');
      setAnswerText('');
      setImageDataUrl('');
      setImagePreview('');
      
      const fileInput = document.getElementById('image-input');
      if (fileInput) fileInput.value = '';
    }
  };

  const triggerFileUpload = () => {
    document.getElementById('image-input').click();
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2>☁️ Cloud AI Quiz Creator</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="image-upload-area" onClick={triggerFileUpload}>
            <div className="upload-icon">☁️</div>
            <p>Click to upload an image</p>
            <p className="text-muted">Google's Cloud AI - Lightning fast! ⚡</p>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          {processingTime && (
            <div className="fast-badge">
              ⚡ Cloud AI answered in {processingTime}!
            </div>
          )}

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoDetect} 
                onChange={(e) => setAutoDetect(e.target.checked)}
                style={{ width: 'auto' }}
                disabled={!aiReady}
              />
              ☁️ Cloud AI Recognition (Fast - Google Servers)
            </label>
          </div>

          <div className="input-group">
            <label>Question (optional)</label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="What is shown in this image?"
              disabled={isAnalyzing}
            />
          </div>

          <div className="input-group">
            <label>Answer {autoDetect && "(Cloud AI generates)"}</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={autoDetect ? "Cloud AI will identify instantly..." : "Enter answer"}
              disabled={isAnalyzing || autoDetect}
              rows="3"
            />
          </div>

          <button 
            type="submit" 
            className="button-primary" 
            disabled={isAnalyzing || (!aiReady && autoDetect)}
          >
            {isAnalyzing ? (
              <>☁️ Cloud AI Analyzing...</>
            ) : !aiReady && autoDetect ? (
              <>⏳ Connecting to Cloud...</>
            ) : (
              <>✨ Create Quiz (Fast)</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default QuizCreator;