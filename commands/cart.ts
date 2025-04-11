// commands/cart.ts

import { CartService } from '../services/cartService';
import { AuthService } from '../services/authService.js';
import { ProductService } from '../services/productService';

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

export const handleCartCommand = async (parsedCommand: ParsedCommand): Promise<void> => {
  try {
    const cartService = new CartService();
    await cartService.initializeCart();
    const authService = new AuthService();
    const productService: ProductService = new ProductService();
    const { options, subcommand, arguments: args, user } = parsedCommand;
    if (!user) {
      console.error('You must be logged in to perform cart operations.');
      return;
    }

    switch (subcommand || args[0]) {
      case 'view': {
        if (!user || !(await authService.hasPermission('cart:view'))) {
          console.error('Permission denied: You do not have permission to view the cart.');
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
        const cart = await cartService.getCart(user.userId, user.isAdmin, targetUser_);
        console.log(cart);
        break;
      }
      case 'add': {
        if (!user || !(await authService.hasPermission('cart:add'))) {
          console.error('Permission denied: You do not have permission to add products to the cart.');
          return;
        }
        // Example: node index.js cart add <productId> --quantity 2

        console.log("this is 1");
        const productId = args[0];
        const quantity = parseInt(options.quantity);
        if (!productId || isNaN(quantity)) {
          console.error('Error: Product ID and quantity are required for "add" command.');
          return;
        }
        await cartService.addProductToCart(productId, quantity, user.userId);
        break;
      }
      case 'remove': {
        if (!user || !(await authService.hasPermission('cart:remove'))) {
          console.error('Permission denied: You do not have permission to remove products from the cart.');
          return;
        }
        // Example: node index.js cart remove <productId>
        let productId = args[0];
        if (!productId) {
          console.error('Error: Product ID is required for "remove" command.');
          return;
        }
        productId = String(productId);
        try {
          await productService.getProductForCartById(productId, 1); // Check if product exists
        } catch (error: any) {
          console.error(error.message);
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
        await cartService.removeProductFromCart(productId, user.userId, user.isAdmin, targetUser_);
        break;
      }
      case 'update': {
        if (!user || !(await authService.hasPermission('cart:update'))) {
          console.error('Permission denied: You do not have permission to update the cart.');
          return;
        }
        // Example: node index.js cart update <productId> --quantity 5
        const productId = args[0];
        const quantity = parseInt(options.quantity as string);
        if (!productId || isNaN(quantity)) {
          console.error('Error: Product ID and quantity are required for "update" command.');
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
        await cartService.updateCartItemQuantity(productId, quantity, user.userId, user.isAdmin, targetUser_);
        break;
      }
      case 'total': {
        if (!(await authService.hasPermission('cart:view'))) {
          console.error('Permission denied: You do not have permission to view the cart total.');
          return;
        }
        let userName_: string | undefined = undefined;
        if (options.targetUser) {
          try {
            await authService.getUserById(options.targetUser);
            userName_ = options.targetUser;
          } catch (error: any) {
            console.error(`Error fetching target user: ${error.message}`);
            return;
          }
        }
        await cartService.getTotalCart(user.userId, user.isAdmin, userName_);
        break;
      }
      default:
        console.error('Error: Invalid cart command or subcommand.');
    }
  } catch (error: any) {
    console.error('Error processing cart command:', error.message);
  }
};

export default handleCartCommand;
