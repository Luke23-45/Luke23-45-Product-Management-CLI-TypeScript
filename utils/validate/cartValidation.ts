// utils/validate/cartValidation.ts

interface CartData {
  productId?: string;
  userId?: string;
  quantity?: number;
}

export const validateCartData = (cartData: CartData): string[] => {
  const errors: string[] = [];

  if (!cartData) {
    errors.push('Cart data is required.');
    return errors;
  }
  if (!cartData.productId) {
    errors.push('Product ID is required.');
  } else if (typeof cartData.productId !== 'string') {
    errors.push('Product ID must be a string.');
  }

  if (!cartData.userId) {
    errors.push("user is required!");
  } else if (typeof cartData.userId !== 'string') {
    errors.push('userId must be a string.');
  }

  if (cartData.quantity === undefined) {
    errors.push('Quantity is required.');
  } else if (typeof cartData.quantity !== 'number') {
    errors.push('Quantity must be a number.');
  } else if (cartData.quantity <= 0) {
    errors.push('Quantity must be greater than zero.');
  }

  return errors;
};