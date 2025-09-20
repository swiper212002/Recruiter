const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../src/models');

async function reset() {
  try {
    await sequelize.authenticate();
    console.log('DB authenticated');

    const user = await User.findOne({ where: { username: 'admin' } });
    if (!user) {
      console.log('Admin user not found');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('adminpass', salt);

    user.password_hash = hashed;
    await user.save();

    console.log('Admin password reset to: adminpass');
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message || err);
    process.exit(1);
  }
}

reset();
