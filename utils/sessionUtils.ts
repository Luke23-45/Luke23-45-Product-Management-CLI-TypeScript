// utils/sessionUtils.ts

import { readJSONFile, writeJSONFile } from './fileUtils';

const UTILS_FILE: string = '../data/utils.json';

interface SessionData {
  productId: number;
  orderId: number;
  cartId: number;
  userId: number;
  category:number;
}

const initializeSession = async (): Promise<SessionData> => {
  let data: SessionData;
  try {
    data = await readJSONFile(UTILS_FILE, 'utils'); 
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      data = { productId: 0, orderId: 0, cartId: 0, userId: 0, category:0 };
      await writeJSONFile(UTILS_FILE, data);
      console.log("Initialized utils.json with default values.");
    }
  } catch (error: any) {
    console.error('Error initializing session:', error.message);
    data =  { productId: 0, orderId: 0, cartId: 0, userId: 0 ,category:0};
    await writeJSONFile(UTILS_FILE, data);
  }
  return data;
};

export const generateId = async (flag: 'p' | 'o' | 'c' | 'u'|"cat"): Promise<String> => {
  let data = await initializeSession();
  console.log("Before update", data);
  let id: number = 0;
  switch (flag) {
    case "p":
      data.productId += 1;
      id = data.productId;
      break;
    case "o":
      data.orderId += 1;
      id = data.orderId;
      break;
    case "c":
      data.cartId += 1;
      id = data.cartId;
      break;
    case "u":
      data.userId += 1;
      id = data.userId;
    case "cat":
      data.category += 1;
      id = data.category;
    break;
  }
  await writeJSONFile(UTILS_FILE, data);
  return `${id}`;
};