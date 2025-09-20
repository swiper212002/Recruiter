import React, { useEffect, useState } from 'react';
import { authFetch, getToken } from '../utils/auth';

const HRQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState('TEXT');
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

  const handleCreate = async () => {
    setMessage(null);
    try {
      const payload = { question_text: text, question_type: type };
      const res = await fetch('http://localhost:5000/api/public/questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Tạo câu hỏi thành công' });
        setText('');
        fetchQuestions();
      } else {
        setMessage({ type: 'error', text: body.message || JSON.stringify(body) });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!getToken()) { setMessage({ type: 'error', text: 'Bạn cần đăng nhập để xóa' }); return; }
    if (!window.confirm('Xác nhận xóa câu hỏi này?')) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/questions/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'success', text: 'Xóa thành công' });
        fetchQuestions();
      } else {
        setMessage({ type: 'error', text: body.message || JSON.stringify(body) });
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
    if (!getToken()) { setMessage({ type: 'error', text: 'Bạn cần đăng nhập để sửa' }); return; }
    try {
      const res = await authFetch(`http://localhost:5000/api/questions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_text: editingText }) });
      const body = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Cập nhật thành công' });
        cancelEdit();
        fetchQuestions();
      } else {
        setMessage({ type: 'error', text: body.message || JSON.stringify(body) });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>HR Question Manager (nhanh)</h2>
      {message && <div style={{ color: message.type === 'error' ? 'red' : 'green' }}>{message.text}</div>}

      <div style={{ marginTop: 12 }}>
        <input placeholder="Nội dung câu hỏi" value={text} onChange={e => setText(e.target.value)} style={{ width: '60%' }} />
        <select value={type} onChange={e => setType(e.target.value)} style={{ marginLeft: 8 }}>
          <option value="TEXT">TEXT</option>
          <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
          <option value="CODING">CODING</option>
        </select>
        <button onClick={handleCreate} style={{ marginLeft: 8 }}>Tạo</button>
      </div>

      <h3 style={{ marginTop: 20 }}>Danh sách câu hỏi</h3>
      {loading ? <div>Loading...</div> : (
        <ul>
          {questions.map(q => (
            <li key={q.question_id} style={{ marginBottom: 8 }}>
              {editingId === q.question_id ? (
                <>
                  <input value={editingText} onChange={e => setEditingText(e.target.value)} style={{ width: '60%' }} />
                  <button onClick={() => saveEdit(q.question_id)} style={{ marginLeft: 8 }}>Lưu</button>
                  <button onClick={cancelEdit} style={{ marginLeft: 8 }}>Hủy</button>
                </>
              ) : (
                <>
                  <span>{q.question_text} <small>({q.question_type})</small></span>
                  <button onClick={() => startEdit(q)} style={{ marginLeft: 8 }}>Sửa</button>
                  <button onClick={() => handleDelete(q.question_id)} style={{ marginLeft: 8 }}>Xóa</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HRQuestions;
