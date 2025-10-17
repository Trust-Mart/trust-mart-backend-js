import { Op } from 'sequelize';
import db from '../models/index.js';
import { ProductStatus } from '../utils/types.js';

const { Product, User } = db;

class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(productData) {
    try {
      const {
        seller_id,
        name,
        description,
        image_cid,
        price,
        quantity,
        currency = 'USD',
        status = ProductStatus.under_review
      } = productData;

      // Verify seller exists
      const seller = await User.findByPk(seller_id);
      if (!seller) {
        throw new Error('Seller not found');
      }

      // Create product
      const product = await Product.create({
        seller_id,
        name: name.trim(),
        descrption: description?.trim() || '',
        image_cid: image_cid || [],
        price: parseFloat(price),
        quantity: parseInt(quantity),
        currency: currency.toUpperCase(),
        status,
        ai_verification_score: null // Will be set by AI verification service
      });

      return {
        success: true,
        product: this.serializeProduct(product)
      };
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        throw new Error(`Product validation failed: ${JSON.stringify(validationErrors)}`);
      }
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Product with similar details already exists');
      }
      
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId, includeSeller = false) {
    try {
      const options = {
        where: { id: productId }
      };

      if (includeSeller) {
        options.include = [{
          model: User,
          as: 'seller',
          attributes: ['id', 'username', 'email']
        }];
      }

      const product = await Product.findOne(options);

      if (!product) {
        throw new Error('Product not found');
      }

      return {
        success: true,
        product: this.serializeProduct(product)
      };
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw new Error(`Failed to retrieve product: ${error.message}`);
    }
  }

  /**
   * Get products by seller
   */
  static async getProductsBySeller(sellerId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search
      } = options;

      const whereClause = { seller_id: sellerId };

      // Filter by status if provided
      if (status && Object.values(ProductStatus).includes(status)) {
        whereClause.status = status;
      }

      // Search in product name and description
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { descrption: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'seller',
          attributes: ['id', 'username']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      return {
        success: true,
        products: rows.map(product => this.serializeProduct(product)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting products by seller:', error);
      throw new Error(`Failed to retrieve seller products: ${error.message}`);
    }
  }

  /**
   * Get all products with filtering and pagination
   */
  static async getAllProducts(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = ProductStatus.active, // Default to active products
        minPrice,
        maxPrice,
        currency,
        search,
        sellerId
      } = options;

      const whereClause = {};

      // Status filter
      if (status) {
        whereClause.status = status;
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        whereClause.price = {};
        if (minPrice !== undefined) {
          whereClause.price[Op.gte] = parseFloat(minPrice);
        }
        if (maxPrice !== undefined) {
          whereClause.price[Op.lte] = parseFloat(maxPrice);
        }
      }

      // Currency filter
      if (currency) {
        whereClause.currency = currency.toUpperCase();
      }

      // Seller filter
      if (sellerId) {
        whereClause.seller_id = sellerId;
      }

      // Search filter
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { descrption: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'seller',
          attributes: ['id', 'username', 'email']
        }],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      return {
        success: true,
        products: rows.map(product => this.serializeProduct(product)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all products:', error);
      throw new Error(`Failed to retrieve products: ${error.message}`);
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId, sellerId, updateData) {
    try {
      const product = await Product.findOne({
        where: { id: productId, seller_id: sellerId }
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      // Prepare update data
      const allowedFields = [
        'name', 'description', 'image_cid', 'price', 
        'quantity', 'currency', 'status'
      ];
      
      const updateFields = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'description') {
            updateFields.descrption = updateData[field].trim();
          } else if (field === 'price') {
            updateFields.price = parseFloat(updateData[field]);
          } else if (field === 'quantity') {
            updateFields.quantity = parseInt(updateData[field]);
          } else if (field === 'currency') {
            updateFields.currency = updateData[field].toUpperCase();
          } else {
            updateFields[field] = updateData[field];
          }
        }
      });

      await product.update(updateFields);

      return {
        success: true,
        product: this.serializeProduct(product),
        message: 'Product updated successfully'
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  /**
   * Update product status
   */
  static async updateProductStatus(productId, sellerId, status) {
    try {
      if (!Object.values(ProductStatus).includes(status)) {
        throw new Error('Invalid product status');
      }

      const product = await Product.findOne({
        where: { id: productId, seller_id: sellerId }
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      if (product.status === ProductStatus.flagged) {
        throw new Error(`Product with status ${product.status} can not be updated. Contact Admin for more information`)
      }

      await product.update({ status });

      return {
        success: true,
        product: this.serializeProduct(product),
        message: `Product status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating product status:', error);
      throw new Error(`Failed to update product status: ${error.message}`);
    }
  }

  /**
   * Delete product (soft delete by changing status)
   */
  static async deleteProduct(productId, sellerId) {
    try {
      const product = await Product.findOne({
        where: { id: productId, seller_id: sellerId }
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      // Instead of hard delete, mark as inactive
      await product.update({ status: ProductStatus.paused });

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Update product quantity (for inventory management)
   */
  static async updateProductQuantity(productId, sellerId, newQuantity) {
    try {
      const quantity = parseInt(newQuantity);
      
      if (isNaN(quantity) || quantity < 0) {
        throw new Error('Quantity must be a non-negative number');
      }

      const product = await Product.findOne({
        where: { id: productId, seller_id: sellerId }
      });

      if (!product) {
        throw new Error('Product not found or access denied');
      }

      // Update status based on quantity
      let status = product.status;
      if (quantity === 0 && status === ProductStatus.active) {
        status = ProductStatus.sold_out;
      } else if (quantity > 0 && status === ProductStatus.sold_out) {
        status = ProductStatus.active;
      }

      await product.update({ 
        quantity,
        status
      });

      return {
        success: true,
        product: this.serializeProduct(product),
        message: 'Product quantity updated successfully'
      };
    } catch (error) {
      console.error('Error updating product quantity:', error);
      throw new Error(`Failed to update product quantity: ${error.message}`);
    }
  }

  /**
   * Update AI verification score
   */
  static async updateAIVerificationScore(productId, score) {
    try {
      const aiScore = parseFloat(score);
      
      if (isNaN(aiScore) || aiScore < 0 || aiScore > 1) {
        throw new Error('AI verification score must be between 0 and 1');
      }

      const product = await Product.findByPk(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Update status based on AI score
      let status = product.status;
      if (aiScore >= 0.8 && product.status === ProductStatus.under_review) {
        status = ProductStatus.active;
      }

      await product.update({ 
        ai_verification_score: aiScore,
        status
      });

      return {
        success: true,
        product: this.serializeProduct(product),
        message: 'AI verification score updated successfully'
      };
    } catch (error) {
      console.error('Error updating AI verification score:', error);
      throw new Error(`Failed to update AI verification score: ${error.message}`);
    }
  }

  /**
   * Get products needing AI verification
   */
  static async getProductsForVerification(limit = 50) {
    try {
      const products = await Product.findAll({
        where: {
          status: ProductStatus.under_review,
          ai_verification_score: null
        },
        include: [{
          model: User,
          as: 'seller',
          attributes: ['id', 'username']
        }],
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit)
      });

      return {
        success: true,
        products: products.map(product => this.serializeProduct(product))
      };
    } catch (error) {
      console.error('Error getting products for verification:', error);
      throw new Error(`Failed to retrieve products for verification: ${error.message}`);
    }
  }

  /**
   * Validate product data
   */
//   static validateProductData(productData) {
//     const errors = [];
//     const { name, price, quantity, seller_id } = productData;

//     if (!name || name.trim().length < 2) {
//       errors.push('Product name must be at least 2 characters long');
//     }

//     if (!price || isNaN(price) || parseFloat(price) <= 0) {
//       errors.push('Price must be a positive number');
//     }

//     if (!quantity || isNaN(quantity) || parseInt(quantity) < 0) {
//       errors.push('Quantity must be a non-negative number');
//     }

//     if (!seller_id) {
//       errors.push('Seller ID is required');
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }

//   /**
//    * Validate product update data
//    */
//   static validateProductUpdateData(updateData) {
//     const errors = [];
//     const { price, quantity } = updateData;

//     if (price !== undefined && (isNaN(price) || parseFloat(price) <= 0)) {
//       errors.push('Price must be a positive number');
//     }

//     if (quantity !== undefined && (isNaN(quantity) || parseInt(quantity) < 0)) {
//       errors.push('Quantity must be a non-negative number');
//     }

//     return {
//       isValid: errors.length === 0,
//       errors
//     };
//   }

  /**
   * Serialize product data for response
   */
  static serializeProduct(product) {
    const serialized = product.toJSON ? product.toJSON() : product;
    
    return {
      id: serialized.id,
      seller_id: serialized.seller_id,
      name: serialized.name,
      description: serialized.descrption, // Note: Fixing the typo in response
      image_cid: serialized.image_cid || [],
      price: parseFloat(serialized.price),
      quantity: parseInt(serialized.quantity),
      currency: serialized.currency,
      status: serialized.status,
      ai_verification_score: serialized.ai_verification_score ? 
        parseFloat(serialized.ai_verification_score) : null,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      seller: serialized.seller // Include seller info if populated
    };
  }

  /**
   * Get product statistics for a seller
   */
  static async getSellerProductStats(sellerId) {
    try {
      const stats = await Product.findAll({
        where: { seller_id: sellerId },
        attributes: [
          'status',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'count'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'total_quantity'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('price')), 'total_value']
        ],
        group: ['status']
      });

      const totalProducts = await Product.count({
        where: { seller_id: sellerId }
      });

      return {
        success: true,
        stats: {
          totalProducts,
          byStatus: stats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: parseInt(stat.get('count')),
              total_quantity: parseInt(stat.get('total_quantity') || 0),
              total_value: parseFloat(stat.get('total_value') || 0)
            };
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Error getting seller product stats:', error);
      throw new Error(`Failed to retrieve seller statistics: ${error.message}`);
    }
  }
}

export default ProductService;