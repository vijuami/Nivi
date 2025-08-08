@@ .. @@
 import React, { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '../contexts/AuthContext';
+import { apiClient } from '../lib/api';
 import { IncomeInput } from './IncomeInput';
 import { CategoryCard } from './CategoryCard';
 import { EMITracker } from './EMITracker';
 import { DebtTracker } from './DebtTracker';
 import { TransactionHistory } from './TransactionHistory';
 import { UpiPaymentFormModal } from './UpiPaymentFormModal';
-import { NotificationCenter } from './NotificationCenter';
-import { FinanceState, MainCategory, EMI, Debt, Expense, IncomeTransaction } from '../types/finance';
-import { EmailNotification, NotificationSettings, NotificationState, BankTransaction } from '../types/notifications';
-import { parseTransactionFromEmail, categorizeTransaction } from '../utils/emailParser';
+// import { NotificationCenter } from './NotificationCenter';
 import { 
   MAIN_CATEGORIES, 
   DEFAULT_SUBCATEGORIES, 
   calculateCategoryAllocation,
   redistributeSubcategories,
   generateId
 } from '../utils/financeCalculations';
 import { TrendingUp, Target, CreditCard, Receipt, Sun, Moon, ArrowLeft } from 'lucide-react';
 import { Send, Home, Bell, LogOut } from 'lucide-react';
-import { 
-  saveUserFinanceData, 
-  loadUserFinanceData,
-  saveUserNotificationState,
-  loadUserNotificationState
-} from '../utils/supabaseStorage';

 export const FinanceManagerApp = () => {
   const navigate = useNavigate();
   const { user, signOut } = useAuth();
   
   // Initialize state with data from localStorage
-  const defaultFinanceState = {
+  const defaultFinanceState = {
     income: 0,
     incomeTransactions: [],
     categories: [],
     emis: [],
     debts: [],
     transactions: []
   };
   
   const [financeState, setFinanceState] = useState(defaultFinanceState);
   const [isStateLoaded, setIsStateLoaded] = useState(false);

   const [activeTab, setActiveTab] = useState('budget');
-  const [showNotifications, setShowNotifications] = useState(false);
+  // const [showNotifications, setShowNotifications] = useState(false);
   const [showDebtReminderBlink, setShowDebtReminderBlink] = useState(false);
   const [isDarkMode, setIsDarkMode] = useState(false);
   const [showUpiPaymentForm, setShowUpiPaymentForm] = useState(false);
   
-  // Notification state - define defaultNotificationState before using it
-  const defaultNotificationState = {
-    notifications: [],
-    settings: {
-      emailIntegrationEnabled: false,
-      autoProcessTransactions: false,
-      supportedBanks: ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK'],
-      connectedEmails: [],
-      emailFilters: {
-        senders: ['alerts@sbi.co.in', 'alerts@hdfcbank.net', 'alerts@icicibank.com'],
-        keywords: ['debited', 'credited', 'transaction', 'balance'],
-        subjects: ['Transaction Alert', 'Account Statement', 'Payment Notification']
-      },
-      notificationPreferences: {
-        showPopups: true,
-        playSound: false,
-        markAsRead: true
-      }
-    },
-    isConnected: false,
-    lastSync: null,
-    unreadCount: 0
-  };
-  
-  const [notificationState, setNotificationState] = useState(defaultNotificationState);
-  const [isNotificationStateLoaded, setIsNotificationStateLoaded] = useState(false);
+  // Load data from API on component mount
+  useEffect(() => {
+    const loadUserData = async () => {
+      if (!user) return;

-  // Load data from localStorage on component mount
-  useEffect(() => {
-    const loadUserData = async () => {
-      if (!user) return;
-
-      try {
-        const loadedState = await loadUserFinanceData(user.id, defaultFinanceState);
-        const loadedNotificationState = await loadUserNotificationState(user.id, defaultNotificationState);
-        
-        // If no categories exist, initialize empty categories for display
-        if (loadedState.categories.length === 0) {
-          loadedState.categories = initializeEmptyCategories();
-        }
-        
-        setFinanceState(loadedState);
-        setNotificationState(loadedNotificationState);
-        setIsStateLoaded(true);
-        setIsNotificationStateLoaded(true);
-      } catch (error) {
-        console.error('Error loading user data:', error);
-        // Fallback to default states
-        setFinanceState({ ...defaultFinanceState, categories: initializeEmptyCategories() });
-        setNotificationState(defaultNotificationState);
-        setIsStateLoaded(true);
-        setIsNotificationStateLoaded(true);
-      }
-    }
+      try {
+        const loadedState = await apiClient.getFinanceData();
+        
+        // If no categories exist, initialize empty categories for display
+        if (!loadedState.categories || loadedState.categories.length === 0) {
+          loadedState.categories = initializeEmptyCategories();
+        }
+        
+        setFinanceState(loadedState);
+        setIsStateLoaded(true);
+      } catch (error) {
+        console.error('Error loading user data:', error);
+        // Fallback to default states
+        setFinanceState({ ...defaultFinanceState, categories: initializeEmptyCategories() });
+        setIsStateLoaded(true);
+      }
+    };

     loadUserData();
   }, [user]);

-  // Save data to database whenever financeState changes (but only after initial load)
+  // Save data to API whenever financeState changes (but only after initial load)
   useEffect(() => {
     if (isStateLoaded && user) {
-      saveUserFinanceData(user.id, financeState);
+      const saveData = async () => {
+        try {
+          await apiClient.updateFinanceData(financeState);
+        } catch (error) {
+          console.error('Error saving finance data:', error);
+        }
+      };
+      saveData();
     }
   }, [financeState, isStateLoaded, user]);

-  // Save notification state to database whenever it changes (but only after initial load)
-  useEffect(() => {
-    if (isNotificationStateLoaded && user) {
-      saveUserNotificationState(user.id, notificationState);
-    }
-  }, [notificationState, isNotificationStateLoaded, user]);
-
   // Initialize dark mode from localStorage
   useEffect(() => {
     const savedTheme = localStorage.getItem('theme');
@@ -218,7 +178,7 @@ export const FinanceManagerApp = () => {
   const tabs = [
     { id: 'budget', name: 'Budget Overview', icon: TrendingUp },
     { id: 'emi', name: 'EMI Tracker', icon: CreditCard },
-    { id: 'debt', name: 'Debt Tracker', icon: Target },
+    { id: 'debt', name: 'Debt Tracker', icon: Target },
     { id: 'transactions', name: 'Transactions', icon: Receipt }
   ];

@@ .. @@
               
               {/* Notifications Button */}
-              <button
-                onClick={() => setShowNotifications(!showNotifications)}
-                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
-                title="Email Notifications"
-              >
-                <Bell className="h-5 w-5" />
-                {unreadNotificationCount > 0 && (
-                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
-                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
-                  </span>
-                )}
-              </button>
+              {/* <button
+                onClick={() => setShowNotifications(!showNotifications)}
+                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
+                title="Email Notifications"
+              >
+                <Bell className="h-5 w-5" />
+              </button> */}
               
               {/* UPI Payment Button */}
               <button
@@ -290,16 +250,6 @@ export const FinanceManagerApp = () => {
           onIncomeDelete={handleIncomeDelete}
         />

-        {/* Notification Center */}
-        {showNotifications && (
-          <div className="mb-6">
-            <NotificationCenter
-              notifications={notificationState.notifications}
-              settings={notificationState.settings}
-              isConnected={notificationState.isConnected}
-              lastSync={notificationState.lastSync}
-              onSettingsUpdate={handleNotificationSettingsUpdate}
-              onNotificationProcess={handleNotificationProcess}
-              onTransactionAdd={handleTransactionFromNotification}
-              onEmailAdd={handleEmailAdd}
-              onEmailRemove={handleEmailRemove}
-              onSync={handleEmailSync}
-            />
-          </div>
-        )}
-
         {/* Navigation Tabs */}
         <div className="mb-6">
           <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
@@ -1000,60 +950,6 @@ export const FinanceManagerApp = () => {
     }));
   };

-  // Notification handlers
-  const handleEmailAdd = (email, provider) => {
-    const newEmailAccount = {
-      id: generateId(),
-      email,
-      provider,
-      isConnected: true,
-      connectedAt: new Date(),
-      lastSync: new Date(),
-      displayName: email.split('@')[0]
-    };
-
-    setNotificationState(prev => ({
-      ...prev,
-      isConnected: true,
-      settings: {
-        ...prev.settings,
-        emailIntegrationEnabled: true,
-        connectedEmails: [...prev.settings.connectedEmails, newEmailAccount]
-      }
-    }));
-  };
-
-  const handleEmailRemove = (emailId) => {
-    setNotificationState(prev => {
-      const updatedEmails = prev.settings.connectedEmails.filter(email => email.id !== emailId);
-      return {
-        ...prev,
-        isConnected: updatedEmails.length > 0,
-        settings: {
-          ...prev.settings,
-          connectedEmails: updatedEmails,
-          emailIntegrationEnabled: updatedEmails.length > 0
-        }
-      };
-    });
-  };
-
-  const handleEmailSync = () => {
-    // Simulate email sync
-    setNotificationState(prev => ({
-      ...prev,
-      lastSync: new Date()
-    }));
-  };
-
-  const handleNotificationSettingsUpdate = (settings) => {
-    setNotificationState(prev => ({
-      ...prev,
-      settings
-    }));
-  };
-
-  const handleNotificationProcess = (notificationId, action) => {
-    setNotificationState(prev => ({
-      ...prev,
-      notifications: prev.notifications.map(notification => {
-        if (notification.id === notificationId) {
-          return {
-            ...notification,
-            processingStatus: action === 'accept' ? 'processed' : 'ignored',
-            isRead: true
-          };
-        }
-        return notification;
-      }),
-      unreadCount: Math.max(0, prev.unreadCount - 1)
-    }));
-  };
-
-  const handleTransactionFromNotification = (transaction) => {
-    // Map bank transaction to expense format and add to appropriate subcategory
-    const category = categorizeTransaction(transaction);
-    
-    // Find appropriate subcategory based on transaction type and category
-    let targetSubcategory = null;
-    
-    if (transaction.transactionType === 'credit') {
-      // Handle income
-      handleIncomeAdd(
-        transaction.amount,
-        transaction.description,
-        transaction.bankName,
-        transaction.date
-      );
-      return;
-    }
-    
-    // Handle expenses - find appropriate subcategory
-    for (const cat of financeState.categories) {
-      for (const sub of cat.subcategories) {
-        if (category.toLowerCase().includes('emi') && sub.name.toLowerCase().includes('emi')) {
-          targetSubcategory = sub;
-          break;
-        } else if (category.toLowerCase().includes('food') && sub.name.toLowerCase().includes('home')) {
-          targetSubcategory = sub;
-          break;
-        } else if (category.toLowerCase().includes('transport') && sub.name.toLowerCase().includes('vehicle')) {
-          targetSubcategory = sub;
-          break;
-        } else if (category.toLowerCase().includes('utilities') && sub.name.toLowerCase().includes('bills')) {
-          targetSubcategory = sub;
-          break;
-        } else if (category.toLowerCase().includes('shopping') && sub.name.toLowerCase().includes('phone')) {
-          targetSubcategory = sub;
-          break;
-        }
-      }
-      if (targetSubcategory) break;
-    }
-    
-    // If no specific subcategory found, use the first subcategory of WANTS category
-    if (!targetSubcategory) {
-      const wantsCategory = financeState.categories.find(cat => cat.id === 'wants');
-      if (wantsCategory && wantsCategory.subcategories.length > 0) {
-        targetSubcategory = wantsCategory.subcategories[0];
-      }
-    }
-    
-    if (targetSubcategory) {
-      handleExpenseAdd(targetSubcategory.id, {
-        amount: transaction.amount,
-        description: `${transaction.description} (${transaction.bankName})`,
-        date: transaction.date
-      });
-    }
-  };
-
-  const unreadNotificationCount = notificationState.unreadCount;
-
   return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
       <div className="max-w-7xl mx-auto p-6">