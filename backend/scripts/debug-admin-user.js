const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { User, Role, sequelize } = require('../src/models');
const config = require('../src/config/config');

async function debug() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated');

    const user = await User.findOne({ where: { username: 'admin' }, include: [{ model: Role }] });
    if (!user) {
      console.log('Admin user not found');
      process.exit(0);
    }

    console.log('Admin user:');
    console.log({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.Role ? user.Role.role_name : null,
      is_active: user.is_active,
      password_hash: user.password_hash ? user.password_hash.substring(0, 20) + '...' : null
    });

    console.log('JWT secret (from config):', !!config.jwt.secret ? '[SET]' : '[NOT SET]');
    console.log('JWT secret preview:', (config.jwt.secret || '').slice(0, 8) + (config.jwt.secret && config.jwt.secret.length > 8 ? '...' : ''));

    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err.message || err);
    process.exit(1);
  }
}

debug();
