import React, { useEffect, useState } from 'react';
import '../styles/ui.css';
import { authFetch } from '../utils/auth';

const TestCreator = () => {
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [testName, setTestName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [filter, setFilter] = useState('');
  const [apiWarnings, setApiWarnings] = useState([]);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    // try authenticated endpoint first, fall back to public questions if necessary
    authFetch('http://localhost:5000/api/questions')
      .then(res => res && res.ok ? res.json() : null)
      .then(data => {
        // backend may return either an array of questions or { data: { questions: [...] } }
        if (Array.isArray(data)) {
          setQuestions(data);
        } else if (data && data.data && Array.isArray(data.data.questions)) {
          setQuestions(data.data.questions);
        } else {
          // fallback to public route
          fetch('http://localhost:5000/api/public/questions')
            .then(r => r.json())
            .then(d => setQuestions(Array.isArray(d) ? d : (d && d.data && Array.isArray(d.data.questions) ? d.data.questions : [])))
            .catch(() => setQuestions([]));
        }
      })
      .catch(() => {
        fetch('http://localhost:5000/api/public/questions')
          .then(r => r.json())
          .then(d => setQuestions(Array.isArray(d) ? d : (d && d.data && Array.isArray(d.data.questions) ? d.data.questions : [])))
          .catch(() => setQuestions([]));
      });
  }, []);

  const visible = questions.filter(q => q.question_text.toLowerCase().includes(filter.toLowerCase()));

  const toggleSelect = (id) => {
    setApiError(null);
    setApiWarnings([]);
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiWarnings([]);
    setApiError(null);
    try {
      // Try authenticated endpoint first
      const body = { test_name: testName, duration_minutes: Number(durationMinutes) || 0, questions: selected.map(id => ({ question_id: id })) };

      let res = await authFetch('http://localhost:5000/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Fallback to public route for dev if auth not available or returns 401/403/404
      if (!res || [401, 403, 404].includes(res.status)) {
        try {
          res = await fetch('http://localhost:5000/api/public/tests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
        } catch (e) {
          // ignore and fall through
        }
      }

      const json = res ? await res.json().catch(() => ({})) : {};
      if (res && res.ok) {
        if (json.warnings && Array.isArray(json.warnings) && json.warnings.length > 0) setApiWarnings(json.warnings);
        setTestName('');
        setSelected([]);
        alert('Test created');
      } else {
        setApiError(json.error || json.message || (res ? res.statusText : 'No response'));
      }
    } catch (err) {
      setApiError(err.message || 'Network error');
    }
  };

  return (
    <div className="container">
      <div className="grid">
        <div className="card">
          <h2>Create Test</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input type="text" placeholder="Test Name" value={testName} onChange={e => setTestName(e.target.value)} required />
              <input type="number" min={1} placeholder="Duration (minutes)" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} style={{width:120, marginLeft:8}} required />
              <button type="submit">Create Test</button>
            </div>

            <div className="form-row">
              <input type="search" placeholder="Search questions..." value={filter} onChange={e => setFilter(e.target.value)} />
              <button type="button" className="secondary" onClick={() => { setFilter(''); }}>Clear</button>
            </div>

            <div className="small">Selected ({selected.length})</div>
            <div className="selected-row">
              {selected.map(id => {
                const q = questions.find(x => x.question_id === id);
                return <div key={id} className={`chip selected-chip`}>{q ? q.question_text.slice(0,30) : id}</div>;
              })}
            </div>

            {apiError && <div className="error">Error: {apiError}</div>}
            {apiWarnings && apiWarnings.length > 0 && (
              <div className="warnings">
                <strong>Warnings:</strong>
                <ul>
                  {apiWarnings.map((w, idx) => (
                    <li key={idx}>{w.type}: {Array.isArray(w.question_ids) ? w.question_ids.join(', ') : JSON.stringify(w)}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>

        <div className="card">
          <h2>Questions</h2>
          <div className="questions-list">
            {visible.map(q => (
              <div key={q.question_id} className="question-card">
                <input type="checkbox" checked={selected.includes(q.question_id)} onChange={() => toggleSelect(q.question_id)} />
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
      </div>
    </div>
  );
};

export default TestCreator;