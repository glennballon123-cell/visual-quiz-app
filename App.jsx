// src/App.jsx
import React, { useState, useEffect } from 'react';
import { v4 as generateUniqueId } from 'uuid';
import QuizCreator from './components/QuizCreator';
import QuizCollection from './components/QuizCollection';

const App = () => {
  // Load existing quizzes from local storage
  const [quizzes, setQuizzes] = useState(() => {
    const storedQuizzes = localStorage.getItem('visualQuizzes');
    return storedQuizzes ? JSON.parse(storedQuizzes) : [];
  });
  
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Save to local storage whenever quizzes change
  useEffect(() => {
    localStorage.setItem('visualQuizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  // Add a new quiz
  const addQuiz = (newQuiz) => {
    const quizWithId = { ...newQuiz, id: generateUniqueId() };
    setQuizzes(prev => [quizWithId, ...prev]);
    setSelectedQuizId(quizWithId.id);
    setShowAnswer(false);
  };

  // Delete a quiz
  const deleteQuiz = (id) => {
    setQuizzes(prev => prev.filter(quiz => quiz.id !== id));
    if (selectedQuizId === id) {
      setSelectedQuizId(quizzes.length > 1 ? quizzes[0]?.id : null);
      setShowAnswer(false);
    }
  };

  // Update a quiz
  const updateQuiz = (id, updatedData) => {
    setQuizzes(prev => prev.map(quiz => 
      quiz.id === id ? { ...quiz, ...updatedData } : quiz
    ));
  };

  const selectedQuiz = quizzes.find(quiz => quiz.id === selectedQuizId);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📸 Visual Quiz Studio</h1>
        <p>Create image-based quizzes | Click any card to reveal the answer instantly</p>
      </header>

      <div className="quiz-layout">
        {/* Left Column - Quiz Creator */}
        <QuizCreator onAddQuiz={addQuiz} />
        
        {/* Right Column - Quiz Collection and Display */}
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