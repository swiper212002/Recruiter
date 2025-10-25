/**
 * Demo script: create (or reuse) a 30-question test, create a candidate, assign a candidate_test record
 * with an access token, then simulate a candidate starting the test and auto-submitting answers.
 *
 * Run from backend folder with: node tools/demo_auto_submit.js
 * Requires backend server running (for public API calls) and DB accessible for direct model writes.
 */

const fetch = global.fetch || require('node-fetch');
const path = require('path');
const models = require('../src/models');
const { CandidateTest, Candidate } = models;
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

async function ensure30MCQs() {
  // fetch public questions
  const res = await fetch('http://localhost:5000/api/public/questions');
  const data = await res.json();
  const all = Array.isArray(data) ? data : (data.data && data.data.questions) || [];
  const mcqs = all.filter(q => q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE');
  const ids = mcqs.map(q => q.question_id);

  while (ids.length < 30) {
    const idx = ids.length + 1;
    const qpayload = { question_text: `Auto MCQ question ${idx}`, question_type: 'SINGLE_CHOICE', difficulty_level: 'MEDIUM', options: [ { option_text: 'A', is_correct: true }, { option_text: 'B', is_correct: false }, { option_text: 'C', is_correct: false }, { option_text: 'D', is_correct: false } ] };
    const r = await fetch('http://localhost:5000/api/public/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(qpayload) });
    const created = await r.json().catch(() => null);
    if (r.ok && created && created.question_id) {
      ids.push(created.question_id);
      console.log('Created question id', created.question_id);
    } else if (created && created.data && created.data.question_id) {
      ids.push(created.data.question_id);
    } else if (created && created.test && created.test.questions) {
      // unlikely
    } else {
      throw new Error('Failed to create question: ' + JSON.stringify(created));
    }
  }

  return ids.slice(0, 30);
}

async function createTestWithQuestions(questionIds) {
  const payload = { test_name: `Auto 30-MCQ Test ${Date.now()}`, duration_minutes: 30, questions: questionIds.map((id, i) => ({ question_id: id, question_order: i+1, score_weight: 1 })) };
  const r = await fetch('http://localhost:5000/api/public/tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const body = await r.json();
  if (r.ok && body && body.data && body.data.test) {
    console.log('Created test id', body.data.test.test_id);
    return body.data.test;
  }
  throw new Error('Failed to create test: ' + JSON.stringify(body));
}

async function createCandidate() {
  const email = `auto-${Date.now()}@example.com`;
  const c = await Candidate.create({ first_name: 'Auto', last_name: 'Submit', email, status: 'NEW' });
  console.log('Created candidate id', c.candidate_id, 'email', email);
  return c;
}

async function createCandidateTest(candidate_id, test_id) {
  // sign token using config secret
  const token = jwt.sign({ candidate_id, test_id }, config.jwt.testAccessSecret || 'test-access-secret-key', { expiresIn: '7d' });
  const expiry = new Date(); expiry.setDate(expiry.getDate() + 7);
  const ct = await CandidateTest.create({ candidate_id, test_id, status: 'PENDING', access_token: token, access_token_expiry: expiry });
  console.log('Created candidate_test_id', ct.candidate_test_id);
  return { candidate_test: ct, access_token: token };
}

async function simulateCandidateFlow(candidate_test_id) {
  console.log('Starting candidate test via API...');
  // start
  const startRes = await fetch(`http://localhost:5000/api/candidate-tests/${candidate_test_id}/start`, { method: 'POST' });
  const startJson = await startRes.json().catch(() => null);
  if (!startRes.ok) throw new Error('Start failed: ' + JSON.stringify(startJson));
  const questions = startJson.data.questions || [];
  console.log('Received', questions.length, 'questions');

  // submit answers sequentially
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.options || q.options.length === 0) continue;
    const chosen = q.options[i % q.options.length];
    const ansRes = await fetch(`http://localhost:5000/api/candidate-tests/${candidate_test_id}/answer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: q.question_id, selected_option_id: chosen.option_id }) });
    const ansJson = await ansRes.json().catch(() => null);
    if (!ansRes.ok) console.warn('Answer failed for q', q.question_id, ansJson);
  }

  // complete
  const compRes = await fetch(`http://localhost:5000/api/candidate-tests/${candidate_test_id}/complete`, { method: 'POST' });
  const compJson = await compRes.json().catch(() => null);
  console.log('Complete response:', compJson);
}

async function main() {
  try {
    console.log('Ensuring 30 MCQs...');
    const qids = await ensure30MCQs();
    console.log('Creating test...');
    const test = await createTestWithQuestions(qids);

    console.log('Creating candidate...');
    const candidate = await createCandidate();

    console.log('Creating candidate_test...');
    const { candidate_test, access_token } = await createCandidateTest(candidate.candidate_id, test.test_id);

    console.log('Simulating candidate flow...');
    await simulateCandidateFlow(candidate_test.candidate_test_id);

    console.log('Demo finished. Candidate test id:', candidate_test.candidate_test_id);
    process.exit(0);
  } catch (err) {
    console.error('Demo error:', err);
    process.exit(1);
  }
}

main();
