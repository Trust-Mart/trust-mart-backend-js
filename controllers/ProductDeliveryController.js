import ProductDeliveryService from '../services/ProductDeliveryService.js';
import ProductDeliveryValidationService from '../services/validation/ProductDeliveryValidationService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const createDelivery = async (req, res) => {
  try {
    const { 
      product_id, 
      pickup_location, 
      estimated_delivery_days, 
      buyer_location, 
      notes 
    } = req.body;

    const seller_id = req.user.id;

    const validation = ProductDeliveryValidationService.validateDeliveryData({
      product_id,
      seller_id,
      pickup_location,
      estimated_delivery_days,
      buyer_location,
      notes
    });

    if (!validation.isValid) {
      return ApiResponse.validationError(res, validation.errors);
    }

    const { validatedData } = validation;

    const result = await ProductDeliveryService.createDelivery(validatedData);

    return ApiResponse.success(res, {
      message: result.message,
      delivery: result.delivery,
      product: result.product
    }, 201);

  } catch (error) {
    console.error('Create delivery error:', error);
    
    if (error.message.includes('Product not found') || 
        error.message.includes('Delivery details already exist') ||
        error.message.includes('Delivery validation failed')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to create delivery details. Please try again.');
  }
};

export const getDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { includeAssociations = 'false' } = req.query;

    if (!deliveryId) {
      return ApiResponse.badRequest(res, 'Delivery ID is required');
    }

    const result = await ProductDeliveryService.getDeliveryById(
      deliveryId, 
      includeAssociations === 'true'
    );

    return ApiResponse.success(res, {
      delivery: result.delivery
    });

  } catch (error) {
    console.error('Get delivery error:', error);
    
    if (error.message.includes('Delivery not found')) {
      return ApiResponse.notFound(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to retrieve delivery. Please try again.');
  }
};

export const getDeliveryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user.id;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    const result = await ProductDeliveryService.getDeliveryByProductId(productId, sellerId);

    return ApiResponse.success(res, {
      delivery: result.delivery
    });

  } catch (error) {
    console.error('Get delivery by product error:', error);
    
    if (error.message.includes('Delivery details not found')) {
      return ApiResponse.notFound(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to retrieve delivery details. Please try again.');
  }
};

export const getSellerDeliveries = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      delivery_status, 
      search 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      delivery_status,
      search
    };

    const result = await ProductDeliveryService.getDeliveriesBySeller(sellerId, options);

    return ApiResponse.success(res, {
      deliveries: result.deliveries,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get seller deliveries error:', error);
    return ApiResponse.serverError(res, 'Failed to retrieve deliveries. Please try again.');
  }
};

export const updateDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const sellerId = req.user.id;
    const updateData = req.body;

    if (!deliveryId) {
      return ApiResponse.badRequest(res, 'Delivery ID is required');
    }

    const validation = ProductDeliveryValidationService.validateDeliveryUpdateData(updateData);
    if (!validation.isValid) {
      return ApiResponse.validationError(res, validation.errors);
    }

    const result = await ProductDeliveryService.updateDelivery(deliveryId, sellerId, updateData);

    return ApiResponse.success(res, {
      message: result.message,
      delivery: result.delivery
    });

  } catch (error) {
    console.error('Update delivery error:', error);
    
    if (error.message.includes('Delivery not found') || 
        error.message.includes('access denied') ||
        error.message.includes('Validation error')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to update delivery. Please try again.');
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const sellerId = req.user.id;
    const { delivery_status } = req.body;

    if (!deliveryId) {
      return ApiResponse.badRequest(res, 'Delivery ID is required');
    }

    if (!delivery_status) {
      return ApiResponse.badRequest(res, 'Delivery status is required');
    }

    const result = await ProductDeliveryService.updateDeliveryStatus(deliveryId, sellerId, delivery_status);

    return ApiResponse.success(res, {
      message: result.message,
      delivery: result.delivery
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    
    if (error.message.includes('Delivery not found') || 
        error.message.includes('access denied') ||
        error.message.includes('Invalid delivery status')) {
      return ApiResponse.badRequest(res, error.message);
    }
    
    return ApiResponse.serverError(res, 'Failed to update delivery status. Please try again.');
  }
};

export const checkDeliveryExists = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return ApiResponse.badRequest(res, 'Product ID is required');
    }

    const hasDelivery = await ProductDeliveryService.hasDeliveryDetails(productId);

    return ApiResponse.success(res, {
      hasDelivery,
      message: hasDelivery ? 'Delivery details exist for this product' : 'No delivery details found for this product'
    });

  } catch (error) {
    console.error('Check delivery exists error:', error);
    return ApiResponse.serverError(res, 'Failed to check delivery details. Please try again.');
  }
};