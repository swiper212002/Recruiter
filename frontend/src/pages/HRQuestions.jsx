import React, { useEffect, useState } from 'react';
import '../styles/dark-neon.css';

const HRQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState('TEXT');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [options, setOptions] = useState([{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }]);
  const [message, setMessage] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/public/questions');
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : (data.data && data.data.questions) || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể tải câu hỏi: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  // simple create handler with options handled elsewhere (handleCreateWithOptions)


  // NOTE: login UI removed; this page focuses on creating MCQ questions (public create endpoint)

  // Bulk add questions: paste one question per line and create them sequentially
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [parsedBulk, setParsedBulk] = useState([]); // { question_text, question_type, options, difficulty }
  const [selectedParsed, setSelectedParsed] = useState(new Set());
  const LOCAL_SAVE_KEY = 'hr_questions_saved';

  const handleBulkAdd = async () => {
    setMessage(null);
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { setMessage({ type: 'error', text: 'Vui lòng nhập ít nhất 1 câu hỏi' }); return; }
    setBulkLoading(true);
    try {
      for (const line of lines) {
        const payload = parseBulkLineToPayload(line);
        await fetch('http://localhost:5000/api/public/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setMessage({ type: 'success', text: `Đã thêm ${lines.length} câu hỏi` });
      setBulkText('');
      fetchQuestions();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBulkLoading(false);
    }
  };

  // parse helper for single line
  const parseBulkLineToPayload = (line) => {
    // support two bulk formats:
    // - MCQ: question | opt1;opt2;opt3 | correctIndex
    // - TEXT with expected answer: question || expectedAnswer
    if (line.includes('|') && !line.includes('||')) {
      const parts = line.split('|').map(p => p.trim());
      const qtext = parts[0] || '';
      const opts = (parts[1] || '').split(';').map(o => ({ option_text: o.trim(), is_correct: false })).filter(o => o.option_text);
      const correctPart = (parts[2] || '').trim();
      if (correctPart) {
        const idxs = correctPart.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !Number.isNaN(n)).map(n => n - 1);
        idxs.forEach(i => { if (i >= 0 && i < opts.length) opts[i].is_correct = true; });
      }
      const hasMultiple = opts.filter(o => o.is_correct).length > 1;
      return { question_text: qtext, question_type: hasMultiple ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE', options: opts, difficulty_level: 'EASY' };
    } else if (line.includes('||')) {
      const parts = line.split('||').map(p => p.trim());
      const qtext = parts[0] || '';
      const expected = parts[1] || '';
      return { question_text: qtext, question_type: 'TEXT', explanation: expected, difficulty_level: 'EASY' };
    }
    return { question_text: line, question_type: 'TEXT' };
  };

  const parseBulkPreview = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map((line, idx) => ({ id: idx, raw: line, payload: parseBulkLineToPayload(line) }));
    setParsedBulk(parsed);
    setSelectedParsed(new Set(parsed.map(p => p.id)));
  };

  const toggleParsedSelected = (id) => {
    setSelectedParsed(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const saveParsedLocally = () => {
    if (!parsedBulk || parsedBulk.length === 0) { setMessage({ type: 'error', text: 'Không có dữ liệu để lưu' }); return; }
    const toSave = parsedBulk.map(p => p.payload);
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(toSave));
    setMessage({ type: 'success', text: `Đã lưu ${toSave.length} câu hỏi vào localStorage` });
  };

  const loadParsedFromLocal = () => {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) { setMessage({ type: 'error', text: 'Không có dữ liệu đã lưu' }); return; }
    try {
      const arr = JSON.parse(raw);
      const parsed = arr.map((payload, idx) => ({ id: idx, raw: payload.question_text || '', payload }));
      setParsedBulk(parsed);
      setSelectedParsed(new Set(parsed.map(p => p.id)));
      setMessage({ type: 'success', text: `Đã load ${parsed.length} câu hỏi từ localStorage` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Dữ liệu lưu không hợp lệ' });
    }
  };

  const clearLocalSaved = () => {
    localStorage.removeItem(LOCAL_SAVE_KEY);
    setMessage({ type: 'success', text: 'Đã xóa dữ liệu đã lưu' });
  };

  const sendSelectedParsed = async () => {
    if (!parsedBulk || parsedBulk.length === 0) { setMessage({ type: 'error', text: 'Không có dữ liệu để gửi' }); return; }
    const toSend = parsedBulk.filter(p => selectedParsed.has(p.id)).map(p => p.payload);
    if (toSend.length === 0) { setMessage({ type: 'error', text: 'Không có mục nào được chọn' }); return; }
    setBulkLoading(true);
    try {
      for (const payload of toSend) {
        await fetch('http://localhost:5000/api/public/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setMessage({ type: 'success', text: `Đã gửi ${toSend.length} câu hỏi` });
      fetchQuestions();
      setParsedBulk([]);
      setBulkText('');
    } catch (err) {
      // If sending fails (backend down), save locally instead
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(toSend));
      setMessage({ type: 'error', text: 'Gửi thất bại — đã lưu thủ công vào localStorage' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa câu hỏi này?')) return;
    try {
      // Try to call a public delete endpoint if available; do not require an admin login in the UI.
      const res = await fetch(`http://localhost:5000/api/public/questions/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res && res.ok) {
        setMessage({ type: 'success', text: 'Xóa thành công' });
        fetchQuestions();
      } else {
        // If backend doesn't support public delete, provide the error but do not demand admin login from the UI.
        setMessage({ type: 'error', text: body.message || `Xóa không thành công (status ${res && res.status})` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const startEdit = (q) => { setEditingId(q.question_id); setEditingText(q.question_text); };

  const cancelEdit = () => { setEditingId(null); setEditingText(''); };

  const saveEdit = async (id) => {
    try {
      // Attempt to update via a public endpoint; keep the UI free from an explicit admin-login requirement.
      const res = await fetch(`http://localhost:5000/api/public/questions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_text: editingText }) });
      const body = await res.json().catch(() => ({}));
      if (res && res.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thành công' });
        cancelEdit();
        fetchQuestions();
      } else {
        setMessage({ type: 'error', text: body.message || `Cập nhật không thành công (status ${res && res.status})` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Option helpers for creating single/multiple choice questions
  const updateOptionText = (idx, textVal) => {
    setOptions(prev => prev.map((o, i) => i === idx ? { ...o, option_text: textVal } : o));
  };

  const toggleOptionCorrect = (idx) => {
    setOptions(prev => prev.map((o, i) => {
      if (type === 'SINGLE_CHOICE') {
        // only one correct allowed
        return { ...o, is_correct: i === idx };
      }
      // multiple choice: toggle
      if (i === idx) return { ...o, is_correct: !o.is_correct };
      return o;
    }));
  };

  const addOption = () => setOptions(prev => [...prev, { option_text: '', is_correct: false }]);
  const removeOption = (idx) => setOptions(prev => prev.filter((_, i) => i !== idx));

  // Create handler must include options when applicable
  const handleCreateWithOptions = async () => {
    setMessage(null);
    setValidationErrors({});
    try {
      // client-side validation
      const errors = {};
      if (!text || !text.trim()) errors.text = 'Vui lòng nhập nội dung câu hỏi';
      if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type)) {
        const filled = options.filter(o => o.option_text && o.option_text.trim());
        if (filled.length < 2) errors.options = 'Cần ít nhất 2 lựa chọn';
        const correctCount = filled.filter(o => o.is_correct).length;
        if (correctCount === 0) errors.options = 'Cần chọn ít nhất 1 đáp án đúng';
      }
      if (Object.keys(errors).length) { setValidationErrors(errors); setMessage({ type: 'error', text: 'Vui lòng sửa lỗi trước khi tạo' }); return; }

      const payload = { question_text: text, question_type: type, difficulty_level: difficulty };
      if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type)) {
        payload.options = options.filter(o => o.option_text.trim()).map(o => ({ option_text: o.option_text.trim(), is_correct: !!o.is_correct }));
      }
      if (type === 'TEXT' && expectedAnswer && expectedAnswer.trim()) {
        payload.explanation = expectedAnswer.trim();
      }
      const res = await fetch('http://localhost:5000/api/public/questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Tạo câu hỏi thành công' });
        setText('');
        // reset options
        setOptions([{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }]);
        fetchQuestions();
      } else {
        setMessage({ type: 'error', text: body.message || JSON.stringify(body) });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // ...existing code...

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="left">
          <div className="flex-between" style={{ marginBottom: 8 }}>
            <h2>Employer Question Manager — Tạo câu hỏi</h2>
            <div className="muted-small">Public quick-create (no admin UI)</div>
          </div>

          <div className="question-card">
            <div className="form-row">
              <input className={`input ${validationErrors.text ? 'error' : ''}`} placeholder="Nội dung câu hỏi" value={text} onChange={e => setText(e.target.value)} aria-label="Nội dung câu hỏi" />
              <select className="input select-medium" value={type} onChange={e => setType(e.target.value)} aria-label="Loại câu hỏi">
                <option value="TEXT">TEXT</option>
                <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                <option value="CODING">CODING</option>
              </select>
              <select className="input select-small" value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Độ khó">
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
                <option value="EXPERT">EXPERT</option>
              </select>
              <button type="button" className="btn primary" onClick={handleCreateWithOptions} aria-label="Tạo câu hỏi">Tạo</button>
            </div>

            {validationErrors.text && <div className="error-msg">{validationErrors.text}</div>}

            {type === 'TEXT' && (
              <div style={{ marginTop: 12 }}>
                <label className="muted-small">Expected answer (nếu có)</label>
                <input className="input" placeholder="Expected answer" value={expectedAnswer} onChange={e => setExpectedAnswer(e.target.value)} style={{ marginTop: 6 }} />
              </div>
            )}

            {['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type) && (
              <div style={{ marginTop: 12 }}>
                <label className="muted-small">Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {options.map((opt, idx) => (
                    <div key={idx} className="option-row">
                      <input className="input" value={opt.option_text} onChange={e => updateOptionText(idx, e.target.value)} placeholder={`Option ${idx + 1}`} aria-label={`Option ${idx + 1}`} />
                      <label className="muted-small" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={opt.is_correct} onChange={() => toggleOptionCorrect(idx)} aria-label={`Correct option ${idx + 1}`} /> <span>Correct</span>
                      </label>
                      {options.length > 2 && <button type="button" className="btn ghost small" onClick={() => removeOption(idx)} aria-label={`Remove option ${idx + 1}`}>Remove</button>}
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn ghost" onClick={addOption} aria-label="Add option">Add option</button>
                  </div>
                </div>
                {validationErrors.options && <div className="error-msg">{validationErrors.options}</div>}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <label className="muted-small">Bulk add (mỗi dòng 1 câu hỏi)</label>
              <textarea className="input" value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} style={{ marginTop: 6 }} />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn ghost" onClick={parseBulkPreview}>Preview</button>
                <button type="button" className="btn primary" onClick={handleBulkAdd} disabled={bulkLoading} aria-busy={bulkLoading}>{bulkLoading ? 'Adding...' : 'Bulk add'}</button>
              </div>

              {parsedBulk && parsedBulk.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 8 }}>
                  <div className="flex-between">
                    <strong>Preview ({parsedBulk.length})</strong>
                    <div className="preview-controls">
                      <button type="button" className="btn ghost" onClick={saveParsedLocally}>Save locally</button>
                      <button type="button" className="btn ghost" onClick={loadParsedFromLocal}>Load saved</button>
                      <button type="button" className="btn ghost" onClick={clearLocalSaved}>Clear saved</button>
                      <button type="button" className="btn primary" onClick={sendSelectedParsed} disabled={bulkLoading} aria-busy={bulkLoading}>{bulkLoading ? 'Sending...' : 'Send selected'}</button>
                    </div>
                  </div>

                  <ul className="preview-list">
                    {parsedBulk.map(p => (
                      <li key={p.id} className="preview-item">
                        <input type="checkbox" checked={selectedParsed.has(p.id)} onChange={() => toggleParsedSelected(p.id)} aria-label={`Select preview ${p.id}`} />
                        <div style={{ flex: 1 }}>
                          <div className="raw">{p.payload.question_text}</div>
                          <div className="muted-small">{p.payload.question_type}{p.payload.options ? ` — ${p.payload.options.map(o => o.option_text).join(' | ')}` : ''}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right">
          <h3>Danh sách câu hỏi</h3>
          <div className="question-list">
            {loading ? <div>Loading...</div> : (
              <ul>
                {questions.map(q => (
                  <li key={q.question_id} className="question-row">
                    <div style={{ flex: 1 }}>
                      {editingId === q.question_id ? (
                        <div className="form-row">
                          <input className="input" value={editingText} onChange={e => setEditingText(e.target.value)} style={{ flex: 1 }} />
                          <button type="button" className="btn primary" onClick={() => saveEdit(q.question_id)}>Lưu</button>
                          <button type="button" className="btn ghost" onClick={cancelEdit}>Hủy</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 700 }}>{q.question_text}</div>
                          <div className="meta">{q.question_type}</div>
                        </div>
                      )}
                    </div>
                    <div className="right-actions">
                      <button type="button" className="btn ghost" onClick={() => startEdit(q)}>Sửa</button>
                      <button type="button" className="btn danger" onClick={() => handleDelete(q.question_id)}>Xóa</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* notification */}
      {message && (
        <div className={`alert-box ${message.type === 'error' ? 'alert-error' : 'alert-success'} show`} role="status" aria-live="polite">
          {message.text}
        </div>
      )}
    </div>
  );
};

export default HRQuestions;
