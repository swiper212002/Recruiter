import React, { useEffect, useState } from 'react';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({}); // qid -> selected(s)
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [message, setMessage] = useState(null);
  // New states for enhancements
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [timerMs, setTimerMs] = useState(null); // milliseconds remaining
  const [durationMinutes, setDurationMinutes] = useState(30); // default duration
  const [candidateTokenOrId, setCandidateTokenOrId] = useState('');
  const [candidateTestId, setCandidateTestId] = useState(null);
  const [autoSaveKey] = useState('quiz_autosave_v1');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchQuestions(false); }, []);

  // countdown timer effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!timerMs) return;
    const t = setInterval(() => {
      setTimerMs(prev => {
        if (!prev) return 0;
        if (prev <= 1000) {
          clearInterval(t);
          // auto submit when timer reaches 0
          if (!submitted) computeAndMaybeSave();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerMs, submitted]);

  const fetchQuestions = async (skipAutosave = false) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/public/questions');
      const data = await res.json();
      const all = Array.isArray(data) ? data : (data.data && data.data.questions) || [];
      // filter MCQ types
      const mcq = all.filter(q => q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE');
      // shuffle and pick 30
      for (let i = mcq.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mcq[i], mcq[j]] = [mcq[j], mcq[i]];
      }
      const picked = mcq.slice(0, 30);
      // randomize options order for each question
      const normalized = picked.map(q => {
        const opts = (q.QuestionOptions || q.options || []).slice();
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        return { ...q, _shuffledOptions: opts };
      });
      setQuestions(normalized);
      // reset page and timer
      setPage(1);
      setTimerMs(durationMinutes * 60 * 1000);
      // try to load autosave unless explicitly skipped (a reset/retake should skip autosave)
      if (!skipAutosave) {
        try {
          const raw = localStorage.getItem(autoSaveKey);
          if (raw) {
            const obj = JSON.parse(raw);
            setAnswers(obj.answers || {});
          }
        } catch (e) { /* ignore */ }
      } else {
        // clear any prior answers in state when skipping autosave
        setAnswers({});
      }
    } catch (err) {
      setMessage('Không thể tải câu hỏi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleOption = (q, optionId) => {
    setAnswers(prev => {
      const cur = prev[q.question_id] || (q.question_type === 'MULTIPLE_CHOICE' ? [] : null);
      let next;
      if (q.question_type === 'MULTIPLE_CHOICE') {
        const s = new Set(Array.isArray(cur) ? cur : []);
        if (s.has(optionId)) s.delete(optionId); else s.add(optionId);
        next = Array.from(s);
      } else {
        next = optionId;
      }
      const out = { ...prev, [q.question_id]: next };
      // autosave
      try { localStorage.setItem(autoSaveKey, JSON.stringify({ answers: out })); } catch (e) { }
      return out;
    });
  };

  // helper to resolve candidate_test_id from tokenOrId
  const resolveCandidateTestId = async (tokenOrId) => {
    if (!tokenOrId) return null;
    // try token route
    try {
      const r = await fetch(`http://localhost:5000/api/candidate-tests/access/${encodeURIComponent(tokenOrId)}`);
      if (r.ok) {
        const j = await r.json();
        return j.data && j.data.candidate_test_id;
      }
    } catch (e) { }
    const n = Number(tokenOrId);
    return Number.isNaN(n) ? null : n;
  };

  // Submit answers locally and optionally to backend if candidateTestId provided
  const computeAndMaybeSave = async () => {
    // compute local score
    let total = 0, correctCount = 0;
    for (const q of questions) {
      total++;
      const user = answers[q.question_id];
      const opts = q._shuffledOptions || q.QuestionOptions || q.options || [];
      const correctIds = opts.filter(o => o.is_correct).map(o => o.option_id);
      if (!user) continue;
      if (q.question_type === 'MULTIPLE_CHOICE') {
        const userSet = new Set(Array.isArray(user) ? user : []);
        const correctSet = new Set(correctIds);
        let ok = userSet.size === correctSet.size;
        if (ok) for (const id of userSet) if (!correctSet.has(id)) { ok = false; break; }
        if (ok) correctCount++;
      } else {
        if (correctIds.includes(user)) correctCount++;
      }
    }
    const localScore = Math.round((correctCount / Math.max(1, total)) * 100);
    setScore(localScore);
    setSubmitted(true);

  // clear autosave after submission so a retake starts fresh
  try { localStorage.removeItem(autoSaveKey); } catch (e) { }

    // if candidateTestId not resolved yet, try to resolve from input
    let ctId = candidateTestId;
    if (!ctId && candidateTokenOrId) {
      ctId = await resolveCandidateTestId(candidateTokenOrId);
      setCandidateTestId(ctId);
    }

    if (ctId) {
      setMessage('Đang gửi câu trả lời lên server...');
      // submit each answered question
      for (const q of questions) {
        const user = answers[q.question_id];
        if (!user) continue;
        const payload = { question_id: q.question_id };
        if (q.question_type === 'MULTIPLE_CHOICE') payload.selected_option_id = (Array.isArray(user) && user[0]) || null; // backend supports single selected_option_id; multi may need backend change
        else payload.selected_option_id = user;
        if (q.question_type === 'TEXT') payload.text_answer = user;
        try {
          await fetch(`http://localhost:5000/api/candidate-tests/${ctId}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } catch (e) { /* continue */ }
      }
      // complete
      try {
        const comp = await fetch(`http://localhost:5000/api/candidate-tests/${ctId}/complete`, { method: 'POST' });
        const compJson = await comp.json().catch(() => null);
        if (comp.ok) setMessage('Đã nộp lên server — kết quả: ' + JSON.stringify(compJson.data || compJson));
        else setMessage('Nộp lên server xong nhưng có lỗi: ' + (compJson && compJson.message));
      } catch (e) {
        setMessage('Lưu lên server thất bại: ' + e.message);
      }
    } else {
      setMessage('Không có candidate_test_id — chỉ chấm điểm cục bộ.');
    }
  };

  // computeScore removed (unused) — scoring handled by computeAndMaybeSave

  const reset = () => {
    // clear saved answers and fetch a fresh set of randomized questions
    try { localStorage.removeItem(autoSaveKey); } catch (e) { }
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setPage(1);
    setCandidateTestId(null);
    // fetch questions and skip loading any autosave so answers are empty
    fetchQuestions(true);
    // reset timer according to current durationMinutes
    setTimerMs(durationMinutes * 60 * 1000);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Quiz — 30 câu ngẫu nhiên (trắc nghiệm)</h2>
      {message && <div style={{ color: 'red' }}>{message}</div>}
      {loading ? <div>Đang tải...</div> : (
        <div>
          {questions.length === 0 ? <div>Không có câu hỏi trắc nghiệm trong hệ thống.</div> : (
            <div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <div>
                  <label>Thời lượng (phút): </label>
                  <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value) || 0)} style={{ width: 80, marginLeft: 6 }} />
                </div>
                <div>
                  <label>Câu/trang: </label>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} style={{ marginLeft: 6 }}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <input placeholder="candidate token hoặc id (tùy chọn)" value={candidateTokenOrId} onChange={e=>setCandidateTokenOrId(e.target.value)} style={{ padding: 6, width: 260 }} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <button onClick={computeAndMaybeSave} disabled={submitted}>Nộp bài</button>
                <button onClick={reset} style={{ marginLeft: 8 }}>Làm lại (lấy 30 câu mới)</button>
              </div>
              <ol start={(page-1)*pageSize + 1}>
                {questions.slice((page-1)*pageSize, page*pageSize).map((q, idx) => (
                  <li key={q.question_id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{q.question_text}</div>
                    <div style={{ marginTop: 6 }}>
                      {(q._shuffledOptions || q.QuestionOptions || q.options || []).map(o => (
                        <div key={o.option_id}>
                          <label>
                            {q.question_type === 'MULTIPLE_CHOICE' ? (
                              <input type="checkbox" checked={(answers[q.question_id] || []).includes(o.option_id)} onChange={() => toggleOption(q, o.option_id)} />
                            ) : (
                              <input type="radio" name={`q_${q.question_id}`} checked={answers[q.question_id] === o.option_id} onChange={() => toggleOption(q, o.option_id)} />
                            )}
                            {' '}{o.option_text}
                          </label>
                        </div>
                      ))}
                    </div>
                    {submitted && (() => {
                      const opts = q.QuestionOptions || q.options || [];
                      const correctIds = opts.filter(x => x.is_correct).map(x => x.option_id);
                      const user = answers[q.question_id];
                      let ok = false;
                      if (q.question_type === 'MULTIPLE_CHOICE') {
                        const us = new Set(Array.isArray(user) ? user : []);
                        const cs = new Set(correctIds);
                        ok = us.size === cs.size && Array.from(us).every(id => cs.has(id));
                      } else {
                        ok = correctIds.includes(user);
                      }
                      return <div style={{ marginTop: 6, color: ok ? 'green' : 'red' }}>{ok ? 'Đúng' : 'Sai'} — Đáp án đúng: {opts.filter(x=>x.is_correct).map(x=>x.option_text).join(', ')}</div>;
                    })()}
                  </li>
                ))}
              </ol>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
                  <button onClick={() => setPage(p => Math.min(Math.ceil(questions.length/pageSize), p+1))} disabled={page>=Math.ceil(questions.length/pageSize)} style={{ marginLeft: 8 }}>Next</button>
                </div>
                <div>Trang {page}/{Math.max(1, Math.ceil(questions.length/pageSize))}</div>
                <div>{timerMs !== null ? `Thời gian còn lại: ${Math.floor(timerMs/60000)}m ${Math.floor((timerMs%60000)/1000)}s` : ''}</div>
              </div>
              {submitted && <div style={{ marginTop: 12, fontWeight: 700 }}>Điểm: {score}%</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;
