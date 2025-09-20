const bcrypt = require('bcryptjs');

async function testPasswordHash() {
  const storedHash = '$2a$10$8uN2o9m4Qr1UG4lqjJ9iteNWF2cwURVIwO9oM1kyxTqH4tK70QUOy';
  
  const passwords = ['admin123', 'admin', 'password', 'Admin123', 'admin123!'];
  
  try {
    for (const password of passwords) {
      const isMatch = await bcrypt.compare(password, storedHash);
      console.log(`Password "${password}" matches: ${isMatch}`);
    }
    
    console.log('\nTesting original password:');
    const password = 'admin123';
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Password:', password);
    console.log('Hash:', storedHash);
    console.log('Matches:', isMatch);

    // Let's also generate a new hash with the same password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(password, salt);
    console.log('New hash generated:', newHash);
    console.log('New hash matches original:', await bcrypt.compare(password, newHash));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPasswordHash();
