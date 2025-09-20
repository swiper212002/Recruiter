const fetch = require('node-fetch');

(async function(){
  const url = 'http://localhost:5001/api/auth/login';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'adminpass' }),
      timeout: 10000
    });
    const text = await res.text();
    console.log('URL:', url);
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Request error:', e.message || e);
    process.exit(1);
  }
})();
