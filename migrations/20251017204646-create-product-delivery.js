'use strict';

import { DeliveryStatus } from '../utils/types.js';

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('product_deliveries', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    product_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    seller_id: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    pickup_location: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    estimated_delivery_days: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    buyer_location: {
      type: Sequelize.STRING,
      allowNull: true
    },
    actual_delivery_date: {
      type: Sequelize.DATE,
      allowNull: true
    },
    delivery_status: {
      type: Sequelize.ENUM(
        DeliveryStatus.delivered,
        DeliveryStatus.disputed,
        DeliveryStatus.in_transit,
        DeliveryStatus.pending
      )
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true
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
  await queryInterface.dropTable('product_deliveries');
}