const fetch = require('node-fetch');

async function testGetUsers() {
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
    
    // Get all users
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const usersData = await usersResponse.json();
    console.log('\nGET /api/users');
    console.log('Status:', usersResponse.status);
    console.log('Response:', JSON.stringify(usersData, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetUsers();
