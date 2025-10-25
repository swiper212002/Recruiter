import React, { useEffect, useState } from 'react';

const HRQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState('TEXT');
  const [expectedAnswer, setExpectedAnswer] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [options, setOptions] = useState([{ option_text: '', is_correct: false }, { option_text: '', is_correct: false }]);
  const [message, setMessage] = useState(null);

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
    try {
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
    <div style={{ padding: 24, fontFamily: 'Segoe UI, Roboto, Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>HR Question Manager — Tạo câu hỏi trắc nghiệm</h2>
      </div>

      {message && <div style={{ color: message.type === 'error' ? '#b00020' : '#166534', marginTop: 12 }}>{message.text}</div>}

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div style={{ padding: 12, borderRadius: 8, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          {/* ...existing header / controls... */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Nội dung câu hỏi" value={text} onChange={e => setText(e.target.value)} style={{ flex: 1, padding: '8px 10px' }} />
            <select value={type} onChange={e => setType(e.target.value)} style={{ padding: 8 }}>
              <option value="TEXT">TEXT</option>
              <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
              <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
              <option value="CODING">CODING</option>
            </select>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={{ padding: 8, marginLeft: 8 }}>
              <option value="EASY">EASY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HARD">HARD</option>
              <option value="EXPERT">EXPERT</option>
            </select>
            <button onClick={handleCreateWithOptions} style={{ padding: '8px 12px' }}>Tạo</button>
          </div>

          {type === 'TEXT' && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: '#444' }}>Expected answer (nếu có)</label>
              <input placeholder="Expected answer" value={expectedAnswer} onChange={e => setExpectedAnswer(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 8 }} />
            </div>
          )}

          {['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(type) && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, color: '#444' }}>Options</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {options.map((opt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={opt.option_text} onChange={e => updateOptionText(idx, e.target.value)} placeholder={`Option ${idx + 1}`} style={{ flex: 1 }} />
                    <label style={{ fontSize: 13 }}>
                      <input type="checkbox" checked={opt.is_correct} onChange={() => toggleOptionCorrect(idx)} /> Correct
                    </label>
                    {options.length > 2 && <button onClick={() => removeOption(idx)}>Remove</button>}
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={addOption}>Add option</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, color: '#444' }}>Bulk add (mỗi dòng 1 câu hỏi)</label>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} style={{ width: '100%', marginTop: 6, padding: 8 }} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={parseBulkPreview} style={{ padding: '8px 12px' }}>Preview</button>
              <button onClick={handleBulkAdd} disabled={bulkLoading} style={{ padding: '8px 12px' }}>{bulkLoading ? 'Adding...' : 'Bulk add'}</button>
            </div>

            {parsedBulk && parsedBulk.length > 0 && (
              <div style={{ marginTop: 12, borderTop: '1px dashed #ddd', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Preview ({parsedBulk.length})</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveParsedLocally}>Save locally</button>
                    <button onClick={loadParsedFromLocal}>Load saved</button>
                    <button onClick={clearLocalSaved}>Clear saved</button>
                    <button onClick={sendSelectedParsed} disabled={bulkLoading}>{bulkLoading ? 'Sending...' : 'Send selected'}</button>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                  {parsedBulk.map(p => (
                    <li key={p.id} style={{ padding: 8, border: '1px solid #eee', marginBottom: 8, borderRadius: 6, display: 'flex', gap: 8 }}>
                      <input type="checkbox" checked={selectedParsed.has(p.id)} onChange={() => toggleParsedSelected(p.id)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{p.payload.question_text}</div>
                        <div style={{ fontSize: 12, color: '#555' }}>{p.payload.question_type}{p.payload.options ? ` — ${p.payload.options.map(o => o.option_text).join(' | ')}` : ''}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Danh sách câu hỏi</h3>
          <div style={{ maxHeight: 520, overflow: 'auto', background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            {loading ? <div>Loading...</div> : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {questions.map(q => (
                  <li key={q.question_id} style={{ padding: 8, borderRadius: 6, border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      {editingId === q.question_id ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input value={editingText} onChange={e => setEditingText(e.target.value)} style={{ flex: 1 }} />
                          <button onClick={() => saveEdit(q.question_id)}>Lưu</button>
                          <button onClick={cancelEdit}>Hủy</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>{q.question_text}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{q.question_type}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: 12 }}>
                      <button onClick={() => startEdit(q)} style={{ marginRight: 6 }}>Sửa</button>
                      <button onClick={() => handleDelete(q.question_id)}>Xóa</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRQuestions;
