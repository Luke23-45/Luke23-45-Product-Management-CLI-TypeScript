// services/cartService.ts

import { readJSONFile, writeJSONFile } from '../utils/fileUtils';
import { generateId } from '../utils/sessionUtils'; 
import { validateCartData } from '../utils/validate/cartValidation';

import { ProductService } from '../services/productService';

const CART_FILE: string = '../data/cart.json';

export interface CartItem {
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  status?: string; 
  total: number;
}


export interface CartData {
  [userId: string]: CartItem[];
}

export class CartService {
  private cartIndex: Record<string, number> | null = null;
  private productService: ProductService;

  constructor(){
    this.productService = new ProductService();
  }
  
  private logMessage(message: string): void {
    console.log(message);
  }

  // Private helper: logs an error
  private logError(methodName: string, errorMessage: string): void {
    console.error(`Error in ${methodName}:`, errorMessage);
  }

  // Private helper to read the cart data file
  private async getCartData(): Promise<CartData[]> {
    return (await readJSONFile(CART_FILE, 'c')) as CartData[];
  }

  // Private helper to save cart data
  private async saveCartData(cartData: CartData[]): Promise<void> {
    await writeJSONFile(CART_FILE, cartData);
  }

  // Private helper: Initialize cart if not already done
  private async ensureCartInitialized(): Promise<void> {
    if (!this.cartIndex) {
      await this.initializeCart();
    }
  }

  // Public method: Initialize the cart index from file data
  public async initializeCart(): Promise<void> {
    try {
      const cartArray = (await readJSONFile(CART_FILE, 'c')) as CartData[];
      const cart = cartArray[0] || {};
      this.cartIndex = {};
      Object.keys(cart).forEach((user, index) => {
        this.cartIndex![user] = index;
      });
    } catch (error: any) {
      this.logError('initializeCart', error.message);
      this.cartIndex = {};
    }
  }

  public async getCart(userId: string, isAdmin: boolean, targetUser_?: string): Promise<CartItem[] | CartData[] | undefined> {
    try {
      await this.ensureCartInitialized();
      const userIdToUse = isAdmin && targetUser_ ? targetUser_ : userId;
      const index = this.cartIndex?.[userIdToUse];
      if (index === undefined && !isAdmin) {
        throw new Error("User has not added anything to cart yet!");
      }
      const cartArray = await this.getCartData() as CartData[]; // Explicitly type as CartData[]
      const cartData = cartArray[0];

      console.log("^^^", cartData);
      return isAdmin ? cartArray : cartData?.[userIdToUse];
    } catch (error: any) {
      this.logError('getCart', error.message);
      throw error;
    }
  }

  // Helper: Return the appropriate user id based on isAdmin flag and targetUser value.
  private getTargetUserId(userId: string, isAdmin: boolean, targetUser?: string): string {
    return isAdmin && targetUser ? targetUser : userId;
  }

  // Public method: Add a product to a user's cart
  public async addProductToCart(productId: string, quantity: number, userId: string): Promise<CartItem[] | undefined> {  
    try {
      userId = String(userId);
      await this.ensureCartInitialized();
      const validationErrors = validateCartData({ productId, quantity, userId });
      console.log("this is 2",validationErrors);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid product data: ${validationErrors.join(', ')}`);
      }
      
      // Fetch product information for the cart; this throws an error if not found
      const productInformation = await this.productService.getProductForCartById(productId, quantity);
      if (!productInformation) {
        throw new Error(`Product with ID ${productId} not found.`);
      }

      const getTotalPrice = quantity * productInformation.price;
      const cartData = await this.getCartData();
      const cartId_ = String(await generateId('c'));
      const newProduct: CartItem = { cartId: cartId_, productId, quantity, price: productInformation.price, total: getTotalPrice };
    
      const userCartKey = userId;
      const index = this.cartIndex?.[userCartKey];
      // If user cart does not exist, create a new one.
      if (index === undefined) {
        cartData[0][userCartKey] = [newProduct];
        await this.saveCartData(cartData);
        await this.productService.signalInventory(productId, quantity, "r");
        // console.log(cartData,"&&&");
        return [newProduct];
      } else {
        const userCart = cartData[0][userCartKey];
        const existingProductIndex = userCart.findIndex(item => item.productId === productId);

        if (existingProductIndex > -1) {
          // Update quantity and total if the product already exists
          userCart[existingProductIndex].quantity += quantity;
          userCart[existingProductIndex].total += getTotalPrice;
          this.logMessage(`Product quantity updated for product id ${productId}`);
          console.log("-------Updated cart Information----\n", userCart[existingProductIndex]);
        } else {
          // Add the new product if it doesn't exist
          cartData[0][userCartKey].push(newProduct);
          this.logMessage("Product added to your cart!");
          console.log("-------Updated cart Information----\n", newProduct);
        }
        await this.saveCartData(cartData);
        await this.productService.signalInventory(productId, quantity, "r");
        return cartData[0][userCartKey];
      }
    } catch (error: any) {
      this.logError('addProductToCart', error.message);
      throw error;
    }
  }

  // Public method: Remove a product from a user's cart
  public async removeProductFromCart(productId: string, userId: string, isAdmin: boolean, targetUser?: string): Promise<CartData[]> {
    try {
      await this.ensureCartInitialized();
      const userToRemoveFrom = this.getTargetUserId(userId, isAdmin, targetUser);
      // Verify non-admins have a cart before removal
      if (!isAdmin) {
        const cartData = await this.getCartData();
        if (!cartData[0]?.[userId] || cartData[0][userId].length === 0) {
          throw new Error("User has not added anything to cart yet!");
        }
      }
      const cart = await this.getCartData();
      const userCartKey = `${userToRemoveFrom}`;

      if (cart[0]?.[userCartKey]) {
        const initialCartLength = cart[0][userCartKey].length;
        const cartItemToRemove = cart[0][userCartKey].find(item => item.productId === productId);
        cart[0][userCartKey] = cart[0][userCartKey].filter(item => item.productId !== productId);
        const updatedCartLength = cart[0][userCartKey].length;
        if (updatedCartLength === 0) {
          delete cart[0][userCartKey];
        }
        await this.saveCartData(cart);
        if (cartItemToRemove) {
          await this.productService.signalInventory(cartItemToRemove.productId, cartItemToRemove.quantity, "i");
        }
        if (initialCartLength > updatedCartLength) {
          this.logMessage(`Product removed successfully with id ${productId}`);
          this.logMessage("Updated cart" + JSON.stringify(await this.getCart(userId, isAdmin)));
        } else {
          this.logMessage(`Product was not found with the id ${productId}`);
        }
      } else {
        const errorMessage = isAdmin && targetUser
          ? `User with id ${targetUser} does not have a cart.`
          : `User with id ${userId} does not have a cart.`;
        throw new Error(errorMessage);
      }
      return cart;
    } catch (error: any) {
      this.logError('removeProductFromCart', error.message);
      throw error;
    }
  }

  // Public method: Update a cart item's quantity
  public async updateCartItemQuantity(productId: string, quantity: number, userId: string, isAdmin: boolean, targetUser?: string): Promise<CartData[]> {
    try {
      await this.ensureCartInitialized();
      const userToUpdate = this.getTargetUserId(userId, isAdmin, targetUser);
      if (!isAdmin) {
        const cartData = await this.getCartData();
        if (!cartData[0]?.[userId] || cartData[0][userId].length === 0) {
          throw new Error("User has not added anything to cart yet!");
        }
      }

      const cart = await this.getCartData();
      const userCartKey = `${userToUpdate}`;

      if (cart[0]?.[userCartKey]) {
        const userCartItems = cart[0][userCartKey];
        const itemIndex = userCartItems.findIndex(item => item.productId === productId);
        if (itemIndex > -1) {
          const productInformation = await this.productService.getProductForCartById(productId, quantity);
          const oldQuantity = userCartItems[itemIndex].quantity;
          // Update the price (assumed per unit) and quantity
          userCartItems[itemIndex].price = quantity * productInformation.price;
          await this.productService.signalInventory(productId, (oldQuantity - quantity), "i");
          userCartItems[itemIndex].quantity = quantity;
          await this.saveCartData(cart);
          this.logMessage(`Product with id ${productId} updated with quantity ${quantity}`);
          this.logMessage(JSON.stringify(userCartItems[itemIndex]));
        } else {
          throw new Error(`Product with id ${productId} could not be found in the cart.`);
        }
      } else {
        const errorMessage = isAdmin && targetUser
          ? `User with id ${targetUser} does not have a cart.`
          : `User with id ${userId} does not have a cart.`;
        throw new Error(errorMessage);
      }
      return cart;
    } catch (error: any) {
      this.logError('updateCartItemQuantity', error.message);
      throw error;
    }
  }

  // Public method: Get the total value in a user's cart and log it to the console
  public async getTotalCart(userId: string, isAdmin: boolean, targetUser?: string): Promise<void> {
    try {
      await this.ensureCartInitialized();
      const userToCalculate = this.getTargetUserId(userId, isAdmin, targetUser);
      if (!isAdmin) {
        const cartData = await this.getCartData();
        if (!cartData[0]?.[userId] || cartData[0][userId].length === 0) {
          throw new Error("User has not added anything to cart yet!");
        }
      }
      const cart = await this.getCartData();
      const userCartKey = `${userToCalculate}`;
      let total = 0;
      if (cart[0]?.[userCartKey]) {
        if (Array.isArray(cart[0][userCartKey])) {
          for (let i = 0; i < cart[0][userCartKey].length; i++) {
            total += cart[0][userCartKey][i].total;
          }
        } else {
          throw new Error("User has not added any product yet!");
        }
      }
      console.log("The current total cart is ", total.toFixed(3));
    } catch (error: any) {
      this.logError('getTotalCart', error.message);
      throw error;
    }
  }

  // Public method: Remove cart items that match a provided array of CartItem objects
  public async removeCartWithId(arr: CartItem[], userId: string, isAdmin: boolean, targetUser?: string): Promise<CartData[]> {
    try {
      await this.ensureCartInitialized();
      const userToRemoveFrom = this.getTargetUserId(userId, isAdmin, targetUser);
      if (!isAdmin) {
        const cartData = await this.getCartData();
        if (!cartData[0]?.[userId] || cartData[0][userId].length === 0) {
          throw new Error("User has not added anything to cart yet!");
        }
      }
      const cart = await this.getCartData();
      const userCartKey = `${userToRemoveFrom}`;
      if (cart[0]?.[userCartKey]) {
        const data = this.uniqueElements(cart[0][userCartKey], arr);
        if (data.length === 0) {
          delete cart[0][userCartKey];
        } else {
          cart[0][userCartKey] = data;
        }
        console.log(data);
        await this.saveCartData(cart);
      } else {
        const errorMessage = isAdmin && targetUser
          ? `User with id ${targetUser} does not have a cart.`
          : `User with id ${userId} does not have a cart.`;
        throw new Error(errorMessage);
      }
      return cart;
    } catch (error: any) {
      this.logError('removeCartWithId', error.message);
      throw error;
    }
  }

  // Public method: Remove items from the cart based on an array of product IDs
  public async removeCartWithProductId(arr: string[], userId: string, isAdmin: boolean, targetUser?: string): Promise<CartData[]> {
    try {
      console.log("---------------------");
      await this.ensureCartInitialized();
      const userToRemoveFrom = this.getTargetUserId(userId, isAdmin, targetUser);
      if (!isAdmin) {
        const cartData = await this.getCartData();
        if (!cartData[0]?.[userId] || cartData[0][userId].length === 0) {
          throw new Error("User has not added anything to cart yet!");
        }
      }
      const cart = await this.getCartData();
      console.log("this cartdata", cart[0][userId]?.[0]);
      const userCartKey = `${userToRemoveFrom}`;

      if (cart[0]?.[userCartKey]) {
        let foundIds: string[] = [];
        if (Array.isArray(arr) && Array.isArray(cart[0][userId])) {
          for (let i = 0; i < cart[0][userId].length; i++) {
            if (arr.includes(cart[0][userId][i].productId)) {
              foundIds.push(cart[0][userId][i].productId);
            }
          }
        }
        if (foundIds.length !== 0 && cart[0][userId]) {
          cart[0][userId] = cart[0][userId].filter(data => !foundIds.includes(data.productId));
        }
        if (cart[0][userId]?.length === 0) {
          delete cart[0][userId];
        }
        await this.saveCartData(cart);

        this.logMessage(`Product removed`);
      } else {
        const errorMessage = isAdmin && targetUser
          ? `User with id ${targetUser} does not have a cart.`
          : `User with id ${userId} does not have a cart.`;
        throw new Error(errorMessage);
      }
      return cart;
    } catch (error: any) {
      this.logError('removeCartWithProductId', error.message);
      throw error;
    }
  }

  // Private helper: Returns unique elements from arr1 compared to arr2
  private uniqueElements(arr1: CartItem[], arr2: CartItem[]): CartItem[] {
    const result: CartItem[] = [];
    for (const item1 of arr1) {
      let foundInArr2 = false;
      for (const item2 of arr2) {
        if (
          item1.cartId === item2.cartId &&
          item1.productId === item2.productId &&
          item1.quantity === item2.quantity
        ) {
          foundInArr2 = true;
          break;
        }
      }
      if (!foundInArr2) {
        result.push(item1);
      }
    }
    return result;
  }
}
