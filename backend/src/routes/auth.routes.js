const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { loginValidation, registerValidation } = require('../middlewares/validation.middleware');

// Public routes
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
