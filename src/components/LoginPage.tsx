import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Calculator, FileText, Mic, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Sign in error:', error)
      setError(error.message || 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-md mx-auto px-6 py-12 flex flex-col justify-center min-h-screen">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                NiVi AI
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
              Your Personal Life Management Suite
            </p>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-8"></div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center">
            <div className="bg-green-500 p-3 rounded-lg mx-auto w-fit mb-2">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Finance</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-500 p-3 rounded-lg mx-auto w-fit mb-2">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Documents</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-500 p-3 rounded-lg mx-auto w-fit mb-2">
              <Mic className="h-6 w-6 text-white" />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Voice Diary</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to access your personal dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="text-gray-700 dark:text-gray-200 font-medium">
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your data is encrypted and secure.
          </p>
        </div>

        {/* Features Description */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            What you'll get access to:
          </p>
          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p>• Personal finance management with intelligent budgeting</p>
            <p>• Secure document storage and organization</p>
            <p>• Voice-enabled diary with speech-to-text</p>
            <p>• All your data is private and encrypted</p>
          </div>
        </div>
      </div>
    </div>
  )
}