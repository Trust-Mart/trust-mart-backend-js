'use strict';
import {
  Model
} from 'sequelize';

import { ProductStatus } from '../utils/types.js';

export default (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.User, {
        foreignKey: 'seller_id',
        as: 'seller',
        onDelete: 'CASCADE'
      });

      Product.hasOne(models.ProductDelivery, {
        foreignKey: 'product_id',
        as: 'product',
        onDelete: 'CASCADE'
      })
    }
  }

  Product.init({
    seller_id: DataTypes.BIGINT,
    name: DataTypes.STRING,
    descrption: DataTypes.TEXT,
    image_cid: DataTypes.ARRAY(DataTypes.STRING),
    price: DataTypes.DECIMAL,
    quantity: DataTypes.BIGINT,
    currency: DataTypes.STRING,
    status: DataTypes.ENUM(
      ProductStatus.active,
      ProductStatus.paused,
      ProductStatus.sold_out,
      ProductStatus.under_review,
      ProductStatus.flagged
    ),
    ai_verification_score: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products'
  });
  return Product;
}