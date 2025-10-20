'use strict'

import { Model } from 'sequelize';

export default (sequelize, DataTypes) => {
  class LinkedAccount extends Model {

    static associate(models) {
      LinkedAccount.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  LinkedAccount.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      providerUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      profileImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      accessToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tokenType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      expiresIn: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      scope: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signedRequest: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: "Stores raw provider response or extra attributes",
      },
    },
     {
    sequelize,
    modelName: 'LinkedAccount',
    tableName: 'linked_accounts'
  })

  return LinkedAccount;
}

// DataTypes.ENUM("twitter", "facebook", "instagram", "email")
