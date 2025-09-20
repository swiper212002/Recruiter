const request = require('supertest');

// Use the running backend server (assumes Docker or local server is running on port 5000)
const BASE = 'http://localhost:5000';

describe('Public routes', () => {
  it('GET /api/public/questions should return 200 and an array', async () => {
    const res = await request(BASE).get('/api/public/questions').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/public/questions should create a question', async () => {
    const payload = {
      question_text: 'Integration test question',
      question_type: 'SINGLE_CHOICE',
      difficulty_level: 'EASY',
      options: [
        { option_text: 'A', is_correct: false },
        { option_text: 'B', is_correct: true }
      ]
    };

    const res = await request(BASE).post('/api/public/questions').send(payload).expect(201);
    expect(res.body).toHaveProperty('question_id');
    expect(res.body).toHaveProperty('QuestionOptions');
  });
});
