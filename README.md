# IMS - Inventory Management System

A full-stack MERN (MongoDB, Express, React, Node.js) application with animated frontend.

## Features

- 🔐 JWT Authentication
- 📦 Product Management
- 📁 Category Management
- 🚚 Supplier Management
- 👥 User Management
- ✨ Animated UI with Framer Motion
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing

### Frontend
- React 18
- Vite
- Framer Motion (animations)
- Tailwind CSS
- React Router v6
- Axios

## Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Backend Setup

```bash
cd server
npm install
```

Create `.env` file (or copy from `server/.env.example`):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ims
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Optional: email notifications
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_app_password
EMAIL_FROM="IMS Notifications <your_email@example.com>"

# Optional: SMS notifications (Twilio)
SMS_NOTIFICATIONS_ENABLED=true
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional low-stock threshold for alerts
LOW_STOCK_THRESHOLD=20
```

Seed admin user:
```bash
node seed.js
```

Start server:
```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend environment variables:
```
VITE_API_URL=http://localhost:5000/api
VITE_PROXY_TARGET=http://localhost:5000
```

## Default Credentials

- Email: admin@gmail.com
- Password: admin

## API Endpoints

### Auth
- POST `/api/auth/login` - Login

### Products
- GET `/api/products` - Get all products
- POST `/api/products/add` - Add product
- PUT `/api/products/:id` - Update product
- DELETE `/api/products/:id` - Delete product

### Categories
- GET `/api/categories` - Get all categories
- POST `/api/categories/add` - Add category
- PUT `/api/categories/:id` - Update category
- DELETE `/api/categories/:id` - Delete category

### Suppliers
- GET `/api/suppliers` - Get all suppliers
- POST `/api/suppliers/add` - Add supplier
- PUT `/api/suppliers/:id` - Update supplier
- DELETE `/api/suppliers/:id` - Delete supplier

### Users
- GET `/api/users` - Get all users
- POST `/api/users/add` - Add user
- GET `/api/users/me` - Get my profile
- PUT `/api/users/me` - Update my profile
- DELETE `/api/users/:id` - Delete user

## Deployment

### Recommended Setup
- Frontend: Vercel
- Backend API: Render or Railway
- Database: MongoDB Atlas

### Frontend on Vercel
1. Import the `frontend` folder as a Vercel project.
2. Set `VITE_API_URL` to your hosted backend API URL, for example `https://your-api.onrender.com/api`.
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend on Render or Railway
1. Deploy the `server` folder as a Node.js service.
2. Start command: `npm start`
3. Set these environment variables:
	- `MONGODB_URI`
	- `JWT_SECRET`
	- `NODE_ENV=production`
	- `ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app`
4. Add SMTP and Twilio variables only if you want live notifications enabled.

### Important Note
This project is prepared for a Vercel frontend with a separately hosted backend API. The current backend is not packaged as a Vercel serverless function.

## License

MIT
