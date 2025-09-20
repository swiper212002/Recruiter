const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');
require('dotenv').config();

async function resetAdminPassword() {
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

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection successful');

    // Hash the new password
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update the admin password
    const [affectedRows] = await sequelize.query(
      `UPDATE users SET password_hash = :newPasswordHash WHERE username = 'admin'`,
      {
        replacements: { newPasswordHash },
        type: Sequelize.QueryTypes.UPDATE,
      }
    );

    console.log(`Updated ${affectedRows} row(s)`);
    console.log('New password hash:', newPasswordHash);
    
    // Verify the admin password was updated
    const [adminUser] = await sequelize.query(
      `SELECT user_id, username, password_hash FROM users WHERE username = 'admin'`,
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    
    console.log('Admin user:', adminUser);
    
    // Test that the new password works with the updated hash
    const isMatch = await bcrypt.compare(newPassword, adminUser.password_hash);
    console.log(`Password "${newPassword}" matches new hash: ${isMatch}`);
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword();
