import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, FileText, Mic, ArrowRight, LogIn, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const features = [
    {
      id: 'finance',
      title: 'Finance',
      description: 'Manage your budget, track expenses, EMIs, and debts with intelligent allocation',
      icon: Calculator,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
      path: '/finance'
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Store and organize important documents, bills, and receipts securely',
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
      path: '/documents'
    },
    {
      id: 'voice-diary',
      title: 'Voice Diary',
      description: 'Record daily events and thoughts using voice-to-text technology',
      icon: Mic,
      color: 'bg-gradient-to-br from-purple-500 to-violet-600',
      hoverColor: 'hover:from-purple-600 hover:to-violet-700',
      path: '/voice-diary'
    }
  ];

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Auth Status Bar */}
        {user && (
          <div className="flex justify-end mb-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {user.user_metadata?.full_name || user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                NiVi AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-light">
              Your Personal Life Management Suite
            </p>
          </div>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                onClick={() => handleFeatureClick(feature.path)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 md:hover:-translate-y-2"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-lg md:shadow-xl hover:shadow-xl md:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
                  {/* Icon Header */}
                  <div className={`${feature.color} ${feature.hoverColor} p-4 md:p-8 transition-all duration-300`}>
                    <div className="flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 md:p-4">
                        <Icon className="h-8 w-8 md:h-12 md:w-12 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 md:p-8">
                    <h3 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white mb-2 md:mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4 md:mb-6">
                      {feature.description}
                    </p>
                    
                    {/* Action Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                        Click to explore
                      </span>
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1.5 md:p-2 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                        <ArrowRight className="h-3 w-3 md:h-4 md:w-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="text-center">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white mb-2 md:mb-4">
              {user ? 'Welcome Back!' : 'Everything You Need in One Place'}
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {user 
                ? 'Your personal data is securely stored and accessible only to you. Click on any feature above to get started.'
                : 'NiVi AI combines intelligent financial management, secure document storage, and voice-enabled journaling to help you organize and optimize your daily life with cutting-edge AI assistance.'
              }
            </p>
            {!user && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/finance')}
                  className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};