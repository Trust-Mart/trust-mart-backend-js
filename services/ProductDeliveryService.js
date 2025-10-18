import { Op } from 'sequelize';
import db from '../models/index.js';
import { DeliveryStatus, ProductStatus } from '../utils/types.js';

const { ProductDelivery, Product, User } = db;

class ProductDeliveryService {
  /**
   * Create delivery details for a product and activate the product
   */
  static async createDelivery(deliveryData) {
    try {
      const {
        product_id,
        seller_id,
        pickup_location,
        estimated_delivery_days,
        buyer_location,
        notes
      } = deliveryData;

      // Verify product exists and belongs to seller
      const product = await Product.findOne({
        where: { 
          id: product_id, 
          seller_id: seller_id 
        }
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      // Check if delivery already exists for this product
      const existingDelivery = await ProductDelivery.findOne({
        where: { product_id }
      });

      if (existingDelivery) {
        throw new Error('Delivery details already exist for this product');
      }

      // Create delivery record
      const delivery = await ProductDelivery.create({
        product_id,
        seller_id,
        pickup_location: pickup_location.trim(),
        estimated_delivery_days: parseInt(estimated_delivery_days),
        buyer_location: buyer_location?.trim(),
        notes: notes?.trim(),
        delivery_status: DeliveryStatus.pending
      });

      // Update product status to active
      await Product.update(
        { status: ProductStatus.active },
        { where: { id: product_id } }
      );

      // Refresh product data
      const updatedProduct = await Product.findByPk(product_id);

      return {
        success: true,
        delivery: this.serializeDelivery(delivery),
        product: updatedProduct,
        message: 'Delivery details added successfully. Product is now active.'
      };
    } catch (error) {
      console.error('Error creating delivery:', error);
      
      if (error.message.includes('Product not found') || 
          error.message.includes('Delivery details already exist')) {
        throw new Error(error.message);
      }
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        throw new Error(`Delivery validation failed: ${JSON.stringify(validationErrors)}`);
      }
      
      throw new Error(`Failed to create delivery details: ${error.message}`);
    }
  }

  /**
   * Get delivery by ID
   */
  static async getDeliveryById(deliveryId, includeAssociations = false) {
    try {
      const options = {
        where: { id: deliveryId }
      };

      if (includeAssociations) {
        options.include = [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'currency', 'status']
          },
          {
            model: User,
            as: 'seller',
            attributes: ['id', 'username', 'email']
          }
        ];
      }

      const delivery = await ProductDelivery.findOne(options);

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      return {
        success: true,
        delivery: this.serializeDelivery(delivery)
      };
    } catch (error) {
      console.error('Error getting delivery by ID:', error);
      throw new Error(`Failed to retrieve delivery: ${error.message}`);
    }
  }

  /**
   * Get delivery by product ID
   */
  static async getDeliveryByProductId(productId, sellerId = null) {
    try {
      const whereClause = { product_id: productId };
      
      if (sellerId) {
        whereClause.seller_id = sellerId;
      }

      const delivery = await ProductDelivery.findOne({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'currency', 'status']
          }
        ]
      });

      if (!delivery) {
        throw new Error('Delivery details not found for this product');
      }

      return {
        success: true,
        delivery: this.serializeDelivery(delivery)
      };
    } catch (error) {
      console.error('Error getting delivery by product ID:', error);
      throw new Error(`Failed to retrieve delivery: ${error.message}`);
    }
  }

  /**
   * Get deliveries by seller
   */
  static async getDeliveriesBySeller(sellerId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        delivery_status,
        search
      } = options;

      const whereClause = { seller_id: sellerId };

      // Filter by delivery status
      if (delivery_status && Object.values(DeliveryStatus).includes(delivery_status)) {
        whereClause.delivery_status = delivery_status;
      }

      // Search in pickup location and notes
      if (search) {
        whereClause[Op.or] = [
          { pickup_location: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await ProductDelivery.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'price', 'currency']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      return {
        success: true,
        deliveries: rows.map(delivery => this.serializeDelivery(delivery)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting deliveries by seller:', error);
      throw new Error(`Failed to retrieve deliveries: ${error.message}`);
    }
  }

  /**
   * Update delivery details
   */
  static async updateDelivery(deliveryId, sellerId, updateData) {
    try {
      const delivery = await ProductDelivery.findOne({
        where: { id: deliveryId, seller_id: sellerId }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      // Prepare update data
      const allowedFields = [
        'pickup_location', 'estimated_delivery_days', 
        'buyer_location', 'notes', 'actual_delivery_date', 
        'delivery_status'
      ];
      
      const updateFields = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'estimated_delivery_days') {
            updateFields[field] = parseInt(updateData[field]);
          } else if (field === 'pickup_location' || field === 'buyer_location' || field === 'notes') {
            updateFields[field] = updateData[field].trim();
          } else {
            updateFields[field] = updateData[field];
          }
        }
      });

      await delivery.update(updateFields);

      return {
        success: true,
        delivery: this.serializeDelivery(delivery),
        message: 'Delivery details updated successfully'
      };
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw new Error(`Failed to update delivery: ${error.message}`);
    }
  }

  /**
   * Update delivery status
   */
  static async updateDeliveryStatus(deliveryId, sellerId, delivery_status) {
    try {
      if (!Object.values(DeliveryStatus).includes(delivery_status)) {
        throw new Error('Invalid delivery status');
      }

      const delivery = await ProductDelivery.findOne({
        where: { id: deliveryId, seller_id: sellerId }
      });

      if (!delivery) {
        throw new Error('Delivery not found or access denied');
      }

      await delivery.update({ delivery_status });

      return {
        success: true,
        delivery: this.serializeDelivery(delivery),
        message: `Delivery status updated to ${delivery_status}`
      };
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  }

  /**
   * Serialize delivery data for response
   */
  static serializeDelivery(delivery) {
    const serialized = delivery.toJSON ? delivery.toJSON() : delivery;
    
    return {
      id: serialized.id,
      product_id: serialized.product_id,
      seller_id: serialized.seller_id,
      pickup_location: serialized.pickup_location,
      estimated_delivery_days: parseInt(serialized.estimated_delivery_days),
      buyer_location: serialized.buyer_location,
      actual_delivery_date: serialized.actual_delivery_date,
      delivery_status: serialized.delivery_status,
      notes: serialized.notes,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      product: serialized.product, // Include product info if populated
      seller: serialized.seller // Include seller info if populated
    };
  }

  /**
   * Check if product has delivery details
   */
  static async hasDeliveryDetails(productId) {
    try {
      const delivery = await ProductDelivery.findOne({
        where: { product_id: productId }
      });
      return !!delivery;
    } catch (error) {
      console.error('Error checking delivery details:', error);
      throw new Error(`Failed to check delivery details: ${error.message}`);
    }
  }
}

export default ProductDeliveryService;