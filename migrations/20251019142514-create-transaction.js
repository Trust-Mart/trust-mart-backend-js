'use strict';

import { PaymentStatus, TransactionType } from "../utils/types.js";

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('transactions', {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    },
    sender_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'User', // CHANGED FROM 'User' to 'users'
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    recipient_id: {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'User', // CHANGED FROM 'User' to 'users'
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'Product',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    order_id: {
      type: Sequelize.STRING,
      allowNull: false,
      references: {
        model: 'Order',
        key: 'order_id'
      },
      onDelete: 'CASCADE'
    },
    escrow_address: {
      type: Sequelize.STRING,
      allowNull: true
    },
    token_address: {
      type: Sequelize.STRING,
      allowNull: false
    },
    token_symbol: {
      type: Sequelize.STRING,
      allowNull: false
    },
    amount: {
      type: Sequelize.DECIMAL(36, 18),
      allowNull: false
    },
    amount_usd: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    platform_fee: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM(
        PaymentStatus.pending,
        PaymentStatus.submitted,
        PaymentStatus.confirmed, 
        PaymentStatus.failed,
        PaymentStatus.cancelled
      ),
      defaultValue: 'pending'
    },
    transaction_type: {
      type: Sequelize.ENUM(
        TransactionType.escrow_create,
        TransactionType.escrow_release,
        TransactionType.escrow_refund,
        TransactionType.escrow_dispute,
        TransactionType.direct_transfer
      ),
      allowNull: false
    },
    blockchain_tx_hash: {
      type: Sequelize.STRING,
      allowNull: true
    },
    user_op_hash: {
      type: Sequelize.STRING,
      allowNull: true
    },
    block_number: {
      type: Sequelize.BIGINT,
      allowNull: true
    },
    gas_used: {
      type: Sequelize.BIGINT,
      allowNull: true
    },
    metadata_uri: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    failure_reason: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    submitted_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    confirmed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    failed_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    metadata: {
      type: Sequelize.JSONB,
      defaultValue: {}
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    }
  });

  await queryInterface.addIndex('transactions', ['transaction_id']);
  await queryInterface.addIndex('transactions', ['order_id']);
  await queryInterface.addIndex('transactions', ['sender_id']);
  await queryInterface.addIndex('transactions', ['recipient_id']);
  await queryInterface.addIndex('transactions', ['status']);
  // await queryInterface.addIndex('transactions', ['created_at']);
  await queryInterface.addIndex('transactions', ['escrow_address']);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('transactions');
}