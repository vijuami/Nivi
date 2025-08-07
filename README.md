# NiVi AI - Personal Life Management Suite

A comprehensive personal finance and life management application built with React (JavaScript), Node.js, Express, and MongoDB.

## Features

- **Finance Management**: Budget allocation, expense tracking, EMI and debt management
- **Document Storage**: Secure document organization with categorization
- **Voice Diary**: Voice-to-text diary entries with mood tracking
- **User Authentication**: Secure login and registration system
- **UPI Payments**: QR code generation and scanning for payments

## Tech Stack

### Frontend
- React 18 (JavaScript)
- Tailwind CSS for styling
- Lucide React for icons
- React Router for navigation
- Vite for development and building

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Setup Instructions

### 1. Prerequisites

Make sure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd nivi-ai-finance-manager

# Install dependencies
npm install
```

### 3. Environment Configuration

1. Copy `.env.example` to `.env`
2. Update the environment variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nivi-ai
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nivi-ai

# JWT Secret (generate a secure random string)
JWT_SECRET=your_secure_jwt_secret_here

# API Configuration
VITE_API_URL=http://localhost:5000/api
```

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will automatically create the database and collections

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

### 5. Run the Application

#### Development Mode (Full Stack)
```bash
# Run both frontend and backend
npm run dev:full
```

#### Or run separately:
```bash
# Terminal 1: Run backend server
npm run server

# Terminal 2: Run frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

```
├── server/                 # Backend code
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── index.js          # Server entry point
├── src/                   # Frontend code
│   ├── components/        # React components
│   ├── contexts/         # React contexts
│   ├── lib/              # API client
│   ├── types/            # Type definitions (converted to JS)
│   └── utils/            # Utility functions
└── public/               # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Finance
- `GET /api/finance` - Get user's finance data
- `PUT /api/finance` - Update finance data

### Documents
- `GET /api/documents` - Get user's documents
- `PUT /api/documents` - Update documents

### Voice Diary
- `GET /api/voice-diary` - Get diary entries
- `PUT /api/voice-diary` - Update diary entries

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Passwords are hashed using bcryptjs
- **User Data Isolation**: Each user can only access their own data
- **CORS Protection**: Configured for secure cross-origin requests

## Data Privacy

- All user data is stored securely in MongoDB
- Each user has complete isolation from other users' data
- Passwords are never stored in plain text
- JWT tokens expire after 7 days for security

## Development

### Adding New Features
1. Create new API routes in `server/routes/`
2. Add corresponding frontend components in `src/components/`
3. Update the API client in `src/lib/api.js`

### Database Models
- User authentication: `server/models/User.js`
- Finance data: `server/models/FinanceData.js`
- Documents: `server/models/Documents.js`
- Voice diary: `server/models/VoiceDiary.js`

## Deployment

### Frontend (Netlify/Vercel)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Set environment variables in your hosting platform

### Backend (Heroku/Railway/DigitalOcean)
1. Deploy the server code to your hosting service
2. Set environment variables (MongoDB URI, JWT secret)
3. Ensure MongoDB is accessible from your hosting platform

### Environment Variables for Production
- `MONGODB_URI`: Your production MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `PORT`: Port for the server (usually set by hosting platform)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.