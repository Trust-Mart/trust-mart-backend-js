import ProductService from '../services/ProductService.js';
import ProductValidationService from '../services/validation/ProductValidationService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ProductStatus } from '../utils/types.js';

export const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      image_cid, 
      price, 
      quantity, 
      currency = 'USD' 
    } = req.body;

    const seller_id = req.user.id;

    const validation = ProductValidationService.validateProductData({
      name,
      description,
      image_cid,
      price,
      quantity,
      currency,
      seller_id
    });

    if (!validation.isValid) {
      return ApiResponse.validationError(res, validation.errors);
    }

    const { validatedData } = validation;
    validatedData.status = ProductStatus.under_review;

    const result = await ProductService.createProduct(validatedData);

    return ApiResponse.success(res, {
      message: 'Product created successfully',
      product: result.product
    }, 201);

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.message.includes('Validation error') || 
        error.message.includes('Seller not found') ||
        error.message.includes('already exists')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to create product. Please try again.');
  }
};

export const getProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { includeSeller = 'false' } = req.query;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    const result = await ProductService.getProductById(
      productId, 
      includeSeller === 'true'
    );

    return ApiResponse.success(res, {
      product: result.product
    });

  } catch (error) {
    console.error('Get product error:', error);
    
    if (error.message.includes('Product not found')) {
      return ApiResponse.notFound(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to retrieve product. Please try again.');
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      status, 
      search 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search
    };

    const result = await ProductService.getProductsBySeller(sellerId, options);

    return ApiResponse.success(res, {
      products: result.products,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get seller products error:', error);
    return ApiResponse.serverError(res, 'Failed to retrieve products. Please try again.');
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      minPrice, 
      maxPrice, 
      currency, 
      search,
      sellerId 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      currency,
      search,
      sellerId
    };

    const result = await ProductService.getAllProducts(options);

    return ApiResponse.success(res, {
      products: result.products,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get all products error:', error);
    return ApiResponse.serverError(res, 'Failed to retrieve products. Please try again.');
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;
    const updateData = req.body;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    const validation = ProductValidationService.validateProductUpdateData(updateData);
    if (!validation.isValid) {
      return ApiResponse.validationError(res, validation.errors);
    }

    const result = await ProductService.updateProduct(productId, sellerId, updateData);

    return ApiResponse.success(res, {
      message: result.message,
      product: result.product
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('access denied') ||
        error.message.includes('Validation error')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to update product. Please try again.');
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;
    const { status } = req.body;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    if (!status) {
      return ApiResponse.badRequest(res, 'Status is required');
    }

    const result = await ProductService.updateProductStatus(productId, sellerId, status);

    return ApiResponse.success(res, {
      message: result.message,
      product: result.product
    });

  } catch (error) {
    console.error('Update product status error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('access denied') ||
        error.message.includes('Invalid product status')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to update product status. Please try again.');
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    const result = await ProductService.deleteProduct(productId, sellerId);

    return ApiResponse.success(res, {
      message: result.message
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('access denied')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to delete product. Please try again.');
  }
};

export const updateProductQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;
    const { quantity } = req.body;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    if (!quantity && quantity !== 0) {
      return ApiResponse.badRequest(res, 'Quantity is required');
    }

    const result = await ProductService.updateProductQuantity(productId, sellerId, quantity);

    return ApiResponse.success(res, {
      message: result.message,
      product: result.product
    });

  } catch (error) {
    console.error('Update product quantity error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('access denied') ||
        error.message.includes('Quantity must be')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to update product quantity. Please try again.');
  }
};

export const getSellerProductStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const result = await ProductService.getSellerProductStats(sellerId);

    return ApiResponse.success(res, {
      stats: result.stats
    });

  } catch (error) {
    console.error('Get seller product stats error:', error);
    return ApiResponse.serverError(res, 'Failed to retrieve product statistics. Please try again.');
  }
};

// Admin-only endpoints
export const updateAIVerificationScore = async (req, res) => {
  try {
    const { productId } = req.params;
    const { score } = req.body;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    if (!score && score !== 0) {
      return ApiResponse.badRequest(res, 'AI verification score is required');
    }

    const result = await ProductService.updateAIVerificationScore(productId, score);

    return ApiResponse.success(res, {
      message: result.message,
      product: result.product
    });

  } catch (error) {
    console.error('Update AI verification score error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('AI verification score must be')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to update AI verification score. Please try again.');
  }
};

export const getProductsForVerification = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await ProductService.getProductsForVerification(parseInt(limit));

    return ApiResponse.success(res, {
      products: result.products
    });

  } catch (error) {
    console.error('Get products for verification error:', error);
    return ApiResponse.serverError(res, 'Failed to retrieve products for verification. Please try again.');
  }
};