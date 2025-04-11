// lib/parser.ts

 //Parses an array of command-line arguments.
 //Expected format: <command> [subcommand] [--option1 value1] [--option2 value2] ...
 
interface ParsedArgs {
  command: string | null;
  subcommand: string | null;
  options: Record<string, any>;
  arguments: string[]; 
}

const parseArgs = (args: string[]): ParsedArgs => {
  const result: ParsedArgs = {
    command: null,
    subcommand: null,
    options: {},
    arguments: [],
  };

  if (args.length === 0) {
    return result;
  }

  // The first argument is treated as the command.
  // product, card, order are  commands.
  result.command = args[0];

  // Check if there's a subcommand
  // subcommand is expected to start with '-' or '--'
  if (args.length > 1 && !args[1].startsWith('--') && !args[1].startsWith('-')) {
    result.subcommand = args[1];
    args = args.slice(2); // Remove command and subcommand from args
  } else {
    args = args.slice(1); // Remove only the command
  }

  // Process the remaining arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    // Identify options (starting with '--' or '-')
    if (arg.startsWith('--') || arg.startsWith('-')) {
      let key = arg.startsWith('--') ? arg.slice(2) : arg.slice(1);
      let value: string | boolean = true; // Default value if none provided

      // Check if the next argument is a value
      if (i + 1 < args.length && !args[i + 1].startsWith('--') && !args[i + 1].startsWith('-')) {
        value = args[i + 1];
        i++;
      }

      // Handle options with dot notation (e.g., --user.name)
      if (key.includes('.')) {
        const keys = key.split('.');
        let current: Record<string, any> = result.options;
        for (let j = 0; j < keys.length - 1; j++) {
          if (!current[keys[j]]) {
            current[keys[j]] = {};
          }
          current = current[keys[j]];
        }
        current[keys[keys.length - 1]] = value;
      } else {
        result.options[key] = value;
      }
    } else {
      // It's a positional argument
      result.arguments.push(arg);
    }
  }

  return result;
};
 // Displays help documentation for the CLI.

const showHelp = (): void => {
  const helpText = `
Usage:
  node index.js <command> [subcommand] [options] [arguments]

Commands:
  product         Manage products (list, add, update, delete)
  cart            Manage cart (add, remove, view, total)
  order           Manage orders (create, list)

Options:
  --key value     Specify an option and its value (e.g., --name "Product Name")
  -k value        Short option for key

Arguments:
  Positional arguments are accepted after commands and options.
`;
  console.log(helpText);
};

export { parseArgs, showHelp };