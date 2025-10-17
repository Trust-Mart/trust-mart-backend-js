'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'socialAccounts', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'lastSocialUpdate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'legitimacyScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'legitimacyRiskLevel', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'lastLegitimacyCheck', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'legitimacyHistory', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'behaviorScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'behaviorRiskLevel', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'lastBehaviorCheck', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'behaviorHistory', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'sellerScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'sellerScoreTier', {
      type: Sequelize.ENUM('excellent', 'veryGood', 'good', 'fair', 'poor', 'veryPoor'),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'sellerScoreLabel', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'sellerScoreColor', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'sellerScoreBadge', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'lastScoreUpdate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'scoreBreakdown', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'reputationScore', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'reputationTier', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('users', 'reputationUpdatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'socialAccounts');
    await queryInterface.removeColumn('users', 'lastSocialUpdate');
    await queryInterface.removeColumn('users', 'legitimacyScore');
    await queryInterface.removeColumn('users', 'legitimacyRiskLevel');
    await queryInterface.removeColumn('users', 'lastLegitimacyCheck');
    await queryInterface.removeColumn('users', 'legitimacyHistory');
    await queryInterface.removeColumn('users', 'behaviorScore');
    await queryInterface.removeColumn('users', 'behaviorRiskLevel');
    await queryInterface.removeColumn('users', 'lastBehaviorCheck');
    await queryInterface.removeColumn('users', 'behaviorHistory');
    await queryInterface.removeColumn('users', 'sellerScore');
    await queryInterface.removeColumn('users', 'sellerScoreTier');
    await queryInterface.removeColumn('users', 'sellerScoreLabel');
    await queryInterface.removeColumn('users', 'sellerScoreColor');
    await queryInterface.removeColumn('users', 'sellerScoreBadge');
    await queryInterface.removeColumn('users', 'lastScoreUpdate');
    await queryInterface.removeColumn('users', 'scoreBreakdown');
    await queryInterface.removeColumn('users', 'reputationScore');
    await queryInterface.removeColumn('users', 'reputationTier');
    await queryInterface.removeColumn('users', 'reputationUpdatedAt');
  }
};
