# NiVi AI - Personal Life Management Suite

A comprehensive personal management application with Google authentication and secure user data storage.

## Features

- **Google Authentication**: Secure sign-in with Google OAuth
- **Finance Management**: Personal budget tracking with intelligent allocation
- **Document Storage**: Secure document organization and management
- **Voice Diary**: Voice-to-text diary entries with speech recognition
- **User Data Privacy**: Each user's data is completely isolated and secure

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
    urlValue: supabaseUrl === 'your_supabase_project_url' ? 'PLACEHOLDER_VALUE' : 'SET',
    keyValue: supabaseAnonKey === 'your_supabase_anon_key' ? 'PLACEHOLDER_VALUE' : 'SET'
  })
  throw new Error(`
    Missing or invalid Supabase environment variables.
    
    Please follow these steps:
    1. Go to https://supabase.com and create a new project
    2. In your project dashboard, go to Settings > API
    3. Copy your Project URL and anon/public key
    4. Update your .env file with the actual values:
       VITE_SUPABASE_URL=https://your-project-ref.supabase.co
       VITE_SUPABASE_ANON_KEY=your-actual-anon-key
    5. Restart your development server
  `)
