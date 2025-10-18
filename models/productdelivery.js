'use strict';
import {
  Model
} from 'sequelize';
import { DeliveryStatus } from '../utils/types.js';

export default (sequelize, DataTypes) => {
  class ProductDelivery extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductDelivery.belongsTo(models.User, {
        foreignKey: 'seller_id',
        as: 'seller',
        onDelete: 'CASCADE'
      });

      ProductDelivery.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE'
      });
    }
  }

  ProductDelivery.init({
    product_id: DataTypes.BIGINT,
    seller_id: DataTypes.BIGINT,
    pickup_location: DataTypes.STRING,
    estimated_delivery_days: DataTypes.INTEGER,
    buyer_location: DataTypes.STRING,
    actual_delivery_date: DataTypes.DATE,
    delivery_status: DataTypes.ENUM(
      DeliveryStatus.delivered,
      DeliveryStatus.disputed,
      DeliveryStatus.in_transit,
      DeliveryStatus.pending
    ),
    notes: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ProductDelivery',
    tableName: 'product_deliveries'
  });
  return ProductDelivery;
};