const fetch = require('node-fetch');

async function testProfile() {
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
    
    // Use the token to get user profile
    const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const profileData = await profileResponse.json();
    console.log('Profile response status:', profileResponse.status);
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testProfile();
