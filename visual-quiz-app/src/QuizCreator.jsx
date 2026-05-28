// src/components/QuizCreator.jsx - With Streaming UI
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const QuizCreator = ({ onAddQuiz, isAnalyzing, modelLoading, streamingAnswer, analysisProgress }) => {
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [autoDetect, setAutoDetect] = useState(true);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImageDataUrl(dataUrl);
        setImagePreview(dataUrl);
        
        if (autoDetect) {
          setAnswerText('🤖 AI will analyze this image with streaming response...');
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
    
    await onAddQuiz(newQuiz, autoDetect);
    
    // Only reset if not auto-detecting or if auto-detect is off
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
    <section className="card" aria-label="Quiz creation form">
      <div className="card-header">
        <h2>🤖 AI-Powered Quiz Creator</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="image-upload-area" onClick={triggerFileUpload}>
            <div className="upload-icon">🖼️</div>
            <p>Click to upload an image</p>
            <p className="text-muted">Supports JPG, PNG, GIF - AI will stream analysis in real-time!</p>
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

          {/* Model status */}
          {modelLoading && (
            <div className="model-loading">
              <div className="loading-spinner"></div>
              <p>Loading AI model with WebGL acceleration...</p>
            </div>
          )}

          {/* Streaming AI Analysis Display */}
          {isAnalyzing && streamingAnswer && (
            <div className="streaming-analysis">
              <div className="streaming-header">
                <span>🤖 AI Streaming Analysis</span>
                <span className="progress-badge">{analysisProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${analysisProgress}%` }}></div>
              </div>
              <div className="streaming-content">
                <ReactMarkdown>{streamingAnswer}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Auto-detect toggle */}
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={autoDetect} 
                onChange={(e) => setAutoDetect(e.target.checked)}
                style={{ width: 'auto', marginRight: '0.5rem' }}
              />
              🚀 Async AI with Real-time Streaming
            </label>
            <p className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
              AI analyzes with progress updates and streams results in real-time
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="question">Question / Prompt (optional)</label>
            <input
              id="question"
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., What is shown in this image?"
              disabled={isAnalyzing}
            />
          </div>

          <div className="input-group">
            <label htmlFor="answer">
              Correct Answer {autoDetect && <span style={{ color: '#a78bfa' }}>(AI streams response)</span>}
            </label>
            <textarea
              id="answer"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder={autoDetect ? "AI will stream the analysis in real-time..." : "Enter the correct answer"}
              disabled={isAnalyzing || autoDetect}
            />
          </div>

          <button type="submit" className="button-primary" disabled={isAnalyzing || modelLoading}>
            {modelLoading ? (
              <>📥 Loading AI Model...</>
            ) : isAnalyzing ? (
              <>⚡ AI Streaming Analysis... {analysisProgress}%</>
            ) : (
              <>✨ Create Quiz with Async AI</>
            )}
          </button>
          
          {isAnalyzing && (
            <div className="analyzing-status">
              <div className="pulse-dot"></div>
              <p>AI is processing with async streaming...</p>
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default QuizCreator;