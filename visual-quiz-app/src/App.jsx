// src/App.jsx - SOLVES math problems IN images!
import React, { useState, useEffect } from 'react';
import { v4 as generateUniqueId } from 'uuid';

// ============ MATH SOLVER ============
const solveMathProblem = (problem) => {
  try {
    let equation = problem.replace(/\s/g, '');
    equation = equation.replace(/÷/g, '/');
    equation = equation.replace(/×/g, '*');
    equation = equation.replace(/\^/g, '**');
    equation = equation.replace(/(\d+)\(/g, '$1*(');
    equation = equation.replace(/\)(\d+)/g, ')*$1');
    
    const result = Function('"use strict";return (' + equation + ')')();
    return { answer: result.toString(), solved: true };
  } catch (error) {
    return { answer: null, solved: false };
  }
};

// ============ FLASHCARD ============
const Flashcard = ({ card, onFlip, isFlipped }) => {
  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={onFlip}>
      <div className="flashcard-inner">
        <div className="flashcard-front">
          {card.image && <img src={card.image} alt="Card" className="card-image" />}
          <h3>{card.question}</h3>
          <p className="flip-hint">👆 Click to reveal answer</p>
        </div>
        <div className="flashcard-back">
          <div className="answer-content">
            <h4>📖 Answer:</h4>
            <p>{card.answer}</p>
            {card.mathSolved && <span className="math-badge">🧮 Math</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ TYPING INDICATOR ============
const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <span></span><span></span><span></span><span>...</span>
    </div>
  );
};

// ============ MAIN AI PANEL ============
const AIAskPanel = ({ onAddToQuizlet }) => {
  const [question, setQuestion] = useState('');
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [mathMode, setMathMode] = useState(false);
  const [fullAnswer, setFullAnswer] = useState('');
  const [useManualMath, setUseManualMath] = useState(true);
  
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isMathProblem = (text) => {
    return /[\d\+\-\*\/\(\)\^÷×]/.test(text);
  };

  const simulateStreaming = async (text) => {
    const words = text.split(' ');
    let currentText = '';
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      currentText += (i === 0 ? words[i] : ' ' + words[i]);
      setStreamingAnswer(currentText);
      setFullAnswer(currentText);
    }
  };

  const askAI = async () => {
    let userQuestion = question || (imagePreview ? "What is shown?" : "Hello");
    
    if (!userQuestion.trim()) {
      alert("Please type a question");
      return;
    }
    
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    // CASE 1: Typed math problem
    if (useManualMath && !imagePreview && (mathMode || isMathProblem(userQuestion))) {
      setIsStreaming(true);
      const mathResult = solveMathProblem(userQuestion);
      if (mathResult.solved) {
        await simulateStreaming(mathResult.answer);
      } else {
        await simulateStreaming("Could not solve");
      }
      setIsStreaming(false);
      return;
    }
    
    // CASE 2: Image uploaded - SOLVE IT!
    if (imagePreview) {
      if (!apiKey) {
        setStreamingAnswer("⚠️ Add API key to .env");
        return;
      }
      
      setIsStreaming(true);
      setStreamingAnswer("");
      
      try {
        // Tell AI to SOLVE math problems in images
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `Look at this image. If it contains a math problem, CALCULATE and give ONLY the number answer.
If it's not math, identify the object in ONE word.
Examples:
- Image with "6 ÷ 2(1+2)" → 9
- Image of a dog → Dog
- Image of "5×3" → 15
- Image of a flower → Flower

ANSWER ONLY (no extra words):` 
                },
                { type: "image_url", image_url: { url: imageDataUrl } }
              ]
            }],
            max_tokens: 20,
            temperature: 0
          })
        });
        
        const data = await response.json();
        let answer = data.choices?.[0]?.message?.content || "?";
        answer = answer.replace(/answer[:\s]*/i, '').trim();
        
        await simulateStreaming(answer);
        
      } catch (error) {
        setStreamingAnswer("Error");
      } finally {
        setIsStreaming(false);
      }
      return;
    }
    
    // CASE 3: Text question
    if (!apiKey) {
      setStreamingAnswer("⚠️ Add API key to .env");
      return;
    }
    
    setIsStreaming(true);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite",
          messages: [
            { role: "system", content: "Answer directly. Just the fact. No explanations." },
            { role: "user", content: userQuestion }
          ],
          max_tokens: 50,
          temperature: 0.1
        })
      });
      
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "?";
      await simulateStreaming(answer);
      
    } catch (error) {
      setStreamingAnswer("Error");
    } finally {
      setIsStreaming(false);
    }
  };

  const addToQuizlet = () => {
    const finalQuestion = question.trim();
    const finalAnswer = fullAnswer || streamingAnswer;
    
    if (!finalQuestion || !finalAnswer || isStreaming) {
      alert("Please wait for answer");
      return;
    }
    
    const card = {
      id: generateUniqueId(),
      question: finalQuestion,
      answer: finalAnswer,
      image: imageDataUrl || null,
      mathSolved: !isNaN(parseFloat(finalAnswer)),
      createdAt: new Date().toISOString()
    };
    
    onAddToQuizlet(card);
    setQuestion('');
    setStreamingAnswer('');
    setFullAnswer('');
    setImageDataUrl('');
    setImagePreview('');
    setMathMode(false);
    alert("✅ Saved!");
  };

  const clearAnswer = () => {
    setStreamingAnswer('');
    setFullAnswer('');
  };

  return (
    <div className="ai-panel">
      <div className="panel-header">
        <h2>⚡ Solve Math from Images!</h2>
        <p>Upload a photo of ANY math problem - I'll solve it!</p>
      </div>
      
      <div className="panel-content">
        <div className="special-modes">
          <button className={`mode-btn ${useManualMath ? 'active' : ''}`} onClick={() => setUseManualMath(!useManualMath)}>
            🧮 Math Solver {useManualMath ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="upload-area" onClick={() => document.getElementById('ai-image-input').click()}>
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="upload-preview" />
              <p>✅ Math problem detected! Click Ask to solve</p>
            </>
          ) : (
            <>
              <span className="upload-icon">📸</span>
              <p>Upload a photo of a math problem</p>
              <small>Example: 6 ÷ 2(1+2) written on paper</small>
            </>
          )}
          <input id="ai-image-input" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          {imagePreview && (
            <button className="remove-image" onClick={() => {
              setImageDataUrl('');
              setImagePreview('');
            }}>✕</button>
          )}
        </div>
        
        <input
          type="text"
          className="question-input"
          placeholder="Or type a math problem like: 6 ÷ 2(1+2)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && askAI()}
        />
        
        <div className="button-group">
          <button className="ask-button" onClick={askAI} disabled={isStreaming}>
            {isStreaming ? "Solving..." : imagePreview ? "📸 Solve This Image!" : "🧮 Calculate"}
          </button>
          {streamingAnswer && <button className="clear-button" onClick={clearAnswer}>Clear</button>}
        </div>
        
        <div className="ai-answer streaming-area">
          <div className="answer-header">
            <span>Answer {isStreaming && <span className="streaming-badge">●</span>}</span>
            {streamingAnswer && !isStreaming && (
              <button className="add-btn" onClick={addToQuizlet}>+ Save</button>
            )}
          </div>
          <div className="answer-text streaming-text">
            {streamingAnswer || (isStreaming ? <TypingIndicator /> : "Upload a math problem image or type one!")}
            {isStreaming && <span className="cursor-blink">▊</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ QUIZLET COLLECTION ============
const QuizletCollection = ({ cards, onDeleteCard, onSelectCard, selectedCardId, onFlip, flippedId }) => {
  const selectedCard = cards.find(c => c.id === selectedCardId);
  
  return (
    <div className="quizlet-panel">
      <div className="panel-header">
        <h2>📚 Saved ({cards.length})</h2>
      </div>
      <div className="cards-list">
        {cards.length === 0 ? (
          <div className="empty-state"><p>📖 Nothing saved</p></div>
        ) : (
          cards.map(card => (
            <div key={card.id} className={`card-item ${selectedCardId === card.id ? 'active' : ''}`} onClick={() => onSelectCard(card.id)}>
              {card.image && <img src={card.image} alt="" className="card-thumb" />}
              <div className="card-info">
                <div className="card-question">{card.question.substring(0, 40)}...</div>
                {card.mathSolved && <span className="math-tag">🧮</span>}
              </div>
              <button className="delete-card" onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete?')) onDeleteCard(card.id);
              }}>🗑️</button>
            </div>
          ))
        )}
      </div>
      {selectedCard && (
        <div className="flashcard-container">
          <Flashcard card={selectedCard} isFlipped={flippedId === selectedCard.id} onFlip={() => onFlip(selectedCard.id)} />
        </div>
      )}
    </div>
  );
};

// ============ MAIN APP ============
const App = () => {
  const [cards, setCards] = useState(() => {
    const saved = localStorage.getItem('quizletCards');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [flippedId, setFlippedId] = useState(null);

  useEffect(() => {
    localStorage.setItem('quizletCards', JSON.stringify(cards));
  }, [cards]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📸 Math Problem Solver</h1>
        <p>Take a photo of ANY math problem - Get the ANSWER instantly!</p>
        <div className="ai-status">
          <span className="status-led ready"></span>
          Ready - Upload math problem image
        </div>
      </header>
      <div className="main-layout">
        <AIAskPanel onAddToQuizlet={(card) => {
          setCards(prev => [card, ...prev]);
          setSelectedCardId(card.id);
        }} />
        <QuizletCollection 
          cards={cards}
          onDeleteCard={(id) => setCards(prev => prev.filter(c => c.id !== id))}
          onSelectCard={setSelectedCardId}
          selectedCardId={selectedCardId}
          onFlip={(id) => setFlippedId(flippedId === id ? null : id)}
          flippedId={flippedId}
        />
      </div>
    </div>
  );
};

export default App;