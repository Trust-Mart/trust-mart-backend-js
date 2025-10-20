'use strict';
import { Model } from 'sequelize';
import { OrderStatus, PaymentStatus, TransactionType } from '../utils/types.js';

export default (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.User, {
        foreignKey: 'sender_id',
        as: 'sender'
      });
      Transaction.belongsTo(models.User, {
        foreignKey: 'recipient_id',
        as: 'recipient'
      });
      Transaction.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
    //   Transaction.belongsTo(models.Order, {
    //     foreignKey: 'order_id',
    //     as: 'order'
    //   });
    }

    markAsSubmitted(txHash) {
      return this.update({
        status: 'submitted',
        blockchain_tx_hash: txHash,
        submitted_at: new Date()
      });
    }

    markAsConfirmed(blockNumber, gasUsed) {
      return this.update({
        status: 'confirmed',
        block_number: blockNumber,
        gas_used: gasUsed,
        confirmed_at: new Date()
      });
    }

    markAsFailed(error = null) {
      return this.update({
        status: 'failed',
        failed_at: new Date(),
        ...(error && { failure_reason: error })
      });
    }

    isFinal() {
      return ['confirmed', 'failed', 'cancelled'].includes(this.status);
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipient_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        key: 'order_id',
        model: 'orders'
      }
    },
    escrow_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    token_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    token_symbol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(36, 18),
      allowNull: false
    },
    amount_usd: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    platform_fee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        PaymentStatus.pending,
        PaymentStatus.submitted,
        PaymentStatus.confirmed, 
        PaymentStatus.failed,
        PaymentStatus.cancelled
      ),
      defaultValue: OrderStatus.pending
    },
    transaction_type: {
      type: DataTypes.ENUM(
        TransactionType.escrow_create,
        TransactionType.escrow_release,
        TransactionType.escrow_refund,
        TransactionType.escrow_dispute,
        TransactionType.direct_transfer
      ),
      allowNull: false
    },
    blockchain_tx_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_op_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    block_number: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    gas_used: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    metadata_uri: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    indexes: [
      {
        fields: ['transaction_id']
      },
      {
        fields: ['order_id']
      },
      {
        fields: ['sender_id']
      },
      {
        fields: ['recipient_id']
      },
      {
        fields: ['status']
      },
      // {
      //   fields: ['created_at']
      // }
    ]
  });

  return Transaction;
};