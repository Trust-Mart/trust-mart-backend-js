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
      //       this.hasMany(models.Product, { foreignKey: 'sellerId', as: 'products' });
      // this.hasMany(models.Order, { foreignKey: 'buyerId', as: 'orders' });
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

        /**
     * Assign role dynamically
     */
    async assignRole(role) {
      if (!this.roles.includes(role)) {
        this.roles.push(role);
        await this.save();
      }
    }

    /**
     * Check if user has a specific role
     */
    hasRole(role) {
      return this.roles.includes(role);
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
    emailVerifiedAt: DataTypes.DATE,
    roles: DataTypes.ARRAY(DataTypes.STRING)
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });
  return User;
};