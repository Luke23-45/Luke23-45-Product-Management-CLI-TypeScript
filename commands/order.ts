// commands/order.ts

import { OrderService } from '../services/orderService';

import { AuthService } from '../services/authService.js';

import { generateId } from '../utils/sessionUtils';

import { CartService,CartItem } from '../services/cartService';

interface ParsedCommand {
  options: Record<string, any>;
  subcommand?: string;
  arguments: string[];
  user: {
    userId: string;
    username: string;
    isAdmin: boolean;
  } | null;
}
interface OrderData {
  items: CartItem[]; 
}
export const handleOrderCommand = async (parsedCommand: ParsedCommand): Promise<void> => {
  try {
    // Instantiate and initialize the OrderService class.
    const orderService = new OrderService();
    const cartService = new CartService();
    await orderService.initializeOrders();

    const { options, subcommand, arguments: args, user } = parsedCommand;
    const authService = new AuthService();
    switch (subcommand || args[0]) {
      case 'list': {
        if (!user || !(await authService.hasPermission('order:view'))) {
          console.error('Permission denied: You do not have permission to view orders.');
          return;
        }
        let targetUser_: string | undefined = undefined;
        if (options.targetUser) {
          try {
            await authService.getUserById(options.targetUser);
            targetUser_ = options.targetUser;
          } catch (error: any) {
            console.error(`Error fetching target user: ${error.message}`);
            return;
          }
        }
        const data = await orderService.getOrders(user.userId, user.isAdmin, targetUser_);
        console.log(data);
        break;
      }
      case 'create': {
        if (!user || !(await authService.hasPermission('order:create'))) {
          console.error('Permission denied: You do not have permission to create orders.');
          return;
        }
        let targetUser_: string | undefined = undefined;
        if (options.targetUser) {
          try {
            await authService.getUserById(options.targetUser);
            targetUser_ = options.targetUser;
          } catch (error: any) {
            console.error(`Error fetching target user: ${error.message}`);
            return;
          }
        }
        const cart_data = (await cartService.getCart(user.userId,user.isAdmin, targetUser_)) as CartItem[] | undefined;
        if (!cart_data || cart_data.length === 0) {
          throw new Error("Cart is empty!");
        }
        const itemsOption = options.items as string | undefined;
        if (!itemsOption) {
          console.error('Error: --items option is required for "create" command.');
          return;
        }
        const selected_items = itemsOption.split(",");
        const filtered_cart = cart_data.filter(item => selected_items.includes(item.productId));
        if (filtered_cart.length === 0) {
          throw new Error("Products have not been added to the cart yet or the provided product IDs are incorrect.");
        }
        const statusOption = options.status as string | undefined;
        if (!statusOption || (statusOption !== "Pending" && statusOption !== "Done")) {
          throw new Error('Please enter a valid status - Pending or Done');
        }
      
        for (let i = 0; i < filtered_cart.length; i++) {
          filtered_cart[i].status = statusOption;
        }
      
        const id = String(await generateId('o'));
        const userId = String(user.userId);
        const items = filtered_cart;
        const total = 0;
        const timestamp = Date.now();
        if (!userId || !items || !timestamp || !statusOption) {
          console.error('Error: userId, items, timestamp, and status are required for "create" command.');
          return;
        }
        const newOrder = await orderService.createOrder({
          userId,
          items,
          total,
          timestamp,
        });
        console.log('Order created:', newOrder);
        if (newOrder) {
          await cartService.removeCartWithId(filtered_cart, user.userId, user.isAdmin);
        }
        break;
      }
      case 'update': {
        if (!user || !(await authService.hasPermission('order:update'))) {
          console.error('Permission denied: You do not have permission to update orders.');
          return;
        }
        let targetUser_: string | undefined = undefined;
        if (options.targetUser) {
          try {
            await authService.getUserById(options.targetUser);
            targetUser_ = options.targetUser;
          } catch (error: any) {
            console.error(`Error fetching target user: ${error.message}`);
            return;
          }
        }
        const itemsOption = options.items as string | undefined;
        if (!itemsOption) {
          console.error('Error: --items option is required for "update" command.');
          return;
        }
        // Retrieve the order data directly from the service
        const orderData = await orderService.getOrders(user.userId, user.isAdmin, targetUser_) as OrderData | undefined;
        if (!orderData) {
          throw new Error("The order is empty!");
        }
        const selected_items = itemsOption.split(",");
        let filtered_items: CartItem[] = [];
        console.log("this is orderData ", orderData.items)
        if (Array.isArray(orderData.items)) {
          filtered_items = orderData.items.filter(item => selected_items.includes(item.productId));
        }
        console.log("this is filtered_items ", filtered_items)
        const statusOption = options.status as string | undefined;
        if (!statusOption || (statusOption !== "Pending" && statusOption !== "Done")) {
          throw new Error('Please enter a valid status - Pending or Done');
        }
        if (filtered_items.length === 0) {
          throw new Error("Please select the product first!");
        }
        const producttotal_id: string[] = filtered_items.map(item => String(item.productId));
        await orderService.updateOrder({
          userId: user.userId,
          items: producttotal_id,
          status: statusOption,
          isAdmin: user.isAdmin
        }, targetUser_);
        console.log('Order updated.');
        break;
      }
      case 'delete': {
        if (!user || !(await authService.hasPermission('order:delete'))) {
          console.error('Permission denied: You do not have permission to delete orders.');
          return;
        }
        let targetUser_: string | undefined = undefined;
        if (options.targetUser) {
          try {
            await authService.getUserById(options.targetUser);
            targetUser_ = options.targetUser;
          } catch (error: any) {
            console.error(`Error fetching target user: ${error.message}`);
            return;
          }
        }
    
        const orderData = await orderService.getOrders(user.userId, user.isAdmin, targetUser_) as OrderData | undefined;
        if (!orderData) {
          throw new Error("The order is empty!");
        }
        const itemsOption = options.items as string | undefined;
        let selected_items: string[] = [];
        if (itemsOption) {
          selected_items = itemsOption.split(",");
        }
        
        let filtered_items: CartItem[] = [];
        if (Array.isArray(orderData.items)) {
          filtered_items = orderData.items.filter(item => selected_items.includes(item.productId));
        }
        const producttotal_id: string[] = filtered_items.map(item => String(item.productId));
        if (producttotal_id.length === 0 && selected_items.length > 0) {
          console.warn("No matching product IDs found in the order for deletion.");
        } else if (selected_items.length === 0) {
          console.warn("Please provide product IDs to delete using the --items option.");
          return;
        }
        await orderService.deleteOrder({
          userId: user.userId,
          producttotal_id,
          isAdmin: user.isAdmin
        }, targetUser_);
        console.log('Order updated after deletion attempt.');
        break;
      }
      default:
        console.error('Error: Invalid order command or subcommand.');
    }
  } catch (error: any) {
    console.error('Error processing order command:', error.message);
  }
};

export default handleOrderCommand;
