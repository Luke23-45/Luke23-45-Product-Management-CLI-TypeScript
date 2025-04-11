// services/productService.ts

import { readJSONFile, writeJSONFile } from '../utils/fileUtils';
import { generateId } from '../utils/sessionUtils'; 
import { validateProductData } from '../utils/validate/productValidation'; 

const PRODUCTS_FILE: string = './../data/products.json';
const CATEGORY_FILE: string = './../data/category.json';

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  inventory: number;
}
export interface Product_ {
  id: string;
  userId: string;
  name: string;
  price: number;
  description?: string;
  category?: string[];
  inventory: number;
}

export interface Category{
    id: string;
    name:string;
    description:string;
    slug:string;
    created_at:string; 
}

export class ProductService {
  private productIndex: Record<string, number> | null = null;

  public async initializeProductIndex(): Promise<void> {
    try {
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, "p")) as Product[];
      this.productIndex = {};
      products.forEach((product, index) => {
        this.productIndex![product.id] = index;
      });
    } catch (error: any) {
      console.error('Error initializing product index:', error.message);
      this.productIndex = {};
    }
  }

  public async getProductTotal(data: string[]): Promise<number> {
    try {
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
      let total = 0;
      for (let i = 0; i < data.length; i++) {
        const index = this.productIndex?.[data[i]];
        if (index === undefined) {
          throw new Error("Invalid product key found!");
        } else {
          total += parseInt(products[index].price.toString(), 10);
        }
      }
      return total;
    } catch (err: any) {
      console.error('Error getting products total', err.message);
      throw err;
    }
  }

  public async getProducts(userId: string, isAdmin: boolean): Promise<Product[]> {
    try {
      userId = String(userId);
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      if (isAdmin) {
        return (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
      } else {
        let data: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
        data = data.filter(product => product.userId === userId);
        
        if (data.length === 0) {
          throw new Error("User has not added any product yet!");
        }
        return data;
      }
    } catch (error: any) {
      console.error('Error getting products:', error.message);
      throw error;
    }
  }

  // This function reduces or increases the inventory based on flag 'r' (reduce) or 'i' (increase)
  public async signalInventory(productId: string, quantity: number, flag: 'r' | 'i'): Promise<void> {
    try {
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
      const index = this.productIndex?.[productId];
      if (index === undefined) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      const product = products[index];
      if (flag === 'r') {
        product.inventory -= quantity;
      } else if (flag === 'i') {
        product.inventory += quantity;
      }

      products[index] = { ...product };
      await writeJSONFile(PRODUCTS_FILE, products);
    } catch (err: any) {
      throw new Error("Error in the inventory system!");
    }
  }

  public async getProductForCartById(id: string, quantity: number): Promise<Product> {
    if (!this.productIndex) {
      await this.initializeProductIndex();
    }
    const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
    const index = this.productIndex?.[id];
    if (index === undefined) {
      throw new Error(`Product with ID ${id} not found`);
    }
    const product = products[index];
    if (product.inventory < quantity) {
      throw new Error(`Product does not have ${quantity} item in inventory. The stock contains ${product.inventory}`);
    }
    return product;
  }
  public generateSlug(str: string): string {
    const lowerStr = str.toLowerCase();
    const charArray = lowerStr.split('');
    for (let i = 0; i < charArray.length; i++) {
      if (charArray[i] === ' ') {
        charArray[i] = '_';
      }
    }
    return charArray.join('');
  }
  public async getProductById(id: string, userId: string, isAdmin: boolean): Promise<Product> {
    try {
      userId = String(userId);
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
      const index = this.productIndex?.[id];
      if (index === undefined) {
        throw new Error(`Product with ID ${id} not found`);
      }
      if (isAdmin) {
        return products[index];
      } else {
        if (products[index].userId === userId) {
          return products[index];
        } else {
          throw new Error("You do not have permission.");
        }
      }
    } catch (error: any) {
      console.error('Error getting product by ID:', error.message);
      throw error;
    }
  }

  public async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    try {
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      if (validateProductData) {
        const validationErrors = validateProductData(productData);
        if (validationErrors.length > 0) {
          throw new Error(`Invalid product data: ${validationErrors.join(', ')}`);
        }
      }
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
  
      const newProductId = String(await generateId('p'));
      const newProduct: Product = { id: newProductId, ...productData };
      const categories: Category[] = (await readJSONFile(CATEGORY_FILE, 'p')) as Category[];
      const category_: string = productData.category ? productData.category : " "; 
      console.log("this is cat", category_);
      const cat: boolean = products.map(product => product.category).includes(category_); 
      const catId = `${(await generateId('cat'))}`;

      const newMainProduct: Product_ = {
        id: newProduct.id,
        userId: newProduct.userId,
        name: newProduct.name,
        price: newProduct.price,
        description: newProduct.description,
        category: [''],
        inventory: newProduct.inventory,
      }
      if(!cat){
        newMainProduct.category = [`${catId}`]
      }else{
        const cay = categories.find(category => category.name.toLocaleLowerCase() === newProduct.name.toLocaleLowerCase());
        if(cay){
          newMainProduct.category = [`${cay.id}`]
        }
      
        
      }
      products.push(newProduct);
      await writeJSONFile(PRODUCTS_FILE, products);

      console.log("this is cat___t", cat);
      if(!cat &&  productData.category){
        const catData:Category = {
          id: catId,
          name:productData.category ? productData.category : " ",
          description:"",
          slug:this.generateSlug(productData.category ? productData.category : " "),
          created_at:`${Date.now()}`
        }
        categories.push(catData);
        await writeJSONFile(CATEGORY_FILE, categories);
      }
      // Update the index
      this.productIndex![newProductId] = products.length - 1;
      return newProduct;
    } catch (error: any) {
      console.error('Error creating product:', error.message);
      throw error;
    }
  }

  public async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>, isAdmin: boolean, userId: string): Promise<Product> {
    userId = String(userId);
    try {
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      const index = this.productIndex?.[id];
      if (index === undefined) {
        throw new Error(`Product with ID ${id} not found`);
      }
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
      if (products[index].userId === userId || isAdmin) {
        console.log("Product before update:", products[index]);
        for (const key in productData) {
          if (Object.prototype.hasOwnProperty.call(productData, key)) {
            (products[index] as any)[key] = productData[key as keyof typeof productData];
          }
        }
        await writeJSONFile(PRODUCTS_FILE, products);
        return products[index];
        
      } else {
        throw new Error("You do not have permission to update this product");
      }
    } catch (error: any) {
      console.error('Error updating product:', error.message);
      throw error;
    }
  }

  public async deleteProduct(id: string, userId: string, isAdmin: boolean): Promise<void> {
    
    try {
      userId = String(userId);
      if (!this.productIndex) {
        await this.initializeProductIndex();
      }
      const index = this.productIndex?.[id];
      if (index === undefined) {
        throw new Error(`Product with ID ${id} not found`);
      }
      const products: Product[] = (await readJSONFile(PRODUCTS_FILE, 'p')) as Product[];
      if (products[index].userId === userId || isAdmin) {
        products.splice(index, 1);
        await writeJSONFile(PRODUCTS_FILE, products);
      } else {
        throw new Error("You do not have permission to delete this product.");
      }
      // Update the index after deletion
      await this.initializeProductIndex();
    } catch (error: any) {
      console.error('Error deleting product:', error.message);
      throw error;
    }
  }
}
