'use strict';
import { Model } from 'sequelize';
import { OrderStatus } from '../utils/types.js';

export default (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, {
        foreignKey: 'buyer_id',
        as: 'buyer'
      });
      Order.belongsTo(models.User, {
        foreignKey: 'seller_id',
        as: 'seller'
      });
      Order.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
      Order.hasOne(models.Transaction, {
        foreignKey: 'order_id',
        as: 'transaction'
      });
      // Order.hasOne(models.ProductDelivery, {
      //   foreignKey: 'order_id',
      //   as: 'delivery'
      // });
    }

    isActive() {
      return [OrderStatus.pending, OrderStatus.paid, OrderStatus.shipped].includes(this.status);
    }

    canBeCancelled() {
      return [OrderStatus.pending, OrderStatus.paid].includes(this.status);
    }

    markAsPaid() {
      return this.update({
        status: OrderStatus.paid,
        paid_at: new Date()
      });
    }

    markAsCompleted() {
      return this.update({
        status: OrderStatus.completed,
        completed_at: new Date()
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    buyer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    seller_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    escrow_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    token_symbol: {
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM(
        OrderStatus.pending,
        OrderStatus.paid,
        OrderStatus.shipped,
        OrderStatus.delivered,
        OrderStatus.completed,
        OrderStatus.cancelled,
        OrderStatus.disputed,
        OrderStatus.refunded
      ),
      defaultValue: OrderStatus.pending
    },
    metadata_uri: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders'
  });

  return Order;
};