# 🛒 E-Commerce REST API

A production-grade, full-featured E-Commerce REST API built with **Node.js**, **Express.js**, and **MongoDB** following **Monolithic Architecture** with clean code principles, class-based services, and enterprise-level patterns.

---

## 📁 Folder Structure

```
ecommerce-app/
├── server.js                        # Entry point
├── package.json
├── .env.example                     # Environment variables template
├── .gitignore
├── uploads/                         # Uploaded images (auto-created)
├── logs/                            # Application logs (auto-created)
│   ├── error.log
│   ├── combined.log
│   └── exceptions.log
└── src/
    ├── app.js                       # Express Application class
    ├── config/
    │   └── database.js              # MongoDB connection (Database class)
    ├── controllers/                 # Route handlers (Class-based)
    │   ├── auth.controller.js
    │   ├── user.controller.js
    │   ├── product.controller.js
    │   ├── category.controller.js
    │   ├── cart.controller.js
    │   ├── order.controller.js
    │   ├── review.controller.js
    │   ├── payment.controller.js
    │   └── admin.controller.js
    ├── middlewares/
    │   ├── auth.middleware.js       # JWT authentication & role authorization
    │   ├── upload.middleware.js     # Multer file uploads (UploadMiddleware class)
    │   └── errorHandler.js         # Global error handler
    ├── models/                      # Mongoose schemas with methods & virtuals
    │   ├── User.model.js
    │   ├── Product.model.js
    │   ├── Category.model.js
    │   ├── Cart.model.js
    │   ├── Order.model.js
    │   └── Review.model.js
    ├── routes/                      # Express routers with validation
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── product.routes.js
    │   ├── category.routes.js
    │   ├── cart.routes.js
    │   ├── order.routes.js
    │   ├── review.routes.js
    │   ├── payment.routes.js
    │   └── admin.routes.js
    ├── services/                    # Business logic layer (Singleton classes)
    │   ├── auth.service.js
    │   ├── product.service.js
    │   ├── cart.service.js
    │   ├── order.service.js
    │   └── payment.service.js
    └── utils/
        ├── apiResponse.js           # ApiResponse & AppError classes
        └── logger.js                # Winston logger
```

---

## 🏗️ Architecture

This project uses **Monolithic Architecture** with clear internal separation of concerns:

```
Request → Route (Validation) → Middleware (Auth) → Controller → Service → Model → DB
                                                        ↓
                                                   ApiResponse
```

**Key design patterns used:**
- **Class-based Controllers & Services** — encapsulated, reusable, testable
- **Singleton Services** — single instance per service across the app
- **Repository-like Model layer** — Mongoose with virtual fields, instance methods, hooks
- **Centralized error handling** — `AppError` class + global error middleware
- **Layered architecture** — Routes → Controllers → Services → Models

---

## 🚀 Features

| Feature | Details |
|---|---|
| **Authentication** | JWT Access + Refresh Tokens, bcrypt password hashing |
| **Authorization** | Role-based (customer, admin, superadmin) |
| **Products** | CRUD, full-text search, filters, pagination, variants, stock |
| **Categories** | Nested categories (parent-child), slugs |
| **Cart** | Add, update, remove, clear; stock validation |
| **Orders** | Full lifecycle: pending → confirmed → processing → shipped → delivered |
| **Reviews** | Ratings, verified purchase badge, helpful votes, auto-updates product rating |
| **Payments** | Stripe Payment Intents, webhooks, refunds |
| **User Management** | Profile, avatar, multiple addresses, wishlist |
| **Admin Dashboard** | Revenue stats, top products, sales analytics |
| **File Uploads** | Multer with UUID filenames; images for products/categories/reviews/avatars |
| **Security** | Helmet, CORS, Rate limiting, input validation |
| **Logging** | Winston (console + file), Morgan HTTP logger |

---

## ⚙️ Installation

### Prerequisites

- **Node.js** v16+
- **MongoDB** v5+ (local or [MongoDB Atlas](https://cloud.mongodb.com))
- **npm** v8+
- **Postman** (for API testing)

### Step 1 — Clone / Extract the project

```bash
# If you downloaded the zip:
unzip ecommerce-app.zip
cd ecommerce-app
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce_db
JWT_SECRET=your_strong_secret_here_at_least_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=another_strong_secret_here
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
MAX_FILE_SIZE=5000000
```

> **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster.mongodb.net/ecommerce_db`

### Step 4 — Run the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB connected: localhost
🚀 Server running on port 5000 in development mode
```

### Step 5 — Verify the server is running

```bash
curl http://localhost:5000/health
# {"success":true,"message":"Server is healthy","timestamp":"..."}
```

---

## 📋 All API Routes

**Base URL:** `http://localhost:5000/api/v1`

### 🔐 Auth Routes `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register a new user |
| POST | `/login` | ❌ | Login and get tokens |
| POST | `/refresh-token` | ❌ | Refresh access token |
| POST | `/logout` | ✅ | Logout (invalidate refresh token) |
| POST | `/change-password` | ✅ | Change own password |
| GET | `/me` | ✅ | Get current user profile |

---

### 👤 User Routes `/api/v1/users`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/profile` | ✅ | Any | Get own profile |
| PUT | `/profile` | ✅ | Any | Update profile + avatar upload |
| GET | `/wishlist` | ✅ | Any | Get wishlist |
| POST | `/wishlist` | ✅ | Any | Toggle product in wishlist |
| POST | `/addresses` | ✅ | Any | Add shipping address |
| PUT | `/addresses/:addressId` | ✅ | Any | Update an address |
| DELETE | `/addresses/:addressId` | ✅ | Any | Delete an address |
| GET | `/` | ✅ | Admin | List all users (paginated) |
| PATCH | `/:id/block` | ✅ | Admin | Block/unblock a user |

---

### 📦 Product Routes `/api/v1/products`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ❌ | — | List products (search, filter, paginate) |
| GET | `/featured` | ❌ | — | Get featured products |
| GET | `/slug/:slug` | ❌ | — | Get product by slug |
| GET | `/:id` | ❌ | — | Get product by ID |
| POST | `/` | ✅ | Admin | Create product (with image upload) |
| PUT | `/:id` | ✅ | Admin | Update product |
| DELETE | `/:id` | ✅ | Admin | Soft-delete product |

**Query Parameters for `GET /products`:**
```
?page=1&limit=12&sort=-createdAt
&category=<categoryId>
&brand=Nike
&minPrice=10&maxPrice=200
&search=running shoes
&featured=true
&inStock=true
```

---

### 🗂️ Category Routes `/api/v1/categories`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ❌ | — | List all categories (with children) |
| GET | `/:slug` | ❌ | — | Get category by slug |
| POST | `/` | ✅ | Admin | Create category |
| PUT | `/:id` | ✅ | Admin | Update category |
| DELETE | `/:id` | ✅ | Admin | Soft-delete category |

---

### 🛒 Cart Routes `/api/v1/cart`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get user cart |
| POST | `/add` | ✅ | Add item to cart |
| PUT | `/items/:itemId` | ✅ | Update item quantity |
| DELETE | `/items/:itemId` | ✅ | Remove item from cart |
| DELETE | `/` | ✅ | Clear entire cart |

---

### 📋 Order Routes `/api/v1/orders`

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | ✅ | Any | Place a new order |
| GET | `/my-orders` | ✅ | Any | Get own orders (paginated) |
| GET | `/my-orders/:id` | ✅ | Any | Get own order detail |
| PUT | `/my-orders/:id/cancel` | ✅ | Any | Cancel own order |
| GET | `/` | ✅ | Admin | List all orders |
| PUT | `/:id/status` | ✅ | Admin | Update order status |

**Order Status Flow:**
```
pending → confirmed → processing → shipped → delivered
                  ↘ cancelled
```

---

### ⭐ Review Routes `/api/v1/reviews`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/product/:productId` | ❌ | Get reviews for a product |
| POST | `/` | ✅ | Create a review (with image upload) |
| PUT | `/:id` | ✅ | Update own review |
| DELETE | `/:id` | ✅ | Delete own review |
| POST | `/:id/helpful` | ✅ | Toggle helpful vote |

---

### 💳 Payment Routes `/api/v1/payments`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/webhook` | ❌ | Stripe webhook (raw body) |
| POST | `/create-intent` | ✅ | Create Stripe Payment Intent |
| POST | `/confirm` | ✅ | Confirm payment after Stripe JS |
| POST | `/refund` | ✅ Admin | Refund a paid order |

---

### 🛠️ Admin Routes `/api/v1/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard` | ✅ Admin | Revenue stats, recent orders, top products |
| GET | `/analytics/sales` | ✅ Admin | Monthly sales analytics by year |

---

## 🧪 Testing with Postman

### Step 1 — Import the collection

1. Open **Postman**
2. Click **Import** → **Raw Text**
3. Paste the JSON below or use the **manual setup** steps

### Step 2 — Set up Postman Environment

Create a new environment called **E-Commerce API** with these variables:

| Variable | Initial Value |
|----------|--------------|
| `baseUrl` | `http://localhost:5000/api/v1` |
| `accessToken` | *(leave blank — auto-filled on login)* |
| `refreshToken` | *(leave blank — auto-filled on login)* |
| `productId` | *(fill after creating a product)* |
| `categoryId` | *(fill after creating a category)* |
| `orderId` | *(fill after placing an order)* |
| `cartItemId` | *(fill after adding to cart)* |

### Step 3 — Auto-capture token on Login

In your **Login** request, add this to the **Tests** tab:

```javascript
const res = pm.response.json();
if (res.success) {
  pm.environment.set("accessToken", res.data.accessToken);
  pm.environment.set("refreshToken", res.data.refreshToken);
}
```

### Step 4 — Set Authorization header

For all authenticated requests, set:
- **Type:** `Bearer Token`
- **Token:** `{{accessToken}}`

---

### 📬 Sample Request Bodies

#### Register
```json
POST {{baseUrl}}/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

#### Login
```json
POST {{baseUrl}}/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Create Category (Admin)
```json
POST {{baseUrl}}/categories
Authorization: Bearer {{accessToken}}
{
  "name": "Electronics",
  "description": "Electronic gadgets and devices"
}
```

#### Create Product (Admin)
```json
POST {{baseUrl}}/products
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

name: iPhone 15 Pro
description: Latest Apple flagship smartphone
price: 999.99
discountPrice: 949.99
category: {{categoryId}}
brand: Apple
stock: 50
isFeatured: true
tags: apple, smartphone, iphone
```
> **Note:** For image uploads, use **form-data** and add a key `images` (file type) in Postman.

#### Add to Cart
```json
POST {{baseUrl}}/cart/add
Authorization: Bearer {{accessToken}}
{
  "productId": "{{productId}}",
  "quantity": 2
}
```

#### Place Order
```json
POST {{baseUrl}}/orders
Authorization: Bearer {{accessToken}}
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "zipCode": "10001"
  },
  "paymentMethod": "stripe",
  "notes": "Please ring the doorbell"
}
```

#### Create Payment Intent
```json
POST {{baseUrl}}/payments/create-intent
Authorization: Bearer {{accessToken}}
{
  "orderId": "{{orderId}}"
}
```

#### Create Review
```json
POST {{baseUrl}}/reviews
Authorization: Bearer {{accessToken}}
{
  "productId": "{{productId}}",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Really happy with this purchase. Fast delivery and great quality."
}
```

---

## 🔑 Creating an Admin User

After registering a user, update their role directly in MongoDB:

```bash
# Using mongosh
mongosh ecommerce_db
db.users.updateOne({ email: "john@example.com" }, { $set: { role: "admin" } })
```

Or via **MongoDB Compass** → find the user → change `role` to `"admin"`.

---

## 🛡️ Security Features

- **Helmet** — Sets secure HTTP headers
- **CORS** — Configurable origin whitelist
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **JWT** — Short-lived access tokens (7d) + refresh tokens (30d)
- **bcrypt** — Password hashing with salt rounds = 12
- **Input Validation** — `express-validator` on all routes
- **Role Authorization** — Middleware-level access control

---

## 📊 Response Format

All API responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Paginated:**
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 12,
    "pages": 9
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js v18+ |
| Framework | Express.js 4.x |
| Database | MongoDB + Mongoose 7.x |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcryptjs |
| File Uploads | Multer |
| Payments | Stripe |
| Validation | express-validator |
| Logging | Winston + Morgan |
| Security | Helmet, CORS, express-rate-limit |

---

## 🤝 Contributing

1. Fork the project
2. Create a feature branch: `git checkout -b feature/awesome-feature`
3. Commit changes: `git commit -m 'Add awesome feature'`
4. Push to branch: `git push origin feature/awesome-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.
