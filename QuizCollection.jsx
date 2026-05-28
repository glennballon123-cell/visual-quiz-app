// src/components/QuizCollection.jsx
import React, { useState } from 'react';

const QuizCollection = ({ 
  quizzes, 
  selectedQuizId, 
  onSelectQuiz, 
  onDeleteQuiz,
  selectedQuiz,
  showAnswer,
  onToggleAnswer,
  onUpdateQuiz
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  const handleEditStart = () => {
    if (selectedQuiz) {
      setEditQuestion(selectedQuiz.question);
      setEditAnswer(selectedQuiz.answer);
      setEditMode(true);
    }
  };

  const handleEditSave = () => {
    if (selectedQuiz && editQuestion.trim() && editAnswer.trim()) {
      onUpdateQuiz(selectedQuiz.id, {
        question: editQuestion.trim(),
        answer: editAnswer.trim()
      });
      setEditMode(false);
    } else {
      alert('Question and answer cannot be empty');
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
  };

  return (
    <section className="card" aria-label="Quiz collection">
      <div className="card-header">
        <h2>📚 Your Quiz Collection</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          {quizzes.length} {quizzes.length === 1 ? 'card' : 'cards'} available
        </p>
      </div>
      <div className="card-content">
        {quizzes.length === 0 ? (
          <div className="empty-state">
            <p>🎯 No quizzes yet</p>
            <p className="text-muted">Create your first visual quiz on the left!</p>
          </div>
        ) : (
          <>
            <div className="quiz-list">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`quiz-item ${selectedQuizId === quiz.id ? 'selected' : ''}`}
                  onClick={() => onSelectQuiz(quiz.id)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && onSelectQuiz(quiz.id)}
                >
                  <img 
                    src={quiz.imageUrl} 
                    alt={`Quiz visual for: ${quiz.question}`}
                    className="quiz-image"
                  />
                  <div className="quiz-question">{quiz.question}</div>
                  <div className="quiz-answer-preview">
                    <span>Click to reveal answer →</span>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this quiz card?')) {
                          onDeleteQuiz(quiz.id);
                        }
                      }}
                      aria-label="Delete quiz"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {selectedQuiz && (
              <div className="answer-section">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  {!editMode ? (
                    <>
                      <button 
                        className="button-secondary" 
                        onClick={onToggleAnswer}
                        style={{ flex: 1 }}
                      >
                        {showAnswer ? '🙈 Hide Answer' : '👁️ Show Answer Instantly'}
                      </button>
                      <button 
                        className="button-secondary" 
                        onClick={handleEditStart}
                        style={{ flex: 1 }}
                      >
                        ✏️ Edit Card
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="button-primary" 
                        onClick={handleEditSave}
                        style={{ flex: 1 }}
                      >
                        💾 Save Changes
                      </button>
                      <button 
                        className="button-secondary" 
                        onClick={handleEditCancel}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {!editMode ? (
                  <div className="current-answer">
                    <strong>Current Question:</strong> {selectedQuiz.question}
                    {showAnswer && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #dcfce7' }}>
                        <strong>✅ Answer:</strong> {selectedQuiz.answer}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="edit-form">
                    <div className="input-group">
                      <label htmlFor="edit-question">Edit Question</label>
                      <input
                        id="edit-question"
                        type="text"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="edit-answer">Edit Answer</label>
                      <textarea
                        id="edit-answer"
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows="3"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default QuizCollection;