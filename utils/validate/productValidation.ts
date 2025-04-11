// utils/validate/productValidation.ts

interface ProductData {
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  inventory?: number;
}

export const validateProductData = (productData: ProductData): string[] => {
  const errors: string[] = [];

  if (!productData) {
    errors.push('Product data is required.');
    return errors;
  }

  if (!productData.name) {
    errors.push('Name is required.');
  } else if (typeof productData.name !== 'string') {
    errors.push('Name must be a string.');
  }

  if (productData.price === undefined) {
    errors.push('Price is required.');
  } else if (typeof productData.price !== 'number') {
    errors.push('Price must be a number.');
  } else if (productData.price <= 0) {
    errors.push('Price must be greater than zero.');
  }

  if (productData.description && typeof productData.description !== 'string') {
    errors.push('Description must be a string.');
  }

  if (productData.category && typeof productData.category !== 'string') {
    errors.push('Category must be a string.');
  }

  if (productData.inventory === undefined) {
    errors.push('Inventory is required.');
  } else if (typeof productData.inventory !== 'number') {
    errors.push('Inventory must be a number.');
  } else if (productData.inventory < 0) {
    errors.push('Inventory cannot be negative.');
  }

  return errors;
};