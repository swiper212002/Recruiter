import React, { useState } from 'react';
import '../styles/ui.css';
import { authFetch, getToken } from '../utils/auth';

const QuestionForm = ({ onQuestionAdded }) => {
  const [form, setForm] = useState({
    question_text: '', question_type: 'MULTIPLE_CHOICE', difficulty_level: 'EASY', category: '', tags: '',
    options: [{ option_text: '', is_correct: false }], explanation: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleOptionChange = (idx, field, value) => {
    const newOptions = form.options.map((opt, i) => i === idx ? { ...opt, [field]: field === 'is_correct' ? value === 'true' : value } : opt);
    setForm({ ...form, options: newOptions });
  };

  const addOption = () => setForm({ ...form, options: [...form.options, { option_text: '', is_correct: false }] });
  const removeOption = (idx) => setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!getToken()) {
      alert('Bạn cần đăng nhập trước khi thêm câu hỏi. Vui lòng đăng nhập ở phần Admin.');
      return;
    }

    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      // Try authenticated endpoint first (authFetch adds Bearer token if available)
      let res = await authFetch('http://localhost:5000/api/questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      // If authenticated endpoint returns 401/403/404 and we don't have a token,
      // fall back to public endpoint so recruiters can still create questions in dev.
      if (!res || [401, 403, 404].includes(res.status)) {
        try {
          res = await fetch('http://localhost:5000/api/public/questions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
        } catch (e) {
          // ignore here and let outer catch handle
        }
      }

      if (res && res.ok) {
        const created = await res.json().catch(() => ({}));
        if (onQuestionAdded) onQuestionAdded(created);
        alert('Question added!');
        setForm({ question_text: '', question_type: 'MULTIPLE_CHOICE', difficulty_level: 'EASY', category: '', tags: '', options: [{ option_text: '', is_correct: false }], explanation: '' });
      } else {
        const err = await (res && res.json ? res.json().catch(() => ({})) : Promise.resolve({}));
        const message = (err && (err.message || (err.data && err.data.message) || err.error)) || res && res.statusText || 'Unknown error';
        alert('Failed to add question: ' + message);
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  return (
    <div className="card">
      <h2>Add New Question</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <input name="question_text" placeholder="Question" value={form.question_text} onChange={handleChange} required />
        </div>
        <div className="form-row">
          <select name="question_type" value={form.question_type} onChange={handleChange}>
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="ESSAY">Essay</option>
          </select>
          <input name="difficulty_level" placeholder="Difficulty" value={form.difficulty_level} onChange={handleChange} />
        </div>
        <div className="form-row">
          <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
          <input name="tags" placeholder="Tags (comma separated)" value={form.tags} onChange={handleChange} />
        </div>
        <div>
          <h4>Options</h4>
          {form.options.map((opt, idx) => (
            <div key={idx} className="option-row">
              <input placeholder="Option text" value={opt.option_text} onChange={e => handleOptionChange(idx, 'option_text', e.target.value)} />
              <select value={opt.is_correct ? 'true' : 'false'} onChange={e => handleOptionChange(idx, 'is_correct', e.target.value)}>
                <option value="false">Incorrect</option>
                <option value="true">Correct</option>
              </select>
              <button type="button" className="remove-btn" onClick={() => removeOption(idx)}>Remove</button>
            </div>
          ))}
          <div className="controls">
            <button type="button" className="secondary" onClick={addOption}>Add Option</button>
          </div>
        </div>
        <div className="form-row">
          <input name="explanation" placeholder="Explanation" value={form.explanation} onChange={handleChange} />
        </div>
        <div className="controls">
          <button type="submit">Save Question</button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;