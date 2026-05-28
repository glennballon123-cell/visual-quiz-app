// src/App.jsx - With Manual Math Solver (No AI needed!)
import React, { useState, useEffect, useRef } from 'react';
import { v4 as generateUniqueId } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// ============ MATH SOLVER (No AI, Pure JavaScript!) ============
const solveMathProblem = (problem) => {
  try {
    // Remove spaces
    let equation = problem.replace(/\s/g, '');
    
    // Handle special math expressions
    equation = equation.replace(/÷/g, '/');
    equation = equation.replace(/×/g, '*');
    equation = equation.replace(/\^/g, '**');
    
    // Handle implicit multiplication (like 2(1+2))
    equation = equation.replace(/(\d+)\(/g, '$1*(');
    equation = equation.replace(/\)(\d+)/g, ')*$1');
    
    // SAFE evaluation using Function (safer than eval)
    const result = Function('"use strict";return (' + equation + ')')();
    
    return {
      answer: result.toString(),
      steps: `Step 1: Original problem: ${problem}\nStep 2: ${equation}\nStep 3: = ${result}`,
      solved: true
    };
  } catch (error) {
    return {
      answer: null,
      steps: "Could not solve this equation. Please check the format.",
      solved: false
    };
  }
};

// ============ FLASHCARD COMPONENT ============
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
            {card.aiGenerated && <span className="ai-badge">🤖 AI Generated</span>}
            {card.mathSolved && <span className="math-badge">🧮 Math Solver</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ TYPING INDICATOR COMPONENT ============
const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
      <span>AI is typing...</span>
    </div>
  );
};

// ============ AI ASK COMPONENT ============
const AIAskPanel = ({ onAddToQuizlet }) => {
  const [question, setQuestion] = useState('');
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [mathMode, setMathMode] = useState(false);
  const [fullAnswer, setFullAnswer] = useState('');
  const [aiReady, setAiReady] = useState(false);
  const [useManualMath, setUseManualMath] = useState(true); // New: Use manual math solver first!
  
  const abortControllerRef = useRef(null);

  // Initialize AI (but we'll use manual math when possible)
  useEffect(() => {
    const initAI = async () => {
      if (!useManualMath) {
        try {
          await genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
          setAiReady(true);
        } catch (error) {
          console.error("AI init failed:", error);
        }
      }
    };
    initAI();
  }, [useManualMath]);

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

  // Check if question is a math problem
  const isMathProblem = (text) => {
    const mathPatterns = [
      /[\d\+\-\*\/\(\)\^÷×]+/,  // Numbers and operators
      /\d+\s*[+\-*/÷×]\s*\d+/,   // Basic operations
      /\([^)]+\)/,                // Parentheses
    ];
    return mathPatterns.some(pattern => pattern.test(text));
  };

  const askAI = async () => {
    let userQuestion = showCustom ? customPrompt : (question || "What is shown in this image?");
    
    if (mathMode && !showCustom) {
      userQuestion = `Solve: ${userQuestion}`;
    }
    
    if (!userQuestion.trim()) {
      alert("Please type a question");
      return;
    }
    
    // Try manual math solver FIRST (no API, instant!)
    if (useManualMath && (mathMode || isMathProblem(userQuestion))) {
      setIsStreaming(true);
      setStreamingAnswer("");
      setFullAnswer("");
      
      // Simulate streaming effect
      const mathResult = solveMathProblem(userQuestion);
      
      if (mathResult.solved) {
        const answerText = `🧮 **Math Solver Result:**\n\n${mathResult.steps}\n\n✅ Final Answer: **${mathResult.answer}**`;
        
        // Stream the answer word by word
        const words = answerText.split(' ');
        let currentText = '';
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 15));
          currentText += (i === 0 ? words[i] : ' ' + words[i]);
          setStreamingAnswer(currentText);
          setFullAnswer(currentText);
        }
        setIsStreaming(false);
        return;
      }
    }
    
    // If not a math problem or manual math failed, use AI
    if (!aiReady && !useManualMath) {
      alert("AI is still loading. Please wait or enable Manual Math mode.");
      return;
    }
    
    setIsStreaming(true);
    setStreamingAnswer("");
    setFullAnswer("");
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      
      let result;
      if (imageDataUrl) {
        const base64Data = imageDataUrl.split(',')[1];
        const enhancedPrompt = `${userQuestion}\n\nAnswer directly and concisely.`;
        result = await model.generateContentStream([
          enhancedPrompt,
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]);
      } else {
        result = await model.generateContentStream(userQuestion);
      }
      
      let fullResponse = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        setStreamingAnswer(fullResponse);
        setFullAnswer(fullResponse);
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        let errorMsg = "Error: ";
        if (error.message.includes("429") || error.message.includes("quota")) {
          errorMsg = "⚠️ Daily API limit reached. Use Manual Math mode for math problems!";
        } else {
          errorMsg += error.message;
        }
        setStreamingAnswer(errorMsg);
        setFullAnswer(errorMsg);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const addToQuizlet = () => {
    const finalQuestion = question.trim() || customPrompt.trim();
    const finalAnswer = fullAnswer || streamingAnswer;
    
    if (!finalQuestion) {
      alert("Please ask a question first");
      return;
    }
    
    if (!finalAnswer || finalAnswer.includes("typing") || isStreaming) {
      alert("Please wait for answer to complete");
      return;
    }
    
    const card = {
      id: generateUniqueId(),
      question: finalQuestion,
      answer: finalAnswer,
      image: imageDataUrl || null,
      aiGenerated: !finalAnswer.includes("Math Solver"),
      mathSolved: finalAnswer.includes("Math Solver"),
      createdAt: new Date().toISOString()
    };
    
    onAddToQuizlet(card);
    
    setQuestion('');
    setCustomPrompt('');
    setStreamingAnswer('');
    setFullAnswer('');
    setImageDataUrl('');
    setImagePreview('');
    setShowCustom(false);
    setMathMode(false);
    alert("✅ Added to your collection!");
  };

  const clearAnswer = () => {
    setStreamingAnswer('');
    setFullAnswer('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="ai-panel">
      <div className="panel-header">
        <h2>🤖 Math Solver + AI Assistant</h2>
        <p>Math problems solved INSTANTLY with NO API!</p>
      </div>
      
      <div className="panel-content">
        {/* Manual Math Mode Toggle */}
        <div className="special-modes">
          <button 
            className={`mode-btn ${useManualMath ? 'active' : ''}`}
            onClick={() => setUseManualMath(!useManualMath)}
            style={{ background: useManualMath ? '#10b981' : '#1e293b' }}
          >
            🧮 Manual Math Solver {useManualMath ? 'ON ✓' : 'OFF'}
          </button>
        </div>
        
        <div className="upload-area" onClick={() => document.getElementById('ai-image-input').click()}>
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="upload-preview" />
          ) : (
            <>
              <span className="upload-icon">📸</span>
              <p>Click to upload an image (optional)</p>
              <small>Upload a picture to ask questions about it</small>
            </>
          )}
          <input id="ai-image-input" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          {imagePreview && (
            <button className="remove-image" onClick={(e) => {
              e.stopPropagation();
              setImageDataUrl('');
              setImagePreview('');
            }}>✕</button>
          )}
        </div>
        
        <div className="special-modes">
          <button 
            className={`mode-btn ${mathMode ? 'active' : ''}`} 
            onClick={() => {
              setMathMode(!mathMode);
              if (!mathMode) {
                setShowCustom(false);
                setQuestion("6 ÷ 2(1+2)");
              }
            }}
          >
            🧮 Math Solver Mode
          </button>
          <button 
            className="mode-btn" 
            onClick={() => {
              setMathMode(false);
              setShowCustom(false);
              setQuestion("Identify this object. What is it?");
            }}
          >
            🔍 Identify Object
          </button>
          <button 
            className="mode-btn" 
            onClick={() => {
              setMathMode(false);
              setShowCustom(false);
              setQuestion("Describe what you see in detail.");
            }}
          >
            📝 Describe Image
          </button>
        </div>
        
        <div className="question-type">
          <button className={`type-btn ${!showCustom ? 'active' : ''}`} onClick={() => setShowCustom(false)}>
            📝 Quick Question
          </button>
          <button className={`type-btn ${showCustom ? 'active' : ''}`} onClick={() => setShowCustom(true)}>
            🎯 Ask Anything (Custom)
          </button>
        </div>
        
        {!showCustom ? (
          <input
            type="text"
            className="question-input"
            placeholder="e.g., 6 ÷ 2(1+2) = ? or What animal is this?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        ) : (
          <textarea
            className="question-textarea"
            placeholder="Ask ANYTHING! Examples:
• Solve: 6 ÷ 2(1+2)
• What breed of cat is this?
• Explain quantum physics simply"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows="4"
          />
        )}
        
        <div className="button-group">
          <button className="ask-button" onClick={askAI} disabled={isStreaming}>
            {isStreaming ? "📝 Solving..." : mathMode ? "🧮 Solve Math!" : "🔍 Ask AI"}
          </button>
          {streamingAnswer && (
            <button className="clear-button" onClick={clearAnswer}>🗑️ Clear</button>
          )}
        </div>
        
        <div className="ai-answer streaming-area">
          <div className="answer-header">
            <span>🤖 Answer {isStreaming && <span className="streaming-badge">● LIVE</span>}</span>
            {streamingAnswer && !isStreaming && !streamingAnswer.includes("Error") && (
              <button className="add-btn" onClick={addToQuizlet}>+ Save</button>
            )}
          </div>
          <div className="answer-text streaming-text">
            {streamingAnswer || (isStreaming ? <TypingIndicator /> : "Ask a question... Math problems solved instantly!")}
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
        <h2>📚 My Collection</h2>
        <p>{cards.length} items saved</p>
      </div>
      
      <div className="cards-list">
        {cards.length === 0 ? (
          <div className="empty-state">
            <p>📖 Nothing saved yet</p>
            <p>Ask a question and save the answer!</p>
          </div>
        ) : (
          cards.map(card => (
            <div 
              key={card.id} 
              className={`card-item ${selectedCardId === card.id ? 'active' : ''}`}
              onClick={() => onSelectCard(card.id)}
            >
              {card.image && <img src={card.image} alt="" className="card-thumb" />}
              <div className="card-info">
                <div className="card-question">{card.question.substring(0, 50)}...</div>
                {card.mathSolved && <span className="math-tag">🧮 Math</span>}
                {card.aiGenerated && !card.mathSolved && <span className="ai-tag">🤖 AI</span>}
              </div>
              <button className="delete-card" onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this?')) onDeleteCard(card.id);
              }}>🗑️</button>
            </div>
          ))
        )}
      </div>
      
      {selectedCard && (
        <div className="flashcard-container">
          <Flashcard 
            card={selectedCard} 
            isFlipped={flippedId === selectedCard.id}
            onFlip={() => onFlip(selectedCard.id)}
          />
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

  const addToQuizlet = (card) => {
    setCards(prev => [card, ...prev]);
    setSelectedCardId(card.id);
  };

  const deleteCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (selectedCardId === id) {
      setSelectedCardId(cards[0]?.id || null);
    }
  };

  const handleFlip = (id) => {
    setFlippedId(flippedId === id ? null : id);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📚 Math Solver + AI Assistant</h1>
        <p>🧮 Math problems solved INSTANTLY without API! 🤖 AI for everything else</p>
        <div className="ai-status">
          <span className="status-led ready"></span>
          Manual Math Solver: ON ✓ | Unlimited use!
        </div>
      </header>

      <div className="main-layout">
        <AIAskPanel onAddToQuizlet={addToQuizlet} />
        <QuizletCollection 
          cards={cards}
          onDeleteCard={deleteCard}
          onSelectCard={setSelectedCardId}
          selectedCardId={selectedCardId}
          onFlip={handleFlip}
          flippedId={flippedId}
        />
      </div>
    </div>
  );
};

export default App;