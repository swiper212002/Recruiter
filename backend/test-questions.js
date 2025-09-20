const fetch = require('node-fetch');

async function testQuestions() {
  try {
    // First login to get the token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('Login failed:', loginData);
      return;
    }
    
    const token = loginData.data.token;
    console.log('Login successful. Token received.');
    
    // Get all questions
    const questionsResponse = await fetch('http://localhost:5000/api/questions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const questionsData = await questionsResponse.json();
    console.log('\nGET /api/questions');
    console.log('Status:', questionsResponse.status);
    console.log('Response:', JSON.stringify(questionsData, null, 2));
    
    // Create a new question
    const newQuestion = {
      question_text: 'What is Node.js?',
      question_type: 'MULTIPLE_CHOICE',
      difficulty_level: 'MEDIUM',
      category_id: 1, // Assuming category 1 exists
      tags: ['nodejs', 'javascript', 'backend'],
      options: [
        { option_text: 'A programming language', is_correct: false },
        { option_text: 'A runtime environment for executing JavaScript code', is_correct: true },
        { option_text: 'A database management system', is_correct: false },
        { option_text: 'A web browser', is_correct: false }
      ],
      explanation: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine'
    };
    
    const createResponse = await fetch('http://localhost:5000/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newQuestion)
    });

    const createData = await createResponse.json();
    console.log('\nPOST /api/questions');
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuestions();
