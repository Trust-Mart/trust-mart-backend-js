import { DeliveryStatus } from '../../utils/types.js';

class ProductDeliveryValidationService {
  static validateDeliveryData(deliveryData) {
    const errors = [];
    const { product_id, seller_id, pickup_location, estimated_delivery_days, buyer_location } = deliveryData;

    // Product ID validation
    if (!product_id) {
      errors.push({ field: 'product_id', message: 'Product ID is required' });
    }

    // Seller ID validation
    if (!seller_id) {
      errors.push({ field: 'seller_id', message: 'Seller ID is required' });
    }

    // Pickup location validation
    if (!pickup_location || pickup_location.trim().length === 0) {
      errors.push({ field: 'pickup_location', message: 'Pickup location is required' });
    } else if (pickup_location.trim().length > 255) {
      errors.push({ field: 'pickup_location', message: 'Pickup location must not exceed 255 characters' });
    }

    // Estimated delivery days validation
    if (!estimated_delivery_days && estimated_delivery_days !== 0) {
      errors.push({ field: 'estimated_delivery_days', message: 'Estimated delivery days is required' });
    } else if (isNaN(estimated_delivery_days) || parseInt(estimated_delivery_days) < 1) {
      errors.push({ field: 'estimated_delivery_days', message: 'Estimated delivery days must be at least 1 day' });
    } else if (parseInt(estimated_delivery_days) > 365) {
      errors.push({ field: 'estimated_delivery_days', message: 'Estimated delivery days must not exceed 365 days' });
    }

    // Buyer location validation
    if (buyer_location && buyer_location.length > 255) {
      errors.push({ field: 'buyer_location', message: 'Buyer location must not exceed 255 characters' });
    }

    // Notes validation
    if (deliveryData.notes && deliveryData.notes.length > 1000) {
      errors.push({ field: 'notes', message: 'Notes must not exceed 1000 characters' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: {
        ...deliveryData,
        pickup_location: pickup_location?.trim(),
        buyer_location: buyer_location?.trim(),
        estimated_delivery_days: estimated_delivery_days ? parseInt(estimated_delivery_days) : undefined,
        notes: deliveryData.notes?.trim()
      }
    };
  }

  static validateDeliveryUpdateData(updateData) {
    const errors = [];
    const { pickup_location, estimated_delivery_days, buyer_location, notes, actual_delivery_date, delivery_status } = updateData;

    // Pickup location validation
    if (pickup_location !== undefined) {
      if (pickup_location.trim().length === 0) {
        errors.push({ field: 'pickup_location', message: 'Pickup location cannot be empty' });
      } else if (pickup_location.trim().length > 255) {
        errors.push({ field: 'pickup_location', message: 'Pickup location must not exceed 255 characters' });
      }
    }

    // Estimated delivery days validation
    if (estimated_delivery_days !== undefined) {
      if (isNaN(estimated_delivery_days) || parseInt(estimated_delivery_days) < 1) {
        errors.push({ field: 'estimated_delivery_days', message: 'Estimated delivery days must be at least 1 day' });
      } else if (parseInt(estimated_delivery_days) > 365) {
        errors.push({ field: 'estimated_delivery_days', message: 'Estimated delivery days must not exceed 365 days' });
      }
    }

    // Buyer location validation
    if (buyer_location !== undefined && buyer_location.length > 255) {
      errors.push({ field: 'buyer_location', message: 'Buyer location must not exceed 255 characters' });
    }

    // Notes validation
    if (notes !== undefined && notes.length > 1000) {
      errors.push({ field: 'notes', message: 'Notes must not exceed 1000 characters' });
    }

    // Delivery status validation
    if (delivery_status !== undefined && !Object.values(DeliveryStatus).includes(delivery_status)) {
      errors.push({ field: 'delivery_status', message: 'Invalid delivery status' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: updateData
    };
  }
}

export default ProductDeliveryValidationService;