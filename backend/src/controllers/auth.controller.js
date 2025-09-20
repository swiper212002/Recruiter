const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, SystemLog } = require('../models');
const { Sequelize } = require('sequelize');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * User authentication controller
 */
const authController = {
  /**
   * Login with username/password
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await User.findOne({ 
        where: { username },
        include: [{ model: Role }]
      });
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
      }
      
      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
      }
      
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { id: user.user_id, username: user.username, role: user.Role?.role_name },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );
      
      // Update last login time
      user.last_login = new Date();
      await user.save();
      
      // Log login action
      await SystemLog.create({
        user_id: user.user_id,
        action: 'LOGIN',
        description: 'User logged in',
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
      
      // Return user info and token
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.user_id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.Role?.role_name
          },
          token
        }
      });
      
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng nhập' });
    }
  },
  
  /**
   * Register a new candidate account
   */
  register: async (req, res) => {
    try {
      const { username, email, password, full_name } = req.body;
      
      // Check if username or email already exists
      const existingUser = await User.findOne({
        where: { 
          [sequelize.Op.or]: [{ username }, { email }] 
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập hoặc email đã tồn tại'
        });
      }
      
      // Find candidate role
      const candidateRole = await Role.findOne({
        where: { role_name: 'CANDIDATE' }
      });
      
      if (!candidateRole) {
        return res.status(500).json({
          success: false,
          message: 'Không tìm thấy vai trò ứng viên'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      const newUser = await User.create({
        username,
        email,
        password_hash: hashedPassword,
        full_name,
        role_id: candidateRole.role_id,
        is_active: true
      });
      
      // Log registration
      await SystemLog.create({
        user_id: newUser.user_id,
        action: 'REGISTER',
        description: 'New candidate account registered',
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
      
      // Return success
      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: {
          id: newUser.user_id,
          username: newUser.username,
          email: newUser.email
        }
      });
      
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng ký' });
    }
  },

  /**
   * Get current user profile
   */
  getProfile: async (req, res) => {
    try {
      // User is already loaded in authenticate middleware
      const user = req.user;
      
      return res.status(200).json({
        success: true,
        data: {
          id: user.user_id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.Role?.role_name,
          lastLogin: user.last_login
        }
      });
      
    } catch (error) {
      logger.error(`Get profile error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
    }
  },

  /**
   * Change user password
   */
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.user_id;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
        });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }
      
      // Find user
      const user = await User.findByPk(userId);
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác'
        });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Update password
      user.password_hash = hashedPassword;
      await user.save();
      
      // Log password change
      await SystemLog.create({
        user_id: userId,
        action: 'CHANGE_PASSWORD',
        description: 'User changed password',
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
      
      return res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
      
    } catch (error) {
      logger.error(`Change password error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đổi mật khẩu' });
    }
  },

  /**
   * Logout user
   */
  logout: async (req, res) => {
    try {
      // Log logout action
      if (req.user) {
        await SystemLog.create({
          user_id: req.user.user_id,
          action: 'LOGOUT',
          description: 'User logged out',
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
      });
      
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng xuất' });
    }
  }
};

module.exports = authController;
