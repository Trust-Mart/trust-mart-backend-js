'use strict';

import { AuthMethod, UserRoles } from '../utils/types.js';

/** @type {import('sequelize-cli').Migration} */
  export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      social_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      privatekey: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pin: {
        type: Sequelize.STRING,
        allowNull: true
      },
      walletAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      smartAccountAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      smartAccountBalance: {
        type: Sequelize.DECIMAL(20, 9),
        default: 0,
        allowNull: true,
      },
      isverified: {
        type: Sequelize.BOOLEAN,
        default: false,
        allowNull: true
      },
      verificationToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emailVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      roles: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        default: [UserRoles.buyer]
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      auth_method: {
        type: Sequelize.ENUM(
          AuthMethod.regular,
          AuthMethod.social,
          AuthMethod.both
        )
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

  await queryInterface.addIndex('Users', ['email'], {
    name: 'users_email_index',
    unique: true
  });

  await queryInterface.addIndex('Users', ['username'], {
    name: 'users_username_index',
    unique: true
  });

  await queryInterface.addIndex('users', ['walletAddress'], {
    name: 'users_wallet_address_index',
    where: {
      walletAddress: {
        [Sequelize.Op.ne]: null
      }
    }
  });

  await queryInterface.addIndex('users', ['smartAccountAddress'], {
    name: 'users_smart_account_address_index',
    where: {
      smartAccountAddress: {
        [Sequelize.Op.ne]: null
      }
    }
  });  

    await queryInterface.addIndex('users', ['social_id'], {
    name: 'users_social_id_index',
    where: {
      smartAccountAddress: {
        [Sequelize.Op.ne]: null
      }
    }
  });  

    await queryInterface.addIndex('users', ['smartAccountBalance'], {
    name: 'users_smart_account_balance_index',
    where: {
      smartAccountBalance: {
        [Sequelize.Op.ne]: null
      }
    }
  }); 

  }
  
  export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }