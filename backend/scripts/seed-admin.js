const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { User, Role, SystemLog, sequelize } = require('../src/models');

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated for admin seeding');

    // Ensure ADMIN role exists
    let adminRole = await Role.findOne({ where: { role_name: 'ADMIN' } });
    if (!adminRole) {
      adminRole = await Role.create({ role_name: 'ADMIN', description: 'Administrator role' });
      console.log('Created ADMIN role');
    }

    // Check for existing admin user
    const existing = await User.findOne({ where: { username: 'admin' } });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('adminpass', salt);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.local',
      password_hash: hashed,
      full_name: 'Local Admin',
      role_id: adminRole.role_id,
      is_active: true
    });

    console.log('Created admin user: admin / adminpass');
    process.exit(0);
  } catch (err) {
    console.error('Admin seeding failed:', err.message || err);
    process.exit(1);
  }
}

seedAdmin();
