const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Test creating a new user directly through Sequelize
async function createTestUser() {
  try {
    // Connect to the database
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
      }
    );

    await sequelize.authenticate();
    console.log('Database connection successful');

    // Find the HR role (assume role_id 2 is HR)
    const [roles] = await sequelize.query(`SELECT * FROM roles`);
    console.log('Available roles:');
    roles.forEach(role => {
      console.log(`- ${role.role_id}: ${role.role_name} (${role.description})`);
    });

    // Choose a role that is not ADMIN
    const hrRole = roles.find(r => r.role_name === 'HR') || roles[1];
    
    if (!hrRole) {
      console.log('Could not find a suitable role for the test user');
      return;
    }

    // Hash password
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const [results] = await sequelize.query(`
      INSERT INTO users 
        (username, email, password_hash, full_name, role_id, is_active, created_at, updated_at) 
      VALUES 
        ('testuser', 'testuser@example.com', :passwordHash, 'Test User', :roleId, 1, NOW(), NOW())
    `, {
      replacements: {
        passwordHash: hashedPassword,
        roleId: hrRole.role_id
      }
    });

    console.log('User created successfully:', results);
    
    // Get the user to verify
    const [user] = await sequelize.query(`
      SELECT user_id, username, email, full_name, role_id 
      FROM users 
      WHERE username = 'testuser'
    `);
    
    console.log('Created user:', user);

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
