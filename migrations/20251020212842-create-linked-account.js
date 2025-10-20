'use strict'
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("linked_accounts", {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    provider: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    providerUserId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: true
    },
    displayName:{
      type: Sequelize.STRING,
      allowNull: true
    },
    profileImageUrl: {
      type: Sequelize.STRING,
      allowNull: true
    },
    accessToken: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    tokenType: {
      type: Sequelize.STRING,
      allowNull: true
    },
    expiresIn: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    scope: {
      type: Sequelize.STRING,
      allowNull: true
    },
    signedRequest: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    metadata: Sequelize.JSONB,
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    }
  });

  await queryInterface.addIndex("linked_accounts", ["userId", "provider"], {
    unique: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("linked_accounts");
}
