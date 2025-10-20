'use strict';

import { unique } from "viem/chains";
import { OrderStatus } from "../utils/types.js";

/** @type {import('sequelize-cli').Migration} */
export async function up (queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      buyer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          key: 'id',
          model: 'users'
        }
      },
      seller_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          key: 'id',
          model: 'users'
        }
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          key: 'id',
          model: 'products'
        }
      },
      order_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      escrow_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      token_symbol: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      metadata_uri: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM(
          OrderStatus.pending,
          OrderStatus.paid,
          OrderStatus.shipped,
          OrderStatus.delivered,
          OrderStatus.completed,
          OrderStatus.cancelled,
          OrderStatus.disputed,
          OrderStatus.refunded
        ),
        default: OrderStatus.pending
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  }

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('orders');
}