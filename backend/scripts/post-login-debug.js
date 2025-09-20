const fetch = require('node-fetch');

// Accept API base from CLI arg (first arg) or API_BASE env var, default to localhost:PORT
const CLI_BASE = process.argv[2];
const API_BASE = CLI_BASE || process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}`;

async function run() {
  try {
    const url = `${API_BASE.replace(/\/$/, '')}/api/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'adminpass' }),
      timeout: 10000
    });

    const text = await res.text();
    console.log('Request URL:', url);
    console.log('Status:', res.status);
    try {
      console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    } catch (e) {
      console.log('Headers: <unserializable>');
    }
    console.log('Body:', text);
  } catch (err) {
    console.error('Request error:', err.message || err);
  }
}

run();
