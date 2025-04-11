
# Product Management CLI

This CLI provides a command-line interface for managing products, user carts, and orders. It allows users and administrators to perform various operations such as creating, viewing, updating, and deleting data.
**Note: This readme does not include all the features and commands. Please refer to the main repository for all features and commands.**
**Please refer to the main repository for the detailed documentation: https://github.com/Luke23-45/Product-Management-CLI**
## Usage

All commands are executed using the following format:

```bash
tsx index.ts <command> <subcommand> [options] [arguments]
```

## Installation Instructions

Follow these steps to set up the project on your local machine:

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) 
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/Luke23-45/Product-Management-CLI-TypeScript
```
```bash
cd Product-Management-CLI-TypeScript
```
```bash
npm install
```


```bash
cd bin
```
---

## Commands

### User Commands

#### Create a User

```bash
tsx index.ts user create --username <username> --password <password> --permissions <permissions>
```

**Example:**

```bash
tsx index.ts register --username "krishna__" --password "12323" --permissions "product:view,product:add"
```

Creates a new user with a specified username, password, and permissions.

---

#### Login

```bash
tsx index.ts user login --username <username> --password <password>
```

**Example:**

```bash
tsx index.ts login --username "krishna__" --password "12323"
```

Logs in with an existing user account.

---

#### Logout

```bash
tsx index.ts user logout
```

**Example:**

```bash
tsx index.ts logout
```

Logs out the currently authenticated user.

---

### Product Commands

#### List Products

```bash
tsx index.ts product list
```

Lists all available products.

---

#### Get Product Details

```bash
tsx index.ts product get <productId>
```

**Example:**

```bash
tsx index.ts product get PROD001
```

Retrieves detailed information for a specific product by ID.

---

#### Add New Product

```bash
tsx index.ts product add --name <name> --price <price> --description <description> --category <category> --inventory <inventory>
```

**Example:**

```bash
tsx index.ts product add --name "New Product" --price 25.99 --description "A brand new product" --category "Electronics" --inventory 100
```

Adds a new product to the inventory.

---

#### Update Product

```bash
tsx index.ts product update <productId> --<field> <newValue>
```

**Example:**

```bash
tsx index.ts product update PROD001 --price 29.99
```

Updates an existing product's field (e.g., `price`, `inventory`).

---

#### Delete Product

```bash
tsx index.ts product delete <productId>
```

**Example:**

```bash
tsx index.ts product delete PROD005
```

Deletes a product by its ID.

---

### Cart Commands

#### View Cart

```bash
tsx index.ts cart view
```

Displays the items in your shopping cart.

---

#### Add to Cart

```bash
tsx index.ts cart add <productId> --quantity <quantity>
```

**Example:**

```bash
tsx index.ts cart add PROD002 --quantity 2
```

Adds a specified quantity of a product to your cart.

---

#### Remove from Cart

```bash
tsx index.ts cart remove <productId>
```

**Example:**

```bash
tsx index.ts cart remove PROD002
```

Removes a specific product from your cart.

---

#### Update Cart Quantity

```bash
tsx index.ts cart update <productId> --quantity <newQuantity>
```

**Example:**

```bash
tsx index.ts cart update PROD003 --quantity 5
```

Updates the quantity of a product in your cart.

---

#### Get Cart Total

```bash
tsx index.ts cart total
```

Displays the total value of the items in your cart.

---

### Order Commands

#### List Orders

```bash
tsx index.ts order list [--targetUser <userId>]
```

**Examples:**

```bash
tsx index.ts order list
tsx index.ts order list --targetUser user456
```

Lists your order history. Admins can list orders for a specific user.

---

#### Get Order Details

```bash
tsx index.ts order get <userId>
```

**Example:**

```bash
tsx index.ts order get user123
```

Retrieves the details of a specific user's order.

---

#### Create Order

```bash
tsx index.ts order create --items <productId1,productId2,...> --status <Pending|Done>
```

**Example:**

```bash
tsx index.ts order create --items "PROD001,PROD003" --status Pending
```

Creates a new order from the current cart items.

---

#### Update Order Item Status

```bash
tsx index.ts order update --items <productId1,productId2,...> --status <Pending|Done> [--targetUser <userId>]
```

**Examples:**

```bash
tsx index.ts order update --items "119" --status Done
tsx index.ts order update --items "PROD002" --status Pending --targetUser user456
```

Focuses on changing the status of products in an existing order.

---

#### Delete Order Items

```bash
tsx index.ts order delete --items <productId1,productId2,...> [--targetUser <userId>]
```

**Examples:**

```bash
tsx index.ts order delete --items "119,118"
tsx index.ts order delete --items "PROD004" --targetUser user456
```

Removes specific items from an existing order. If multiple, separate them with commas inside double quotes.

