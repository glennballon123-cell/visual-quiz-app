// src/components/QuizCollection.jsx - Professional Flashcard Layout
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
      alert('Please fill in both question and answer');
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
  };

  return (
    <section className="card" aria-label="Quiz collection">
      <div className="card-header">
        <h2>
          Flashcard Library
          <span className="quiz-count">{quizzes.length} cards</span>
        </h2>
      </div>
      <div className="card-content">
        {quizzes.length === 0 ? (
          <div className="empty-state">
            <p>🎴 No flashcards yet</p>
            <p className="text-muted">Create your first flashcard by uploading an image</p>
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
                    alt={quiz.question}
                    className="quiz-image"
                  />
                  <div className="quiz-info">
                    <div className="quiz-question">{quiz.question}</div>
                    <div className="quiz-answer-preview">
                      <span>Click to reveal answer →</span>
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this flashcard?')) {
                            onDeleteQuiz(quiz.id);
                          }
                        }}
                        aria-label="Delete quiz"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedQuiz && (
              <div className="answer-section">
                <div className="button-group">
                  {!editMode ? (
                    <>
                      <button 
                        className="button-secondary" 
                        onClick={onToggleAnswer}
                      >
                        {showAnswer ? '📖 Hide Answer' : '🔍 Reveal Answer'}
                      </button>
                      <button 
                        className="button-secondary" 
                        onClick={handleEditStart}
                      >
                        ✏️ Edit Card
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="button-primary" 
                        onClick={handleEditSave}
                      >
                        💾 Save Changes
                      </button>
                      <button 
                        className="button-secondary" 
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {!editMode ? (
                  <div className="current-answer">
                    <strong>Current Question</strong>
                    <div>{selectedQuiz.question}</div>
                    {showAnswer && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        <strong>Answer</strong>
                        <div style={{ marginTop: '0.5rem' }}>{selectedQuiz.answer}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="edit-form">
                    <div className="input-group">
                      <label htmlFor="edit-question">Question</label>
                      <input
                        id="edit-question"
                        type="text"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="edit-answer">Answer</label>
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