const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define RolePermission model
const RolePermission = sequelize.define('RolePermission', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'roles',
      key: 'role_id'
    }
  },
  permission_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'permissions',
      key: 'permission_id'
    }
  }
}, {
  tableName: 'role_permissions',
  timestamps: false
});

module.exports = RolePermission;
