// services/authService.ts
import { readJSONFile, writeJSONFile } from '../utils/fileUtils';
import { generateId } from '../utils/sessionUtils';
const USERS_FILE: string = '../data/users.json';
const SESSION_USER_FILE: string = '../data/sessionuser.json';

export interface User {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
  firstName?: string; 
  lastName?: string;  
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
  password?: string;
  permissions?: string[] | string;
}

export class AuthService {
  private sessionUser: User | null = null;

  // A simple hashing function 
  private static simpleHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
  public async getUserById(userId: string): Promise<string> {
    try {
      const users: User[] = await readJSONFile(USERS_FILE, 'u');
  
      if (!users) {
        throw new Error('Could not read users file');
      }
  
      const user = users.find((user) => String(user.userId) === String(userId));
  
      if (!user) {
        throw new Error('Invalid userID');
      }
  
      console.log("Target user was found with Id", user.userId);
      return user.userId; // Return the userId
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Could not find the user with the given ID ${userId}: ${err.message}`);
      } else {
        throw new Error(`Could not find the user with the given ID ${userId}: ${String(err)}`);
      }
    }
  };
  public async initializeSession(): Promise<void> {
    try {
      this.sessionUser = (await readJSONFile(SESSION_USER_FILE, 'o')) as User | null;
      console.log("--------sessionUser------------", this.sessionUser);
      if (!this.sessionUser) {
        this.sessionUser = null;
        await writeJSONFile(SESSION_USER_FILE, this.sessionUser);
      }
    } catch (error: any) {
      console.error('Error initializing session:', error.message);
      this.sessionUser = null;
    }
  }

  public async login(username: string, password: string): Promise<User> {
    try {
      const users: User[] = (await readJSONFile(USERS_FILE, 'u')) as User[];
      if (!users) {
        throw new Error('Could not read users file');
      }
      const user = users.find((u) => String(u.username) === String(username));
      if (!user) {
        throw new Error('Invalid username or password');
      }
      // Compare hashed password values
      if (user.password !== AuthService.simpleHash(password)) {
        throw new Error('Invalid username or password');
      }
      // Store the user as the current session user
      await this.setSessionUser(user);
      return user;
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  public async register(username: string, password: string, permissions?: string): Promise<User> {
    let parsedPermissions: string[] = [];
    if (permissions) {
      parsedPermissions = permissions.split(',').map((permission) => permission.trim());
    }
    try {
      const users: User[] = (await readJSONFile(USERS_FILE, 'u')) as User[];
      if (!users) {
        throw new Error('Could not read users file');
      }
      const existingUser = users.find((user) => user.username === username);
      if (existingUser) {
        throw new Error('Username already exists');
      }
      // Generate a new user id
      const userId: string = `${await generateId('u')}`;
      const newUser: User = {
        userId: String(userId),
        username,
        email: '', 
        isAdmin: false,
        firstName: '',
        lastName: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        roles: permissions ? parsedPermissions : [],
      };
      // Assign hashed password and permissions for authentication
      newUser.password = AuthService.simpleHash(password);
      newUser.permissions = parsedPermissions;
      
      users.push(newUser);
      await writeJSONFile(USERS_FILE, users);
      return newUser;
    } catch (error: any) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  public async getSessionUser(): Promise<User | null> {
    try {
      if (!this.sessionUser) {
        await this.initializeSession();
      }
      return this.sessionUser;
    } catch (error: any) {
      console.error('Error getting session user:', error.message);
      return null;
    }
  }

  public async setSessionUser(user: User): Promise<void> {
    try {
      this.sessionUser = user;
      await writeJSONFile(SESSION_USER_FILE, user);
    } catch (error: any) {
      console.error('Error setting session user:', error.message);
    }
  }

  public async hasPermission(permission: string): Promise<boolean> {
    try {
      const user = await this.getSessionUser();
      if (!user || Object.keys(user).length === 0) {
        return false;
      }
      console.log("Session User Permissions:", user.permissions);
      let userPermissions: string[] = [];
      if (Array.isArray(user.permissions)) {
        userPermissions = user.permissions.map((perm) => perm.trim());
      } else if (typeof user.permissions === 'string') {
        userPermissions = (user.permissions as string).split(',').map((perm) => perm.trim());
      } else {
        console.warn("User permissions are in an unexpected format:", user.permissions);
        return false;
      }
      return userPermissions.includes(permission);
    } catch (error: any) {
      console.error('Error checking permission:', error.message);
      return false;
    }
  }
  public async clearSessionUser(): Promise<void> {
    try {
      this.sessionUser = null;
      await writeJSONFile(SESSION_USER_FILE, {});
    } catch (error: any) {
      console.error('Error clearing session user:', error.message);
    }
  }
}
