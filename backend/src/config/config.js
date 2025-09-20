require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    testAccessSecret: process.env.JWT_TEST_ACCESS_SECRET || 'test-access-secret-key'
  },
  upload: {
    directory: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
