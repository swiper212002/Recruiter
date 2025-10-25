import React, { useState } from 'react';

const AutoSubmit = () => {
  const [tokenOrId, setTokenOrId] = useState('');
  const [pattern, setPattern] = useState('SEQUENTIAL'); // SEQUENTIAL or RANDOM
  const [status, setStatus] = useState(null);
  const [running, setRunning] = useState(false);

  const loadAndRun = async () => {
    setStatus(null);
    setRunning(true);
    try {
      // try token first
      let candidateTestId = null;
      try {
        const resToken = await fetch(`http://localhost:5000/api/candidate-tests/access/${encodeURIComponent(tokenOrId)}`);
        if (resToken.ok) {
          const json = await resToken.json();
          candidateTestId = json.data && json.data.candidate_test_id;
        }
      } catch (err) {
        // ignore
      }

      if (!candidateTestId) {
        // fallback: treat as numeric id
        const num = Number(tokenOrId);
        if (!Number.isNaN(num)) candidateTestId = num;
      }

      if (!candidateTestId) {
        setStatus('Không nhận được candidate_test_id. Kiểm tra token hoặc id.');
        setRunning(false);
        return;
      }

      setStatus(`Bắt đầu test ID ${candidateTestId} ...`);

      // Start the test
      const startRes = await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/start`, { method: 'POST' });
      if (!startRes.ok) {
        const err = await startRes.json().catch(() => ({}));
        setStatus('Không thể start test: ' + (err.message || JSON.stringify(err)));
        setRunning(false);
        return;
      }

      const startJson = await startRes.json();
      const questions = (startJson.data && startJson.data.questions) || [];
      if (!questions || questions.length === 0) {
        setStatus('Start thành công nhưng không có câu hỏi trả về');
        setRunning(false);
        return;
      }

      setStatus(`Đã start. Gửi ${questions.length} câu trả lời...`);

      // Answer each question
      let count = 0;
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // pick option according to pattern
        if (!q.options || q.options.length === 0) continue;
        let chosenOptionId = null;
        if (pattern === 'RANDOM') {
          const r = Math.floor(Math.random() * q.options.length);
          chosenOptionId = q.options[r].option_id;
        } else {
          // SEQUENTIAL: map question index to option index cyclically: 0->A,1->B,2->C,3->D
          const idx = i % q.options.length;
          chosenOptionId = q.options[idx].option_id;
        }

        // submit answer
        try {
          await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/answer`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question_id: q.question_id, selected_option_id: chosenOptionId })
          });
          count++;
          setStatus(`Đã gửi ${count}/${questions.length} câu`);
        } catch (err) {
          // continue
        }
      }

      // complete test
      const comp = await fetch(`http://localhost:5000/api/candidate-tests/${candidateTestId}/complete`, { method: 'POST' });
      const compJson = await comp.json().catch(() => ({}));
      if (comp.ok) {
        setStatus(`Hoàn tất. Kết quả: ${JSON.stringify(compJson.data || compJson)}`);
      } else {
        setStatus('Hoàn tất nhưng có lỗi: ' + (compJson.message || JSON.stringify(compJson)));
      }

    } catch (err) {
      setStatus('Lỗi: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Auto-submit Test (tự động điền & nộp)</h2>
      <div style={{ marginTop: 12 }}>
        <input placeholder="Access token hoặc candidate_test_id" value={tokenOrId} onChange={e => setTokenOrId(e.target.value)} style={{ width: '60%', padding: 8 }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label><input type="radio" name="pattern" value="SEQUENTIAL" checked={pattern === 'SEQUENTIAL'} onChange={() => setPattern('SEQUENTIAL')} /> Lần lượt (A,B,C,D,...)</label>
        <label style={{ marginLeft: 12 }}><input type="radio" name="pattern" value="RANDOM" checked={pattern === 'RANDOM'} onChange={() => setPattern('RANDOM')} /> Ngẫu nhiên</label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={loadAndRun} disabled={running} style={{ padding: '8px 12px' }}>{running ? 'Đang chạy...' : 'Start & Auto-submit'}</button>
      </div>
      {status && <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{status}</div>}
    </div>
  );
};

export default AutoSubmit;
