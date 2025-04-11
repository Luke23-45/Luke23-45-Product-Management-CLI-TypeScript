// services/orderService.ts

import { readJSONFile, writeJSONFile } from "../utils/fileUtils";
import { validateOrderData } from "../utils/validate/orderValidation";

const ORDERS_FILE: string = "../data/orders.json";

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  total: number;
  status?: string; // e.g., "Pending", "Done"
}

export interface OrderData {
  userId: string;
  items: OrderItem[];
  total?: number;
  timestamp: number;
}

export interface Orders {
  [userId: string]: OrderData;
}

export class OrderService {
  private orderIndex: Record<string, number> | null = null;

  public async initializeOrders(): Promise<void> {
    try {
      const ordersArray = (await readJSONFile(ORDERS_FILE, "o")) as Orders[];
      const order = ordersArray[0] || {};
      console.log("this is order", Object.keys(order), order);
      this.orderIndex = {};
      Object.keys(order).forEach((user, index) => {
        this.orderIndex![user] = index;
      });
      console.log(this.orderIndex);
    } catch (error: any) {
      console.error("Error initializing orders:", error.message);
      this.orderIndex = {};
    }
  }

  public async getOrders(userId: string, isAdmin: boolean, targetUser?: string): Promise<Orders[] | OrderData | undefined> {
    try {
      if (!this.orderIndex) {
        await this.initializeOrders();
      }
      const userIdToUse = isAdmin && targetUser ? targetUser : userId;
      const index = this.orderIndex?.[userIdToUse];
      if (index === undefined && !isAdmin) {
        throw new Error("User has not placed any orders yet!");
      }
      const orders = (await readJSONFile(ORDERS_FILE, "o")) as Orders[];
      if (isAdmin) {
        if (!targetUser) {
          return orders;
        } else {
          return orders[0][`${targetUser}`];
        }
      } else {
        return orders[0][`${userIdToUse}`];
      }
    } catch (error: any) {
      console.error("Error getting orders:", error.message);
      throw error;
    }
  }

  private calculateItemsTotal(data: OrderData): number {
    let itemsTotal = 0;
    if (data && data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item && typeof item.total === "number") {
          itemsTotal += item.total;
        }
      }
    }
    return itemsTotal;
  }

  private mergeUniqueByProductId(arr1: OrderItem[], arr2: OrderItem[]): OrderItem[] {
    const mergedArray = [...arr1];
    const productIdsInArr1 = new Set(arr1.map((item) => item.productId));
    for (const item2 of arr2) {
      if (!productIdsInArr1.has(item2.productId)) {
        mergedArray.push(item2);
        productIdsInArr1.add(item2.productId);
      }
    }
    return mergedArray;
  }

  public async createOrder(orderData: OrderData): Promise<OrderData> {
    try {
      if (!this.orderIndex) {
        await this.initializeOrders();
      }
      const validationErrors = validateOrderData(orderData);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid order data: ${validationErrors.join(", ")}`);
      }
      const userId = orderData.userId;
      const index = this.orderIndex![userId];
      

      const { ...orderContent } = orderData;
      
      let orders = (await readJSONFile(ORDERS_FILE, "o")) as Orders[];
      if (index === undefined) {
        // When there is no previous order for the user, create a new order
        orders[0][`${userId}`] = orderContent;
        const total = this.calculateItemsTotal(orders[0][userId]);
        orders[0][userId].total = total;
        await writeJSONFile(ORDERS_FILE, orders);
        return orders[0][userId];
      } else {
        // When the user already has an order, merge new items with existing ones using uniqueness by productId.
        const existingItems = orders[0][userId].items;
        if (existingItems !== undefined) {
          const newItems = orderContent.items;
          orders[0][userId].items = this.mergeUniqueByProductId(newItems, existingItems);
          const total = this.calculateItemsTotal(orders[0][userId]);
          orders[0][userId].total = total;
          await writeJSONFile(ORDERS_FILE, orders);
          return orders[0][userId];
        }
      }
      // throw an error or return a default value if no condition applies.
      throw new Error("Order could not be created due to unexpected conditions.");
    } catch (err: any) {
      throw new Error(`Could not create the order: ${err.message}`);
    }
  }
  
  public async updateOrder(orderData: { userId: string; isAdmin: boolean; items: string[]; status: string }, targetUser?: string): Promise<OrderData | undefined> {
    const { isAdmin, userId } = orderData;
    const userToUpdate = isAdmin && targetUser ? targetUser : userId;
    try {
      if (!this.orderIndex) {
        await this.initializeOrders();
      }
      const orders = (await readJSONFile(ORDERS_FILE, "o")) as Orders[];
      const userOrder = orders[0]?.[userToUpdate];
      if (!userOrder) {
        throw new Error(`Order not found for user ID: ${userToUpdate}`);
      }
      if (Array.isArray(orderData.items) && Array.isArray(userOrder.items)) {
        for (let i = 0; i < userOrder.items.length; i++) {
          if (orderData.items.includes(userOrder.items[i].productId)) {
            userOrder.items[i].status = orderData.status;
          }
        }
      }
      await writeJSONFile(ORDERS_FILE, orders);
      return orders[0][`${userToUpdate}`];
    } catch (error: any) {
      console.error("Error updating order:", error.message);
      throw error;
    }
  }

  public async deleteOrder(optionData: { userId: string; isAdmin: boolean; producttotal_id: string[] }, targetUser?: string): Promise<void> {
    try {
      if (!this.orderIndex) {
        await this.initializeOrders();
      }
      const { userId, isAdmin, producttotal_id } = optionData;
      const userToDeleteFrom = isAdmin && targetUser ? targetUser : userId;
      const orders = (await readJSONFile(ORDERS_FILE, "o")) as Orders[];
      const userOrders = orders[0]?.[userToDeleteFrom];
      if (!userOrders) {
        throw new Error(`Order not found for user ID: ${userToDeleteFrom}`);
      }
      let newItems: OrderItem[] = [];
      let removedProductIds: string[] = [];
      let attemptedToRemoveDone: string[] = [];
      if (Array.isArray(userOrders.items)) {
        for (const item of userOrders.items) {
          if (!producttotal_id.includes(item.productId)) {
            newItems.push(item);
          } else {
            if (item.status === "Done") {
              console.log(`Product with ${item.productId} has Done status and cannot be removed.`);
              attemptedToRemoveDone.push(item.productId);
              newItems.push(item); // Keep 'Done' items
            } else {
              removedProductIds.push(item.productId);
            }
          }
        }
        orders[0][userToDeleteFrom].items = newItems;
      }
      if (removedProductIds.length === 0 && producttotal_id.length > 0 && attemptedToRemoveDone.length === 0) {
        console.log("No matching product IDs found in your order for removal.");
      } else if (removedProductIds.length > 0) {
        console.log(`Removed items with Product IDs: ${removedProductIds.join(', ')} from order for user ${userToDeleteFrom}`);
      } else if (attemptedToRemoveDone.length > 0 && removedProductIds.length === 0 && producttotal_id.length === attemptedToRemoveDone.length) {
        console.log("No items were removed as the provided product IDs have 'Done' status.");
      } else if (removedProductIds.length === 0 && attemptedToRemoveDone.length > 0 && producttotal_id.length > attemptedToRemoveDone.length) {
        console.log("Some items were not removed as they have 'Done' status. No other removable items found for the provided IDs.");
      } else if (removedProductIds.length === 0 && producttotal_id.length > 0 && attemptedToRemoveDone.length === 0) {
        console.log("No matching product IDs found for removal.");
      }
      await writeJSONFile(ORDERS_FILE, orders);
      console.log("Order updated after deletion attempt.");
    } catch (error: any) {
      console.error("Error deleting order:", error.message);
      throw error;
    }
  }

  // public getLimitedInformation(): void {
  //   // Implementation for getLimitedInformation if needed
  // }

  public async listOrdersForUser(userId: string, isAdmin: boolean, targetUser?: string): Promise<OrderData | undefined> {
    try {
      if (!this.orderIndex) {
        await this.initializeOrders();
      }
      const userToListFrom = isAdmin && targetUser ? targetUser : userId;
      const orders = (await readJSONFile(ORDERS_FILE, "o")) as Orders[];
      return orders[0]?.[userToListFrom];
    } catch (error: any) {
      console.error("Error listing orders:", error.message);
      throw error;
    }
  }
}
