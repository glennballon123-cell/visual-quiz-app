// src/App.jsx - Advanced Async Streaming AI
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as generateUniqueId } from 'uuid';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import QuizCreator from "./QuizCreator";
import QuizCollection from "./QuizCollection";

const App = () => {
  const [quizzes, setQuizzes] = useState(() => {
    const storedQuizzes = localStorage.getItem('visualQuizzes');
    return storedQuizzes ? JSON.parse(storedQuizzes) : [];
  });
  
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [model, setModel] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const abortControllerRef = useRef(null);

  // Load MobileNet model on startup
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        const loadedModel = await mobilenet.load();
        setModel(loadedModel);
        setModelLoading(false);
        console.log("AI Model ready with WebGL backend");
      } catch (error) {
        console.error("Model loading failed:", error);
        setModelLoading(false);
      }
    };
    loadModel();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Save to local storage with async debounce
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('visualQuizzes', JSON.stringify(quizzes));
    }, 500);
    
    return () => clearTimeout(saveTimeout);
  }, [quizzes]);

  // Streaming image analysis with progress updates
  const analyzeImageStreaming = useCallback(async (imageDataUrl, onProgress, onChunk) => {
    if (!model) {
      return "AI model is still loading...";
    }
    
    return new Promise(async (resolve, reject) => {
      abortControllerRef.current = new AbortController();
      
      try {
        // Step 1: Load image (10%)
        onProgress(10);
        await new Promise(r => setTimeout(r, 50));
        
        const img = new Image();
        img.src = imageDataUrl;
        
        // Step 2: Wait for image load (30%)
        await new Promise((resolveImg) => {
          img.onload = resolveImg;
        });
        onProgress(30);
        await new Promise(r => setTimeout(r, 50));
        
        // Step 3: Preprocess image (50%)
        onProgress(50);
        onChunk("📸 Analyzing image...");
        await new Promise(r => setTimeout(r, 100));
        
        // Step 4: Run classification (70%)
        onProgress(70);
        onChunk("🧠 Running AI recognition...");
        
        const predictions = await model.classify(img);
        onProgress(90);
        
        // Step 5: Process results (100%)
        if (predictions && predictions.length > 0) {
          const topPredictions = predictions.slice(0, 3);
          
          // Stream each prediction
          onChunk("🔍 **Top Matches Found:**\n");
          
          for (let i = 0; i < topPredictions.length; i++) {
            const pred = topPredictions[i];
            const confidence = (pred.probability * 100).toFixed(1);
            await new Promise(r => setTimeout(r, 100));
            onChunk(`${i === 0 ? '✓' : '•'} **${pred.className}** - ${confidence}% confidence\n`);
          }
          
          const bestMatch = `${topPredictions[0].className} (${(topPredictions[0].probability * 100).toFixed(1)}% confidence)`;
          onProgress(100);
          resolve(bestMatch);
        } else {
          resolve("Could not identify the image. Please add answer manually.");
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          reject(new Error('Analysis cancelled'));
        } else {
          console.error("Analysis failed:", error);
          reject(new Error('Analysis failed'));
        }
      }
    });
  }, [model]);

  // Add quiz with streaming AI
  const addQuiz = useCallback(async (newQuiz, autoDetect = true) => {
    if (autoDetect && model && !newQuiz.answer.trim()) {
      setIsAnalyzing(true);
      setStreamingAnswer('');
      setAnalysisProgress(0);
      
      try {
        // Simulate streaming response
        const streamAnswer = await analyzeImageStreaming(
          newQuiz.imageUrl,
          (progress) => setAnalysisProgress(progress),
          (chunk) => setStreamingAnswer(prev => prev + chunk)
        );
        
        const quizWithId = {
          ...newQuiz,
          id: generateUniqueId(),
          question: newQuiz.question.trim() || "What is shown in this image?",
          answer: streamAnswer,
          aiConfidence: true,
          createdAt: new Date().toISOString()
        };
        
        setQuizzes(prev => [quizWithId, ...prev]);
        setSelectedQuizId(quizWithId.id);
        setShowAnswer(false);
        
        // Clear streaming after 3 seconds
        setTimeout(() => {
          setStreamingAnswer('');
          setAnalysisProgress(0);
        }, 3000);
        
      } catch (error) {
        console.error("AI analysis failed:", error);
        const quizWithId = {
          ...newQuiz,
          id: generateUniqueId(),
          question: newQuiz.question.trim() || "What is shown in this image?",
          answer: "AI analysis failed. Please enter answer manually.",
          createdAt: new Date().toISOString()
        };
        setQuizzes(prev => [quizWithId, ...prev]);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      const quizWithId = {
        ...newQuiz,
        id: generateUniqueId(),
        createdAt: new Date().toISOString()
      };
      setQuizzes(prev => [quizWithId, ...prev]);
      setSelectedQuizId(quizWithId.id);
      setShowAnswer(false);
    }
  }, [model, analyzeImageStreaming]);

  const deleteQuiz = useCallback((id) => {
    setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    if (selectedQuizId === id) {
      setSelectedQuizId(quizzes.length > 1 ? quizzes[0]?.id : null);
      setShowAnswer(false);
    }
  }, [selectedQuizId, quizzes]);

  const updateQuiz = useCallback((id, updatedData) => {
    setQuizzes(prev => prev.map(quiz => 
      quiz.id === id ? { ...quiz, ...updatedData, updatedAt: new Date().toISOString() } : quiz
    ));
  }, []);

  const selectedQuiz = quizzes.find(quiz => quiz.id === selectedQuizId);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🚀 AI Visual Quiz Studio Pro</h1>
        <p>Async AI with real-time streaming | Instant image recognition</p>
      </header>

      <div className="quiz-layout">
        <QuizCreator 
          onAddQuiz={addQuiz} 
          isAnalyzing={isAnalyzing}
          modelLoading={modelLoading}
          streamingAnswer={streamingAnswer}
          analysisProgress={analysisProgress}
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