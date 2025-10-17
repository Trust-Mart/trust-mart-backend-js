class ProductValidationService {
  static validateProductData(productData) {
    const errors = [];
    const { name, description, price, quantity, seller_id, currency } = productData;

    // Name validation
    if (!name || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Product name is required' });
    } else if (name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Product name must be at least 2 characters long' });
    } else if (name.trim().length > 255) {
      errors.push({ field: 'name', message: 'Product name must not exceed 255 characters' });
    }

    // Description validation
    if (description && description.length > 1000) {
      errors.push({ field: 'description', message: 'Description must not exceed 1000 characters' });
    }

    // Price validation
    if (!price && price !== 0) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (isNaN(price) || parseFloat(price) < 0) {
      errors.push({ field: 'price', message: 'Price must be a non-negative number' });
    } else if (parseFloat(price) > 1000000) {
      errors.push({ field: 'price', message: 'Price must not exceed 1,000,000' });
    }

    // Quantity validation
    if (!quantity && quantity !== 0) {
      errors.push({ field: 'quantity', message: 'Quantity is required' });
    } else if (isNaN(quantity) || parseInt(quantity) < 0) {
      errors.push({ field: 'quantity', message: 'Quantity must be a non-negative integer' });
    } else if (parseInt(quantity) > 100000) {
      errors.push({ field: 'quantity', message: 'Quantity must not exceed 100,000' });
    }

    // Currency validation
    const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS'];
    if (currency && !validCurrencies.includes(currency.toUpperCase())) {
      errors.push({ field: 'currency', message: `Currency must be one of: ${validCurrencies.join(', ')}` });
    }

    // Seller ID validation
    if (!seller_id) {
      errors.push({ field: 'seller_id', message: 'Seller ID is required' });
    }

    // Image CID validation
    if (productData.image_cid) {
      if (!Array.isArray(productData.image_cid)) {
        errors.push({ field: 'image_cid', message: 'Image CID must be an array' });
      } else if (productData.image_cid.length > 10) {
        errors.push({ field: 'image_cid', message: 'Cannot upload more than 10 images' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: {
        ...productData,
        name: name?.trim(),
        description: description?.trim(),
        price: price ? parseFloat(price) : undefined,
        quantity: quantity ? parseInt(quantity) : undefined,
        currency: currency ? currency.toUpperCase() : 'USD'
      }
    };
  }

  static validateProductUpdateData(updateData) {
    const errors = [];
    const { name, description, price, quantity, currency, image_cid } = updateData;

    // Name validation
    if (name !== undefined) {
      if (name.trim().length === 0) {
        errors.push({ field: 'name', message: 'Product name cannot be empty' });
      } else if (name.trim().length < 2) {
        errors.push({ field: 'name', message: 'Product name must be at least 2 characters long' });
      } else if (name.trim().length > 255) {
        errors.push({ field: 'name', message: 'Product name must not exceed 255 characters' });
      }
    }

    // Description validation
    if (description !== undefined && description.length > 1000) {
      errors.push({ field: 'description', message: 'Description must not exceed 1000 characters' });
    }

    // Price validation
    if (price !== undefined) {
      if (isNaN(price) || parseFloat(price) < 0) {
        errors.push({ field: 'price', message: 'Price must be a non-negative number' });
      } else if (parseFloat(price) > 1000000) {
        errors.push({ field: 'price', message: 'Price must not exceed 1,000,000' });
      }
    }

    // Quantity validation
    if (quantity !== undefined) {
      if (isNaN(quantity) || parseInt(quantity) < 0) {
        errors.push({ field: 'quantity', message: 'Quantity must be a non-negative integer' });
      } else if (parseInt(quantity) > 100000) {
        errors.push({ field: 'quantity', message: 'Quantity must not exceed 100,000' });
      }
    }

    // Currency validation
    const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS'];
    if (currency && !validCurrencies.includes(currency.toUpperCase())) {
      errors.push({ field: 'currency', message: `Currency must be one of: ${validCurrencies.join(', ')}` });
    }

    // Image CID validation
    if (image_cid !== undefined) {
      if (!Array.isArray(image_cid)) {
        errors.push({ field: 'image_cid', message: 'Image CID must be an array' });
      } else if (image_cid.length > 10) {
        errors.push({ field: 'image_cid', message: 'Cannot upload more than 10 images' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData: updateData
    };
  }
}

export default ProductValidationService;