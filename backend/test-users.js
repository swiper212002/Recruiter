const fetch = require('node-fetch');

async function testUserManagement() {
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
    
    // Create a new user
    const newUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      full_name: 'Test User',
      role_id: 2 // Assuming role_id 2 exists (HR, Interviewer, etc.)
    };
    
    const createResponse = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newUser)
    });

    const createData = await createResponse.json();
    console.log('\nPOST /api/users');
    console.log('Status:', createResponse.status);
    console.log('Response:', JSON.stringify(createData, null, 2));
    
    // If user was created successfully, let's get the user by ID
    if (createResponse.status === 201 && createData.success) {
      const userId = createData.data.id;
      
      const getUserResponse = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
  
      const userData = await getUserResponse.json();
      console.log(`\nGET /api/users/${userId}`);
      console.log('Status:', getUserResponse.status);
      console.log('Response:', JSON.stringify(userData, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserManagement();
