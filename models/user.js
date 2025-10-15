'use strict';
import {
  Model
} from 'sequelize';
export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    getFullName() {
      return `${this.firstname} ${this.lastname}`.trim();
    }

    /**
     * Check if user is verified
     */
    isEmailVerified() {
      return this.isverified && this.emailVerifiedAt !== null;
    }

    /**
     * Get safe user data (without sensitive fields)
     */
    getSafeUserData() {
      const { password, verificationToken, privateKey, ...safeData } = this.toJSON();
      return safeData;
    }
  }
  User.init({
    email: DataTypes.STRING,
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    privateKey: DataTypes.TEXT,
    pin: DataTypes.STRING,
    walletAddress: DataTypes.STRING,
    smartAccountAddress: DataTypes.STRING,
    smartAccountBalance: DataTypes.DECIMAL(20, 9),
    country: DataTypes.STRING,
    lastLoginAt: DataTypes.DATE,
    isverified: DataTypes.BOOLEAN,
    verificationToken: DataTypes.STRING,
    emailVerifiedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });
  return User;
};