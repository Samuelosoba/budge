# Budge Backend API

A comprehensive REST API for the Budge budgeting application built with Node.js, Express, and MongoDB.

## Features

- **Authentication**: JWT-based authentication with secure password hashing
- **Transactions**: Full CRUD operations for income and expense tracking
- **Categories**: Customizable spending categories with budgets
- **Bank Accounts**: Multiple account management
- **AI Chat**: OpenAI-powered financial assistant
- **Analytics**: Financial insights and statistics
- **Security**: Rate limiting, CORS, and input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **AI**: OpenAI GPT-3.5-turbo

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repository and navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/budge
JWT_SECRET=your-super-secret-jwt-key-here
OPENAI_API_KEY=your-openai-api-key-here
PORT=3001
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Environment Variables

### Required Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing

### Optional Variables

- `OPENAI_API_KEY`: OpenAI API key for AI chat features
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:8081)

### Security Variables

- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window
- `BCRYPT_SALT_ROUNDS`: BCrypt salt rounds for password hashing

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

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  isPro: Boolean,
  monthlyBudget: Number,
  preferences: {
    currency: String,
    notifications: Boolean,
    theme: String
  }
}
```

### Transaction
```javascript
{
  user: ObjectId,
  amount: Number,
  description: String,
  category: ObjectId,
  type: 'income' | 'expense',
  date: Date,
  isRecurring: Boolean,
  bankAccount: ObjectId,
  tags: [String],
  notes: String
}
```

### Category
```javascript
{
  user: ObjectId,
  name: String,
  color: String (hex),
  type: 'income' | 'expense',
  budget: Number,
  icon: String,
  isDefault: Boolean
}
```

### Bank Account
```javascript
{
  user: ObjectId,
  name: String,
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan',
  balance: Number,
  currency: String,
  isConnected: Boolean,
  bankName: String
}
```

## Security Features

- **Password Hashing**: bcryptjs with configurable salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware

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
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
src/
├── models/          # Mongoose models
├── routes/          # Express route handlers
├── middleware/      # Custom middleware
├── utils/           # Utility functions
└── index.js         # Application entry point
```

### Health Check

Visit `http://localhost:3001/health` to check server status and configuration.

## Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secure-production-secret
OPENAI_API_KEY=sk-...
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details