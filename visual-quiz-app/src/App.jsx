// src/App.jsx - With Automatic Image Recognition
import React, { useState, useEffect } from 'react';
import { v4 as generateUniqueId } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import QuizCreator from "./QuizCreator";
import QuizCollection from "./QuizCollection";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const App = () => {
  const [quizzes, setQuizzes] = useState(() => {
    const storedQuizzes = localStorage.getItem('visualQuizzes');
    return storedQuizzes ? JSON.parse(storedQuizzes) : [];
  });
  
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('visualQuizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  // Function to analyze image with AI
  const analyzeImage = async (imageDataUrl) => {
    setIsAnalyzing(true);
    try {
      // Convert base64 to proper format
      const base64Data = imageDataUrl.split(',')[1];
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "What is shown in this image? Answer in 1-2 sentences. Be specific and accurate.";
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        }
      ]);
      
      const aiAnswer = result.response.text();
      setIsAnalyzing(false);
      return aiAnswer;
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setIsAnalyzing(false);
      return "Unable to analyze image. Please enter answer manually.";
    }
  };

  // Add quiz with automatic AI answer
  const addQuiz = async (newQuiz, autoDetect = true) => {
    setIsAnalyzing(true);
    
    let finalAnswer = newQuiz.answer;
    let finalQuestion = newQuiz.question;
    
    // If auto-detect is enabled and no manual answer provided
    if (autoDetect && !newQuiz.answer.trim()) {
      const aiAnswer = await analyzeImage(newQuiz.imageUrl);
      finalAnswer = aiAnswer;
      
      // Generate question automatically if none provided
      if (!newQuiz.question.trim()) {
        finalQuestion = "What is shown in this image?";
      }
    }
    
    const quizWithId = { 
      ...newQuiz, 
      id: generateUniqueId(),
      question: finalQuestion,
      answer: finalAnswer
    };
    
    setQuizzes(prev => [quizWithId, ...prev]);
    setSelectedQuizId(quizWithId.id);
    setShowAnswer(false);
    setIsAnalyzing(false);
  };

  const deleteQuiz = (id) => {
    setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    if (selectedQuizId === id) {
      setSelectedQuizId(quizzes.length > 1 ? quizzes[0]?.id : null);
      setShowAnswer(false);
    }
  };

  const updateQuiz = (id, updatedData) => {
    setQuizzes(prev => prev.map(quiz => 
      quiz.id === id ? { ...quiz, ...updatedData } : quiz
    ));
  };

  const selectedQuiz = quizzes.find(quiz => quiz.id === selectedQuizId);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🤖 AI Visual Quiz Studio</h1>
        <p>Upload any image - AI automatically recognizes and answers instantly!</p>
      </header>

      <div className="quiz-layout">
        <QuizCreator 
          onAddQuiz={addQuiz} 
          isAnalyzing={isAnalyzing}
        />
        
        <QuizCollection 
          quizzes={quizzes}
          selectedQuizId={selectedQuizId}
          onSelectQuiz={setSelectedQuizId}
          onDeleteQuiz={deleteQuiz}
          selectedQuiz={selectedQuiz}
          showAnswer={showAnswer}
          onToggleAnswer={() => setShowAnswer(!showAnswer)}
          onUpdateQuiz={updateQuiz}
        />
      </div>
    </div>
  );
};

export default App;