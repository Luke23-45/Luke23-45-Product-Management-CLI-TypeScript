// bin/index.ts
import { parseArgs, showHelp } from '../lib/parser.js';
import handleProductCommand from '../commands/product.js';
import handleCartCommand from '../commands/cart.js';
import handleOrderCommand from '../commands/order.js';
import { AuthService, User } from '../services/authService.js';


type CommandHandler = (args: {
  options: Record<string, any>;
  subcommand?: string;
  arguments: string[];
  user: User;
}) => Promise<void> | void;

interface ParsedArgs {
  command: string | null;
  subcommand: string | null;
  options: Record<string, any>;
  arguments: string[];
}

// Define the type for the commands object
interface Commands {
  product: CommandHandler;
  cart: CommandHandler;
  order: CommandHandler;
}

const commands: Commands = {
  product: handleProductCommand,
  cart: handleCartCommand,
  order: handleOrderCommand,
};

async function run() {
  const authService = new AuthService();
  const args: string[] = process.argv.slice(2);
  const parsed: ParsedArgs = parseArgs(args);
  console.log(parsed);

  if (!parsed.command) {
    console.error('No command provided.\n');
    showHelp();
    process.exit(1);
  }

  switch (parsed.command) {
    case 'login':
      if (parsed.options?.username && parsed.options?.password) {
        try {
          const user: User = await authService.login(
            parsed.options.username as string,
            parsed.options.password as string
          );
          if (user) {
            console.log('Login successful!');
          } else {
            console.log('Login failed!');
          }
        } catch (error: any) {
          console.error(error.message);
        }
      } else {
        console.error('Username and password are required for login.');
      }
      break;
    case 'logout':
      try {
        await authService.clearSessionUser();
        console.log('Logout successful!');
      } catch (error: any) {
        console.error(error.message);
      }
      break;
    case 'register':
      if (parsed.options?.username && parsed.options?.password) {
        try {
          const user: User = await authService.register(
            parsed.options.username as string,
            parsed.options.password as string,
            parsed.options.permissions as string | undefined
          );
          if (user) {
            console.log('Registration successful!');
          } else {
            console.log('Registration failed!');
          }
        } catch (error: any) {
          console.error(error.message);
        }
      } else {
        console.error('Username and password are required for registration.');
      }
      break;
    default:
      try {
        const sessionUser: User | null = await authService.getSessionUser();
        if (!sessionUser) {
          console.error('You must be logged in to perform this action.');
          return;
        }
        // With the session check above, sessionUser is guaranteed non-null.
        const commandHandler = commands[parsed.command as keyof Commands];
        if (commandHandler) {
          await commandHandler({
            options: parsed.options,
            subcommand: parsed.subcommand ?? undefined,
            arguments: parsed.arguments,
            user: sessionUser,
          });
        } else {
          console.error(`Unknown command: ${parsed.command}\n`);
          showHelp();
          process.exit(1);
        }
      } catch (error: any) {
        console.error('Error processing command:', error.message);
      }
  }
}

run();
