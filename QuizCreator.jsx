// src/components/QuizCreator.jsx
import React, { useState } from 'react';

const QuizCreator = ({ onAddQuiz }) => {
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        setImageDataUrl(dataUrl);
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select a valid image file (JPEG, PNG, etc.)');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }
    
    if (!answerText.trim()) {
      alert('Please enter an answer');
      return;
    }
    
    if (!imageDataUrl) {
      alert('Please upload an image for the quiz');
      return;
    }

    const newQuiz = {
      question: questionText.trim(),
      answer: answerText.trim(),
      imageUrl: imageDataUrl,
      createdAt: new Date().toISOString()
    };

    onAddQuiz(newQuiz);
    
    // Reset form
    setQuestionText('');
    setAnswerText('');
    setImageDataUrl('');
    setImagePreview('');
    
    // Clear file input
    const fileInput = document.getElementById('image-input');
    if (fileInput) fileInput.value = '';
  };

  const triggerFileUpload = () => {
    document.getElementById('image-input').click();
  };

  return (
    <section className="card" aria-label="Quiz creation form">
      <div className="card-header">
        <h2>✏️ Create New Visual Quiz</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="image-upload-area" onClick={triggerFileUpload}>
            <div className="upload-icon">🖼️</div>
            <p>Click to upload an image</p>
            <p className="text-muted">Supports JPG, PNG, GIF (max 5MB)</p>
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
                <img src={imagePreview} alt="Quiz visual preview" />
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="question">Question / Prompt</label>
            <input
              id="question"
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., What is shown in this image?"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="answer">Correct Answer</label>
            <textarea
              id="answer"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Enter the correct answer (will be revealed instantly when clicked)"
              required
            />
          </div>

          <button type="submit" className="button-primary">
            📌 Create Quiz Card
          </button>
        </form>
      </div>
    </section>
  );
};

export default QuizCreator;