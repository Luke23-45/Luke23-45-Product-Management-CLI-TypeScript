// utils/fileUtils.ts

import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.stat(filePath);
    return true;
  } catch (error: any) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function ensureFile(
  filePath: string,
  flg?: string
): Promise<void> {
  if (!(await fileExists(filePath))) {
    try {
      interface DefaultData {
        userId: number;
        productId: number;
        orderId: number;
        cartId: number;
        category:number
      }

      let default_data: any[] | DefaultData | undefined = [];



      if (flg === "c" || flg === "o") {
        default_data = [{}]; 
      }

      if (flg === "utils") {
        default_data = {
          userId: 0,
          productId: 0,
          orderId: 0,
          cartId: 0,
          category: 0
        };
      }

    
      await fsp.mkdir(path.dirname(filePath), { recursive: true });

      await writeJSONFile(filePath, default_data);
      console.info(`File ${filePath} created with default data.`);
    } catch (error: any) {
      console.error(`Error ensuring file ${filePath}:`, error);
      throw error;
    }
  }
}

// check for file existence.
export const writeJSONFile = async (
  filePath: string,
  data: any,
  ensure: boolean = true
): Promise<void> => {

  if (ensure) {

    await fsp.mkdir(path.dirname(filePath), { recursive: true });
  }
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonData, "utf8");
    const stream = fs.createWriteStream(filePath);
    let errorOccurred = false;

    stream.write(buffer);
    stream.end();

    stream.on("finish", () => {
      if (!errorOccurred) {
        resolve();
      }
    });
    stream.on("error", (err: Error) => {
      errorOccurred = true;
      reject(
        new Error(`Error writing JSON file: ${filePath} - ${err.message}`)
      );
    });
  });
};


export const readJSONFile = async (
  filePath: string,
  flg?: string
): Promise<any> => {

  await ensureFile(filePath, flg);
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, "utf8");
    let data = "";
    let errorOccurred = false;

    stream.on("data", (chunk: string|Buffer) => {
      data += chunk;
    });
    stream.on("end", () => {
      if (errorOccurred) return;
      try {
        if (flg === "c" || flg === "o") {
          if (!data) {
            data = JSON.stringify([{}]);
          }
        }
        if (flg === "u" || flg === "p") {
          if (!data) {
            data = JSON.stringify([]);
          }
        }
        if (flg === "utils") {
          if (!data) {
            data = JSON.stringify( {
              userId: 0,
              productId: 0,
              orderId: 0,
              cartId: 0,
              category: 0
            });
          }
        }
        const jsonData = JSON.parse(data);
        resolve(jsonData);
      } catch (parseError: any) {
        reject(
          new Error(
            `Error parsing JSON file: ${filePath} - ${parseError.message}`
          )
        );
      }
    });

    stream.on("error", (err: Error) => {
      errorOccurred = true;
      reject(new Error(`Error reading file: ${filePath} - ${err.message}`));
    });
  });
};
