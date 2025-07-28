# NiVi AI - Personal Life Management Suite

A comprehensive personal finance and life management application built with React, TypeScript, and Supabase.

## Features

- **Finance Management**: Budget allocation, expense tracking, EMI and debt management
- **Document Storage**: Secure document organization with categorization
- **Voice Diary**: Voice-to-text diary entries with mood tracking
- **Email Notifications**: Bank transaction alerts integration
- **UPI Payments**: QR code generation and scanning for payments

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your Supabase dashboard:
   - Go to **Settings > API**
   - Copy your **Project URL** and **anon/public key**
   - Go to **Authentication > Providers**
   - Enable **Google** provider
   - Add your Google OAuth credentials

### 2. Environment Configuration

1. Copy `.env.example` to `.env`
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Database Setup

The database schema will be automatically created when you run the migration. The system includes:

- **User Profiles**: Store user information
- **Finance Data**: Personal financial information (income, expenses, budgets)
- **Voice Diary**: Diary entries with voice-to-text
- **Documents**: Secure document storage
- **Notifications**: Email notification preferences

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase

### 5. Run the Application

```bash
npm install
npm run dev
```

## Security Features

- **Row Level Security (RLS)**: Each user can only access their own data
- **Authentication Required**: All routes are protected by authentication
- **Secure Data Storage**: All sensitive data is encrypted and stored securely
- **Google OAuth**: Secure authentication through Google

## Data Privacy

- All user data is stored securely in Supabase
- Each user has complete isolation from other users' data
- No data is shared between users
- Users can delete their account and all associated data

## Development

The application is built with:
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Supabase** for backend and authentication
- **Lucide React** for icons
- **React Router** for navigation

## Deployment

The application can be deployed to any static hosting service like Netlify, Vercel, or GitHub Pages.

Make sure to set the environment variables in your deployment platform.