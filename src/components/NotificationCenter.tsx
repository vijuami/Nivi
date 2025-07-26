import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Settings, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Filter,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus
} from 'lucide-react';
import { EmailNotification, NotificationSettings, BankTransaction } from '../types/notifications';
import { parseTransactionFromEmail, categorizeTransaction } from '../utils/emailParser';

interface NotificationCenterProps {
  notifications: EmailNotification[];
  settings: NotificationSettings;
  isConnected: boolean;
  onSettingsUpdate: (settings: NotificationSettings) => void;
  onNotificationProcess: (notificationId: string, action: 'accept' | 'ignore') => void;
  onTransactionAdd: (transaction: BankTransaction) => void;
  onEmailAdd: (email: string, provider: string) => void;
  onEmailRemove: (emailId: string) => void;
  onSync: () => void;
  lastSync: Date | null;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  settings,
  isConnected,
  onSettingsUpdate,
  onNotificationProcess,
  onTransactionAdd,
  onEmailAdd,
  onEmailRemove,
  onSync,
  lastSync
}) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'transactions' | 'processed'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailProvider, setNewEmailProvider] = useState<'gmail' | 'outlook' | 'yahoo' | 'other'>('gmail');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredNotifications = notifications.filter(notification => {
    switch (filterType) {
      case 'unread':
        return !notification.isRead;
      case 'transactions':
        return notification.isBankTransaction;
      case 'processed':
        return notification.processingStatus === 'processed';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const transactionCount = notifications.filter(n => n.isBankTransaction).length;

  const handleProcessNotification = async (notificationId: string, action: 'accept' | 'ignore') => {
    setIsProcessing(notificationId);
    
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (action === 'accept' && notification.extractedTransaction) {
        // Add transaction to finance manager
        const categorizedTransaction = {
          ...notification.extractedTransaction,
          category: categorizeTransaction(notification.extractedTransaction)
        };
        onTransactionAdd(categorizedTransaction);
      }

      onNotificationProcess(notificationId, action);
    } catch (error) {
      console.error('Error processing notification:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail.trim() && validateEmail(newEmail)) {
      onEmailAdd(newEmail.trim(), newEmailProvider);
      setNewEmail('');
      setNewEmailProvider('gmail');
      setShowAddEmail(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRemoveEmail = (emailId: string) => {
    if (window.confirm('Are you sure you want to remove this email account? This will stop monitoring transactions from this account.')) {
      onEmailRemove(emailId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Email Notifications
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Bank transaction alerts from your email
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            {/* Sync Button */}
            <button
              onClick={onSync}
              disabled={!isConnected}
              className="p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
              title="Sync emails"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Unread</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{transactionCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Transactions</div>
          </div>
        </div>

        {lastSync && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Last sync: {lastSync.toLocaleString()}
          </div>
        )}
      </div>

      {/* Email Management */}
      {(!isConnected || settings.connectedEmails.length === 0) && (
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            Add Email Account
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Add your email accounts to automatically detect and process bank transaction notifications.
          </p>
          <button
            onClick={() => setShowAddEmail(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Email Account
          </button>
        </div>
      )}

      {/* Connected Email Accounts */}
      {settings.connectedEmails.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              Connected Email Accounts
            </h3>
            <button
              onClick={() => setShowAddEmail(true)}
              className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Add Email</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {settings.connectedEmails.map(emailAccount => (
              <div key={emailAccount.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${emailAccount.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{emailAccount.email}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {emailAccount.provider.charAt(0).toUpperCase() + emailAccount.provider.slice(1)} • 
                      {emailAccount.isConnected ? ' Connected' : ' Disconnected'}
                      {emailAccount.lastSync && ` • Last sync: ${emailAccount.lastSync.toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveEmail(emailAccount.id)}
                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                  title="Remove email account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Email Modal */}
      {showAddEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Add Email Account</h2>
                <button
                  onClick={() => setShowAddEmail(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Provider
                  </label>
                  <select
                    value={newEmailProvider}
                    onChange={(e) => setNewEmailProvider(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="outlook">Outlook</option>
                    <option value="yahoo">Yahoo</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    <strong>Note:</strong> This is a demo feature. In a real application, this would require OAuth integration with email providers and secure backend processing.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={!newEmail.trim() || !validateEmail(newEmail)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Email Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEmail(false);
                      setNewEmail('');
                      setNewEmailProvider('gmail');
                    }}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
            Notification Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-process transactions
              </label>
              <input
                type="checkbox"
                checked={settings.autoProcessTransactions}
                onChange={(e) => onSettingsUpdate({
                  ...settings,
                  autoProcessTransactions: e.target.checked
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show popup notifications
              </label>
              <input
                type="checkbox"
                checked={settings.notificationPreferences.showPopups}
                onChange={(e) => onSettingsUpdate({
                  ...settings,
                  notificationPreferences: {
                    ...settings.notificationPreferences,
                    showPopups: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Play notification sound
              </label>
              <input
                type="checkbox"
                checked={settings.notificationPreferences.playSound}
                onChange={(e) => onSettingsUpdate({
                  ...settings,
                  notificationPreferences: {
                    ...settings.notificationPreferences,
                    playSound: e.target.checked
                  }
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'transactions', label: 'Transactions', count: transactionCount },
            { id: 'processed', label: 'Processed', count: notifications.filter(n => n.processingStatus === 'processed').length }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id as any)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                filterType === filter.id
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{filter.label}</span>
              <span className="bg-white dark:bg-gray-800 px-1 rounded-full text-xs">
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              No Notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {isConnected 
                ? "No email notifications found. Try syncing your emails."
                : "Connect your email account to start receiving notifications."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {notification.isBankTransaction ? (
                      <CreditCard className="h-4 w-4 text-green-500" />
                    ) : (
                      <Mail className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {notification.sender}
                    </span>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(notification.processingStatus)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notification.receivedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                  {notification.subject}
                </h4>

                {/* Transaction Details */}
                {notification.extractedTransaction && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {notification.extractedTransaction.transactionType === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          {notification.extractedTransaction.transactionType === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        notification.extractedTransaction.transactionType === 'credit' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatAmount(notification.extractedTransaction.amount)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <div>Bank: {notification.extractedTransaction.bankName}</div>
                      <div>Account: ***{notification.extractedTransaction.accountNumber.slice(-4)}</div>
                      <div>Description: {notification.extractedTransaction.description}</div>
                      {notification.extractedTransaction.balance > 0 && (
                        <div>Balance: {formatAmount(notification.extractedTransaction.balance)}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {notification.isBankTransaction && notification.processingStatus === 'pending' && (
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      onClick={() => handleProcessNotification(notification.id, 'accept')}
                      disabled={isProcessing === notification.id}
                      className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      <span>Add to Budget</span>
                    </button>
                    <button
                      onClick={() => handleProcessNotification(notification.id, 'ignore')}
                      disabled={isProcessing === notification.id}
                      className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      <span>Ignore</span>
                    </button>
                  </div>
                )}

                {notification.processingStatus === 'processed' && (
                  <div className="flex items-center space-x-1 text-green-600 text-sm mt-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Added to budget</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};