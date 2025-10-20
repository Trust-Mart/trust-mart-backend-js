'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      seller_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      name: {
        type: Sequelize.STRING,
         allowNull: false
      },
      descrption: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      image_cid: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL,
        allowNull: false
      },
      quantity: {
        type: Sequelize.BIGINT
      },
      currency: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM(

        )
      },
      ai_verification_score: {
        type: Sequelize.DECIMAL
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

    await queryInterface.addIndex('products', ['seller_id'], {
      name: 'users_seller_id_index',
      unique: true
    });

  }

  export async function up(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  }