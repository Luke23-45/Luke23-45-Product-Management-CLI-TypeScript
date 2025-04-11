// /commands/product.ts

import { ProductService, Product } from '../services/productService';
import { AuthService } from '../services/authService.js';

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

export const handleProductCommand = async (parsedCommand: ParsedCommand): Promise<void> => {
  try {
    const productService = new ProductService();
    await productService.initializeProductIndex();
    const authService = new AuthService();

    const { options, subcommand, arguments: args, user } = parsedCommand;
    console.log("this is user: ", user)
    console.log('---------Product Command--------');
    console.log(options);

    switch (subcommand || args[0]) {
      case 'list':
        if (!user || !(await authService.hasPermission('product:view'))) {
          console.error('Permission denied: You do not have permission to view products.');
          return;
        }
        const products = await productService.getProducts(user.userId, user.isAdmin);
        console.log(products);
        break;

      case 'get': {
        if (!user || !(await authService.hasPermission('product:view'))) {
          console.error('Permission denied: You do not have permission to view products.');
          return;
        }
        const id = args[0];
        if (!id) {
          console.error('Error: Product ID is required for the "get" command.');
          return;
        }
        const product = await productService.getProductById(id, user.userId, user.isAdmin);
        console.log(product);
        break;
      }

      case 'add': {
        if (!user || !(await authService.hasPermission('product:create'))) {
          console.error('Permission denied: You do not have permission to add products.');
          return;
        }
        const userId = String(user.userId);
        const name = options?.name as string;
        const price = parseFloat(options?.price as string);
        const description = options?.description as string | undefined;
        const category = options?.category as string | undefined;
        const inventory = parseFloat(options?.inventory as string);

        if (!name || isNaN(price) || isNaN(inventory)) {
          console.error('Error: Name, price, and inventory are required for the "add" command.');
          return;
        }

        const newProduct = await productService.createProduct({
          userId,
          name,
          price,
          description,
          category,
          inventory,
        });
        console.log('Product added:', newProduct);
        break;
      }

      case 'update': {
        if (!user || !(await authService.hasPermission('product:update'))) {
          console.error('Permission denied: You do not have permission to update products.');
          return;
        }
        const productId = args[0];
        if (!productId) {
          console.error('Error: Product ID is required for the "update" command.');
          return;
        }
        const newData: Partial<Omit<Product, 'id' | 'userId'>> = {};
        const fields = ["name", "price", "description", "category", "inventory"];
        type ProductUpdatableFields = Exclude<keyof Product, "id" | "userId">;

        for (const key in options) {
          if (fields.includes(key)) {
            newData[key as ProductUpdatableFields] = options[key as ProductUpdatableFields];
          } else {
            throw new Error(`Invalid field name ${key}`);
          }
        }
        console.log("New data:", newData);

        for (const key in newData) {
          const typedKey = key as ProductUpdatableFields;
        
          if (["name", "description", "category"].includes(key)) {
            if (typeof newData[typedKey] !== 'string') {
              throw new Error(
                `Name, description, and category must be a string. Received type ${typeof newData[typedKey]}`
              );
            }
          }
        
          if (["price", "inventory"].includes(key)) {
            const value = newData[typedKey];
        
            if (typeof value !== 'string' || isNaN(parseFloat(value))) {
              throw new Error(`${key} must be a number. Received ${value}`);
            }
            // @ts-ignore 
            newData[typedKey] = parseFloat(value);
          }
        }
        
        const updatedProduct = await productService.updateProduct(productId, newData, user.isAdmin, user.userId);
        console.log('Product updated:', updatedProduct);
        break;
      }

      case 'delete': {
        if (!user || !(await authService.hasPermission('product:delete'))) {
          console.error('Permission denied: You do not have permission to delete products.');
          return;
        }
        const deleteId = args[0];
        if (!deleteId) {
          console.error('Error: Product ID is required for the "delete" command.');
          return;
        }
        await productService.deleteProduct(deleteId, user.userId, user.isAdmin);
        console.log('Product deleted');
        break;
      }

      default:
        console.error(
          'Error: Invalid product command or subcommand. Valid commands are: list, get, add, update, delete'
        );
    }
  } catch (error: any) {
    console.error('Error processing product command:', error.message);
  }
};

export default handleProductCommand;
