import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Calculator, FileText, Mic, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        });
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

        {/* Login/Register Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {isLogin ? 'Sign in to access your dashboard' : 'Join NiVi AI to get started'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({ email: '', password: '', fullName: '' });
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Privacy Notice */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy.
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
  );
};