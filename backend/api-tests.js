const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = null;

// Helper functions
async function login() {
  try {
    console.log('Logging in as admin...');
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      authToken = data.data.token;
      console.log('Login successful!\n');
      return true;
    } else {
      console.log('Login failed:', data);
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`API request error (${endpoint}):`, error);
    return {
      status: 500,
      data: { success: false, message: error.message }
    };
  }
}

// Test functions
async function testGetAllUsers() {
  console.log('Testing GET /users...');
  const result = await apiRequest('/users');
  console.log(`Status: ${result.status}`);
  console.log('Data:', JSON.stringify(result.data, null, 2));
  console.log('------------------------\n');
}

async function testCreateUser() {
  console.log('Testing POST /users (Create new user)...');
  const newUser = {
    username: 'hruser',
    email: 'hr@example.com',
    password: 'password123',
    full_name: 'HR User',
    role_id: 2 // Assuming role_id 2 exists
  };
  
  const result = await apiRequest('/users', 'POST', newUser);
  console.log(`Status: ${result.status}`);
  console.log('Data:', JSON.stringify(result.data, null, 2));
  console.log('------------------------\n');
  
  return result.data?.data?.user_id;
}

async function testGetUserById(userId) {
  console.log(`Testing GET /users/${userId}...`);
  const result = await apiRequest(`/users/${userId}`);
  console.log(`Status: ${result.status}`);
  console.log('Data:', JSON.stringify(result.data, null, 2));
  console.log('------------------------\n');
}

// Main function to run all tests
async function runTests() {
  const isLoggedIn = await login();
  
  if (!isLoggedIn) {
    console.log('Could not login. Aborting tests.');
    return;
  }
  
  // Test user APIs
  await testGetAllUsers();
  const newUserId = await testCreateUser();
  
  if (newUserId) {
    await testGetUserById(newUserId);
  }
}

// Run the tests
runTests();
