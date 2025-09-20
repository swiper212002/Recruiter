const fetch = require('node-fetch');

const API_BASE = process.argv[2] || process.env.API_BASE || 'http://127.0.0.1:5000';
const PATH = process.argv[3] || process.env.API_PATH || '/api/tests';

async function run() {
  // First, fetch existing questions to get valid IDs
  let token = null;
  const fetchQuestions = async (t) => {
    const headers = { 'Accept': 'application/json' };
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const r = await fetch(`${API_BASE}/api/questions`, { method: 'GET', headers });
    return r;
  };

  let questionsRes = await fetchQuestions();
  if (questionsRes.status === 401) {
    // Login as admin to fetch questions
    try {
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'adminpass' })
      });
      if (loginRes.ok) {
        const loginJson = await loginRes.json();
        token = loginJson?.data?.token;
        if (token) {
          questionsRes = await fetchQuestions(token);
        }
      } else {
        console.error('Admin login failed when fetching questions, status', loginRes.status);
      }
    } catch (e) {
      console.error('Admin login request failed:', e);
    }
  }

  let questionList = [];
  try {
    const qtext = await questionsRes.text();
    const parsed = JSON.parse(qtext);
    // API returns { success: true, data: { questions: [...] } }
    questionList = Array.isArray(parsed?.data?.questions) ? parsed.data.questions : [];
  } catch (e) {
    console.error('Error reading questions response:', e);
  }

  if (!Array.isArray(questionList) || questionList.length === 0) {
    console.error('No questions available to create a test. Aborting.');
    return;
  }

  // Pick up to 2 distinct question IDs (field is question_id), then add a duplicate of the first
  const ids = questionList.slice(0, 2).map(q => q.question_id).filter(Boolean);
  if (ids.length === 0) {
    console.error('Could not extract numeric IDs from questions. Aborting.');
    return;
  }

  const payload = {
    test_name: 'Debug Test ' + Date.now(),
    duration_minutes: 30,
    questions: []
  };

  // Add chosen ids
  ids.forEach((id, idx) => payload.questions.push({ question_id: id, question_order: idx + 1 }));
  // Add a duplicate of the first id to test dedupe
  payload.questions.push({ question_id: ids[0], question_order: ids.length + 1 });

  console.log('Selected question IDs:', ids);
  console.log('Payload to POST:', JSON.stringify(payload, null, 2));

  try {
    const makePost = async (token) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const r = await fetch(`${API_BASE}${PATH}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      return r;
    };

  let res = await makePost(token);

    // If unauthorized, attempt programmatic admin login and retry
    if (res.status === 401) {
      console.log('Received 401, attempting admin login to retry...');
      try {
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'adminpass' })
        });
        if (loginRes.ok) {
          const loginJson = await loginRes.json();
          const token = loginJson?.data?.token;
          if (token) {
            res = await makePost(token);
          } else {
            console.error('Login succeeded but token not found in response');
          }
        } else {
          console.error('Admin login failed with status', loginRes.status);
        }
      } catch (loginErr) {
        console.error('Login request error:', loginErr);
      }
    }

    const text = await res.text();
    console.log('Status:', res.status);
    try { console.log('Body:', JSON.parse(text)); } catch (e) { console.log('BodyText:', text); }
  } catch (err) {
    console.error('Request error:', err);
  }
}

run();
