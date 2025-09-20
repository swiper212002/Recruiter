import React from 'react';
import '../styles/ui.css';

const QuestionList = ({ questions = [] }) => {
  return (
    <div className="card">
      <h2>Question List</h2>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {questions.map(q => (
          <div key={q.question_id} className="question-card">
            <div className="question-text">
              <div style={{fontWeight:600}}>{q.question_text}</div>
              <div className="meta small">
                <div className="badge">{q.question_type}</div>
                <div className="chip">{q.difficulty_level}</div>
                <div className="small">{q.category}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionList;