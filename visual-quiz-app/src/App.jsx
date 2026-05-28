// src/App.jsx - Quizlet with DeepSeek AI (With STREAMING!)
import React, { useState, useEffect, useRef } from 'react';
import { v4 as generateUniqueId } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

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

// ============ AI ASK COMPONENT (With Streaming) ============
const AIAskPanel = ({ onAddToQuizlet, aiReady }) => {
  const [question, setQuestion] = useState('');
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [mathMode, setMathMode] = useState(false);
  const [fullAnswer, setFullAnswer] = useState('');
  
  const abortControllerRef = useRef(null);

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

  // Streaming function - shows text word by word
  const streamText = async (text, onChar) => {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30)); // 30ms per word
      onChar(words.slice(0, i + 1).join(' '));
    }
  };

  const askAI = async () => {
    let userQuestion = showCustom ? customPrompt : (question || "What is shown in this image?");
    
    if (mathMode && !showCustom) {
      userQuestion = `SOLVE THIS MATH PROBLEM: ${userQuestion}

IMPORTANT RULES:
- Calculate the answer step by step
- Show the mathematical steps
- Give the final answer clearly
- DO NOT describe the image layout
- DO NOT say "the image shows"
- Just SOLVE and EXPLAIN the solution`;
    }
    
    if (!userQuestion.trim()) {
      alert("Please type a question");
      return;
    }
    
    if (!aiReady) {
      alert("AI is loading. Please wait...");
      return;
    }
    
    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsStreaming(true);
    setStreamingAnswer("");
    setFullAnswer("");
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      
      let result;
      if (imageDataUrl) {
        const base64Data = imageDataUrl.split(',')[1];
        
        const enhancedPrompt = `${userQuestion}

CRITICAL INSTRUCTIONS:
1. If this contains a MATH EQUATION, SOLVE IT and give the numerical answer
2. If this is a QUESTION, ANSWER IT directly
3. If this is an OBJECT, IDENTIFY it
4. DO NOT describe the image layout or say "the image shows"
5. DO NOT just repeat the question
6. Give the FINAL ANSWER immediately

Examples:
- Math equation "6 ÷ 2(1+2) = ?" → Answer: "9"
- "What animal is this?" → Answer: "Cat" or "Dog"
- "What color is this?" → Answer: "Red"`;
        
        result = await model.generateContentStream([
          enhancedPrompt,
          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
        ]);
      } else {
        result = await model.generateContentStream(userQuestion);
      }
      
      let fullResponse = "";
      
      // Stream the response chunk by chunk
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;
        setStreamingAnswer(fullResponse);
        setFullAnswer(fullResponse);
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        setStreamingAnswer(`Error: ${error.message}`);
        setFullAnswer(`Error: ${error.message}`);
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
    
    if (!finalAnswer || finalAnswer === "🤔 Thinking..." || isStreaming) {
      alert("Please wait for AI to finish answering");
      return;
    }
    
    const card = {
      id: generateUniqueId(),
      question: finalQuestion,
      answer: finalAnswer,
      image: imageDataUrl || null,
      aiGenerated: true,
      createdAt: new Date().toISOString()
    };
    
    onAddToQuizlet(card);
    
    // Clear form
    setQuestion('');
    setCustomPrompt('');
    setStreamingAnswer('');
    setFullAnswer('');
    setImageDataUrl('');
    setImagePreview('');
    setShowCustom(false);
    setMathMode(false);
    alert("✅ Added to your Quizlet collection!");
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
        <h2>🤖 Ask AI Anything</h2>
        <p>Watch AI answer word by word in real-time!</p>
      </div>
      
      <div className="panel-content">
        {/* Image Upload */}
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
        
        {/* Special Mode Buttons */}
        <div className="special-modes">
          <button 
            className={`mode-btn ${mathMode ? 'active' : ''}`} 
            onClick={() => {
              setMathMode(!mathMode);
              if (!mathMode) {
                setShowCustom(false);
                setQuestion("Solve this math problem step by step.");
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
        
        {/* Question Type Toggle */}
        <div className="question-type">
          <button className={`type-btn ${!showCustom ? 'active' : ''}`} onClick={() => setShowCustom(false)}>
            📝 Quick Question
          </button>
          <button className={`type-btn ${showCustom ? 'active' : ''}`} onClick={() => setShowCustom(true)}>
            🎯 Ask Anything (Custom)
          </button>
        </div>
        
        {/* Question Input */}
        {!showCustom ? (
          <input
            type="text"
            className="question-input"
            placeholder="e.g., What animal is this? Solve this math problem? Identify this object?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        ) : (
          <textarea
            className="question-textarea"
            placeholder="Ask ANYTHING! Examples:
• What breed of cat is this?
• Is this plant healthy?
• Solve: 6 ÷ 2(1+2)
• What's the historical significance of this building?
• Analyze the colors in this image
• ANY question you can think of..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows="4"
          />
        )}
        
        {/* Ask and Clear Buttons */}
        <div className="button-group">
          <button className="ask-button" onClick={askAI} disabled={isStreaming || !aiReady}>
            {isStreaming ? "📝 AI is typing..." : mathMode ? "🧮 Solve Math!" : "🔍 Ask AI"}
          </button>
          {streamingAnswer && (
            <button className="clear-button" onClick={clearAnswer}>
              🗑️ Clear
            </button>
          )}
        </div>
        
        {/* Streaming AI Answer */}
        <div className="ai-answer streaming-area">
          <div className="answer-header">
            <span>🤖 AI Answer {isStreaming && <span className="streaming-badge">● LIVE</span>}</span>
            {streamingAnswer && !isStreaming && (
              <button className="add-btn" onClick={addToQuizlet}>+ Add to Quizlet</button>
            )}
          </div>
          <div className="answer-text streaming-text">
            {streamingAnswer || (isStreaming ? <TypingIndicator /> : "Ask a question to see the AI answer stream in real-time...")}
            {isStreaming && <span className="cursor-blink">▊</span>}
          </div>
          {isStreaming && (
            <div className="streaming-progress">
              <div className="progress-bar">
                <div className="progress-fill streaming"></div>
              </div>
            </div>
          )}
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
        <h2>📚 My Quizlet Collection</h2>
        <p>{cards.length} flashcards saved</p>
      </div>
      
      <div className="cards-list">
        {cards.length === 0 ? (
          <div className="empty-state">
            <p>📖 No flashcards yet</p>
            <p>Ask AI something and save it to your collection!</p>
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
                {card.aiGenerated && <span className="ai-tag">AI</span>}
              </div>
              <button className="delete-card" onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this card?')) onDeleteCard(card.id);
              }}>🗑️</button>
            </div>
          ))
        )}
      </div>
      
      {/* Flashcard Display */}
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
  const [aiReady, setAiReady] = useState(false);

  // Load AI
  useEffect(() => {
    const initAI = async () => {
      try {
        await genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        setAiReady(true);
        console.log("AI Ready!");
      } catch (error) {
        console.error("AI init failed:", error);
      }
    };
    initAI();
  }, []);

  // Save to localStorage
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
        <h1>📚 AI Quizlet 🤖</h1>
        <p>Watch AI answers appear word by word in real-time!</p>
        <div className="ai-status">
          <span className={`status-led ${aiReady ? 'ready' : 'loading'}`}></span>
          {aiReady ? 'AI Ready - Streaming enabled!' : 'Loading AI...'}
        </div>
      </header>

      <div className="main-layout">
        <AIAskPanel onAddToQuizlet={addToQuizlet} aiReady={aiReady} />
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