// utils/validate/orderValidation.ts

interface OrderItem {
  productId: string;
  quantity: number;
}

interface OrderData {
  userId?: string;
  items?: OrderItem[];
  total?: number;
  timestamp?: number;
}

export const validateOrderData = (orderData: OrderData | null): string[] => {
  const errors: string[] = [];
  if (orderData === null) {
    console.log("this is bad");
    errors.push('Order data is required.');
    return errors;
  }

  if (!orderData.userId) {
    errors.push('User ID is required.');
  } else if (typeof orderData.userId !== 'string') {
    errors.push('User ID must be a string.');
  }

  if (!orderData.items) {
    errors.push('Items are required.');
  } else if (!Array.isArray(orderData.items)) {
    errors.push('Items must be an array.');
  } else if (orderData.items.length === 0) {
    errors.push('Items array cannot be empty.');
  } 

  if (orderData.total === undefined) {
    errors.push('Total is required.');
  } else if (typeof orderData.total !== 'number') {
    errors.push('Total must be a number.');
  } else if (orderData.total < 0) {
    errors.push('Total must be greater than zero.');
  }

  if (orderData.timestamp === undefined) {
    errors.push('Timestamp is required.');
  } else if (typeof orderData.timestamp !== 'number') {
    errors.push('Timestamp must be a number.');
  }

  return errors;
};