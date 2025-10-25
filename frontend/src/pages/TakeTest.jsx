import React, { useEffect, useState, useRef } from 'react';

const TakeTest = () => {
  const [tokenOrId, setTokenOrId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [candidateTestId, setCandidateTestId] = useState(null);
  const [testInfo, setTestInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // question_id -> { selected_option_id, text_answer }
  const [inProgress, setInProgress] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const loadByToken = async () => {
    setError(null);
    setLoading(true);
    try {
      // try token route first
      const res = await fetch(`http://localhost:5000/api/candidate-tests/access/${encodeURIComponent(tokenOrId)}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok && body && body.data) {
        setCandidateTestId(body.data.candidate_test_id);
        setTestInfo(body.data.test || body.data);
        setLoading(false);
      } else {
        // try interpreting input as candidate_test_id directly
        const id = Number(tokenOrId);
        if (!Number.isNaN(id)) {
          setCandidateTestId(id);
          setLoading(false);
        } else {
          setError('Không tìm thấy bài test với token/id này');
          setLoading(false);
        }
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const startTest = async () => {
    if (!candidateTestId) return setError('Chưa có candidate_test_id');
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/start`, { method: 'POST' });
      const body = await res.json();
      if (res.ok && body && body.data) {
        setInProgress(true);
        setQuestions(body.data.questions || []);
        setEndTime(new Date(body.data.end_time || body.data.end_time || Date.now() + (body.data.duration_minutes||30)*60000));
        // initialize answers
        const a = {};
        (body.data.questions || []).forEach(q => { a[q.question_id] = { selected_option_id: null, text_answer: '' }; });
        setAnswers(a);
        setLoading(false);
      } else {
        setError(body.message || 'Không thể bắt đầu bài test');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!endTime) return;
    const update = () => {
      const diff = Math.max(0, new Date(endTime) - new Date());
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(timerRef.current);
        // auto-complete could be triggered here
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [endTime]);

  const changeAnswer = (question_id, patch) => {
    setAnswers(prev => ({ ...prev, [question_id]: { ...prev[question_id], ...patch } }));
  };

  const submitAnswer = async (question_id) => {
    if (!candidateTestId) return setError('No candidate_test_id');
    const ans = answers[question_id] || {};
    try {
      const res = await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/answer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id, selected_option_id: ans.selected_option_id, text_answer: ans.text_answer })
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        // mark saved or show message
      } else {
        setError(body.message || 'Submit failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const submitAll = async () => {
    setLoading(true);
    setError(null);
    try {
      for (const q of questions) {
        const ans = answers[q.question_id] || {};
        await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/answer`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: q.question_id, selected_option_id: ans.selected_option_id, text_answer: ans.text_answer })
        });
      }
      setLoading(false);
      alert('Đã gửi tất cả câu trả lời');
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const complete = async () => {
    if (!candidateTestId) return setError('No candidate_test_id');
    try {
      const res = await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/complete`, { method: 'POST' });
      const body = await res.json();
      if (res.ok) {
        alert('Bài test hoàn tất: ' + JSON.stringify(body.data || body));
        setInProgress(false);
      } else {
        setError(body.message || 'Complete failed');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Take Test</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!candidateTestId && (
        <div style={{ marginTop: 12 }}>
          <input placeholder="Access token or candidate_test_id" value={tokenOrId} onChange={e => setTokenOrId(e.target.value)} style={{ width: '60%' }} />
          <button onClick={loadByToken} style={{ marginLeft: 8 }}>Load</button>
        </div>
      )}

      {candidateTestId && !inProgress && (
        <div style={{ marginTop: 12 }}>
          <div>Candidate Test ID: {candidateTestId}</div>
          {testInfo && <div>Test: {testInfo.test_name || testInfo.test?.test_name}</div>}
          <button onClick={startTest} style={{ marginTop: 8 }}>Start Test</button>
        </div>
      )}

      {inProgress && (
        <div style={{ marginTop: 12 }}>
          <div>Thời gian còn lại: {timeLeft !== null ? Math.ceil(timeLeft/1000) + 's' : '---'}</div>
          <div style={{ marginTop: 12 }}>
            {questions.map(q => (
              <div key={q.question_id} style={{ padding: 12, border: '1px solid #ddd', marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{q.order}. {q.question_text}</div>
                {q.question_type === 'TEXT' ? (
                  <div>
                    <textarea value={(answers[q.question_id] && answers[q.question_id].text_answer) || ''} onChange={e => changeAnswer(q.question_id, { text_answer: e.target.value })} rows={4} style={{ width: '100%', marginTop: 8 }} />
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => submitAnswer(q.question_id)}>Submit</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    {q.options && q.options.length > 0 ? q.options.map(o => (
                      <div key={o.option_id}>
                        <label>
                          <input type={q.question_type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'} name={`q_${q.question_id}`} checked={answers[q.question_id] && answers[q.question_id].selected_option_id === o.option_id} onChange={() => changeAnswer(q.question_id, { selected_option_id: o.option_id })} /> {o.option_text}
                        </label>
                      </div>
                    )) : <div>No options</div>}
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => submitAnswer(q.question_id)}>Submit</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div style={{ marginTop: 12 }}>
              <button onClick={submitAll} disabled={loading}>Submit All</button>
              <button onClick={complete} style={{ marginLeft: 8 }}>Complete Test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;
