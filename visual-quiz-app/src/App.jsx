import React, { useState } from 'react';
import QuizCreator from './QuizCreator';
import QuizCollection from './QuizCollection';
import './App.css';

function App() {
  const [view, setView] = useState('creator'); // 'creator' or 'collection'

  return (
    <div className="app-container">
      <nav className="quiz-nav">
        <button 
          className={`nav-btn ${view === 'creator' ? 'active' : ''}`} 
          onClick={() => setView('creator')}
        >
          Create Quiz
        </button>
        <button 
          className={`nav-btn ${view === 'collection' ? 'active' : ''}`} 
          onClick={() => setView('collection')}
        >
          View Collection
        </button>
      </nav>

      <main className="quiz-content">
        {view === 'creator' ? <QuizCreator /> : <QuizCollection />}
      </main>
    </div>
  );
}

export default App;