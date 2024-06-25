import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  rankings: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  tableName: 'Users',
  timestamps: true, // Enable timestamps
});

export default User;
