import React, { useState } from 'react';
import { saveToken } from '../utils/auth';

const Login = ({ history }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [message, setMessage] = useState(null);

  const handleLogin = async () => {
    setMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
      });
      const body = await res.json();
      // backend returns { success: true, data: { token, user } }
      if (res.ok && body && body.data && body.data.token) {
        saveToken(body.data.token);
        setMessage({ type: 'success', text: 'Đăng nhập thành công' });
        setTimeout(() => history.push('/admin/questions'), 800);
      } else {
        setMessage({ type: 'error', text: (body && (body.message || (body.data && body.data.message))) || 'Đăng nhập thất bại' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Login (nhanh)</h2>
      {message && <div style={{ color: message.type === 'error' ? 'red' : 'green' }}>{message.text}</div>}
      <div style={{ marginTop: 12 }}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginLeft: 8 }} />
        <button onClick={handleLogin} style={{ marginLeft: 8 }}>Login</button>
      </div>
    </div>
  );
};

export default Login;
