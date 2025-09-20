const request = require('supertest');
const BASE = 'http://localhost:5000';

describe('Public POST /tests', () => {
  it('creates a test with questions and returns warnings when duplicates provided', async () => {
    // First create a question to reference
    const qRes = await request(BASE).post('/api/public/questions').send({
      question_text: 'Post-test question',
      question_type: 'SINGLE_CHOICE',
      difficulty_level: 'EASY',
      options: [{ option_text: 'OK', is_correct: true }]
    }).expect(201);

    const qid = qRes.body.question_id || qRes.body.question.question_id || qRes.body.question_id;

    const payload = {
      test_name: 'Integration Test - create test',
      duration_minutes: 10,
      questions: [ { question_id: qid }, { question_id: qid } ]
    };

    const res = await request(BASE).post('/api/public/tests').send(payload).expect(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.test).toHaveProperty('test_id');
    expect(res.body).toHaveProperty('warnings');
    expect(Array.isArray(res.body.warnings)).toBe(true);
  });

  it('returns 400 when strict=true and duplicates are present', async () => {
    // Create another question
    const qRes = await request(BASE).post('/api/public/questions').send({
      question_text: 'Strict mode question',
      question_type: 'SINGLE_CHOICE',
      difficulty_level: 'EASY',
      options: [{ option_text: 'OK', is_correct: true }]
    }).expect(201);

    const qid = qRes.body.question_id || qRes.body.question.question_id || qRes.body.question_id;

    const payload = {
      test_name: 'Strict Test',
      duration_minutes: 5,
      questions: [ { question_id: qid }, { question_id: qid } ]
    };

    const res = await request(BASE).post('/api/public/tests?strict=true').send(payload).expect(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('duplicates');
  });

  it('returns 400 when referenced question ids do not exist', async () => {
    const payload = {
      test_name: 'Missing ids test',
      questions: [ { question_id: 999999 } ]
    };

    const res = await request(BASE).post('/api/public/tests').send(payload).expect(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('missing');
  });
});
