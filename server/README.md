# Budge Backend API

A comprehensive REST API for the Budge budgeting application built with Node.js, Express, and MongoDB.

## 🚀 Vercel Deployment

This backend is optimized for deployment on Vercel's serverless platform.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/budge-backend)

### Manual Deployment Steps

1. **Fork/Clone this repository**

2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy to Vercel**:
   ```bash
   cd server
   vercel
   ```

5. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project in Vercel Dashboard
   - Navigate to Settings → Environment Variables
   - Add the required variables (see below)

### Required Environment Variables

Set these in your Vercel project dashboard:

```env
# Database (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/budge?retryWrites=true&w=majority

# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# OpenAI (Optional - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# CORS Configuration (Required)
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security (Optional)
BCRYPT_SALT_ROUNDS=12

# File Upload (Optional)
MAX_FILE_SIZE=10mb

# Plaid (Optional - for bank connections)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret-key
PLAID_ENV=sandbox
```

### MongoDB Setup

1. **Create MongoDB Atlas Account**: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)

2. **Create a Cluster**:
   - Choose a free tier cluster
   - Select a region close to your users
   - Create a database user with read/write permissions

3. **Get Connection String**:
   - Go to Database → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `budge`

4. **Whitelist IP Addresses**:
   - Go to Network Access
   - Add `0.0.0.0/0` to allow connections from anywhere (Vercel's IPs)

### Domain Configuration

After deployment, update your frontend's API URL to point to your Vercel deployment:

```javascript
// In your frontend app
const API_BASE_URL = "https://your-vercel-deployment.vercel.app/api";
```

## Features

- **Authentication**: JWT-based authentication with secure password hashing
- **Transactions**: Full CRUD operations for income and expense tracking
- **Categories**: Customizable spending categories with budgets
- **Bank Accounts**: Multiple account management
- **AI Chat**: OpenAI-powered financial assistant
- **Analytics**: Financial insights and statistics
- **Security**: Rate limiting, CORS, and input validation
- **Serverless**: Optimized for Vercel's serverless platform

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **AI**: OpenAI GPT-4
- **Deployment**: Vercel Serverless Functions

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/upgrade-pro` - Upgrade to Pro

### Transactions
- `GET /api/transactions` - Get user transactions (with pagination and filters)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Categories
- `GET /api/categories` - Get user categories
- `POST /api/categories` - Create new category
- `GET /api/categories/:id` - Get specific category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `GET /api/categories/:id/stats` - Get category statistics

### Bank Accounts
- `GET /api/bank-accounts` - Get user bank accounts
- `POST /api/bank-accounts` - Create new bank account
- `GET /api/bank-accounts/:id` - Get specific bank account
- `PUT /api/bank-accounts/:id` - Update bank account
- `DELETE /api/bank-accounts/:id` - Delete bank account (soft delete)

### AI Chat
- `POST /api/ai-chat/chat` - Chat with AI assistant
- `GET /api/ai-chat/insights` - Get financial insights

### Budget
- `GET /api/budget` - Get budget settings
- `PUT /api/budget/monthly` - Update monthly budget
- `PUT /api/budget/preferences` - Update user preferences

### Health Check
- `GET /api/health` - Server health and status

## Local Development

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables** in `.env`

5. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Security Features

- **Password Hashing**: bcryptjs with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse (100 requests per 15 minutes)
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **Environment Variables**: Secure configuration management

## Error Handling

The API uses consistent error response format:

```javascript
{
  error: "Error message",
  details: ["Detailed error information"] // Optional
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (CORS)
- `404` - Not Found
- `500` - Internal Server Error

## Monitoring

- **Health Check**: Visit `/api/health` to check server status
- **Vercel Analytics**: Built-in monitoring in Vercel dashboard
- **MongoDB Atlas Monitoring**: Database performance metrics

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `FRONTEND_URL` environment variable is set correctly
   - Check that your frontend domain is in the allowed origins list

2. **Database Connection Issues**:
   - Verify MongoDB connection string is correct
   - Ensure database user has proper permissions
   - Check that IP whitelist includes `0.0.0.0/0`

3. **Environment Variables Not Loading**:
   - Verify variables are set in Vercel dashboard
   - Redeploy after adding new environment variables

4. **Rate Limiting Issues**:
   - Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
   - Consider implementing user-specific rate limiting

### Logs

View logs in Vercel Dashboard:
1. Go to your project
2. Click on "Functions" tab
3. Click on any function execution to view logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@budge.app or create an issue in the repository.