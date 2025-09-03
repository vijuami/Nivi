import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IncomeInput } from './IncomeInput';
import { CategoryCard } from './CategoryCard';
import { EMITracker } from './EMITracker';
import { DebtTracker } from './DebtTracker';
import { TransactionHistory } from './TransactionHistory';
import { UpiPaymentFormModal } from './UpiPaymentFormModal';
import { NotificationCenter } from './NotificationCenter';
import { FinanceState, MainCategory, EMI, Debt, Expense, IncomeTransaction } from '../types/finance';
import { EmailNotification, NotificationSettings, NotificationState, BankTransaction } from '../types/notifications';
import { parseTransactionFromEmail, categorizeTransaction } from '../utils/emailParser';
import { 
  MAIN_CATEGORIES, 
  DEFAULT_SUBCATEGORIES, 
  calculateCategoryAllocation,
  redistributeSubcategories,
  generateId
} from '../utils/financeCalculations';
import { TrendingUp, Target, CreditCard, Receipt, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Send, Home, Bell, LogOut } from 'lucide-react';
import { 
  saveUserFinanceData, 
  loadUserFinanceData,
  saveUserNotificationState,
  loadUserNotificationState
} from '../utils/supabaseStorage';

export const FinanceManagerApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Initialize state with data from localStorage
  const defaultFinanceState: FinanceState = {
    income: 0,
    incomeTransactions: [],
    categories: [],
    emis: [],
    debts: [],
    transactions: []
  };
  
  const [financeState, setFinanceState] = useState<FinanceState>(defaultFinanceState);
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<'budget' | 'emi' | 'debt' | 'transactions'>('budget');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDebtReminderBlink, setShowDebtReminderBlink] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUpiPaymentForm, setShowUpiPaymentForm] = useState(false);
  
  // Notification state - define defaultNotificationState before using it
  const defaultNotificationState: NotificationState = {
    notifications: [],
    settings: {
      emailIntegrationEnabled: false,
      autoProcessTransactions: false,
      supportedBanks: ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK'],
      connectedEmails: [],
      emailFilters: {
        senders: ['alerts@sbi.co.in', 'alerts@hdfcbank.net', 'alerts@icicibank.com'],
        keywords: ['debited', 'credited', 'transaction', 'balance'],
        subjects: ['Transaction Alert', 'Account Statement', 'Payment Notification']
      },
      notificationPreferences: {
        showPopups: true,
        playSound: false,
        markAsRead: true
      }
    },
    isConnected: false,
    lastSync: null,
    unreadCount: 0
  };
  
  const [notificationState, setNotificationState] = useState<NotificationState>(defaultNotificationState);
  const [isNotificationStateLoaded, setIsNotificationStateLoaded] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const loadedState = await loadUserFinanceData(user.id, defaultFinanceState);
        const loadedNotificationState = await loadUserNotificationState(user.id, defaultNotificationState);
        
        // If no categories exist, initialize empty categories for display
        if (loadedState.categories.length === 0) {
          loadedState.categories = initializeEmptyCategories();
        }
        
        setFinanceState(loadedState);
        setNotificationState(loadedNotificationState);
        setIsStateLoaded(true);
        setIsNotificationStateLoaded(true);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to default states
        setFinanceState({ ...defaultFinanceState, categories: initializeEmptyCategories() });
        setNotificationState(defaultNotificationState);
        setIsStateLoaded(true);
        setIsNotificationStateLoaded(true);
      }
    }

    loadUserData();
  }, [user]);

  // Save data to database whenever financeState changes (but only after initial load)
  useEffect(() => {
    if (isStateLoaded && user) {
      saveUserFinanceData(user.id, financeState);
    }
  }, [financeState, isStateLoaded, user]);

  // Save notification state to database whenever it changes (but only after initial load)
  useEffect(() => {
    if (isNotificationStateLoaded && user) {
      saveUserNotificationState(user.id, notificationState);
    }
  }, [notificationState, isNotificationStateLoaded, user]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDark);
    document.documentElement.classList.toggle('dark', shouldUseDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check for debt reminders
  useEffect(() => {
    const checkDebtReminders = () => {
      const today = new Date();
      const hasUpcomingReminder = financeState.debts.some(debt => {
        if (!debt.reminderDate || !debt.isActive) return false;
        
        const reminderDate = new Date(debt.reminderDate);
        const timeDiff = reminderDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        return daysDiff <= 1 && daysDiff >= 0;
      });
      
      setShowDebtReminderBlink(hasUpcomingReminder);
    };

    checkDebtReminders();
    // Check every hour for reminder updates
    const interval = setInterval(checkDebtReminders, 3600000);
    
    return () => clearInterval(interval);
  }, [financeState.debts]);

  // Initialize categories when income is first added
  const initializeCategories = (income: number) => {
    const newCategories: MainCategory[] = MAIN_CATEGORIES.map(mainCat => {
      const totalAllocated = calculateCategoryAllocation(income, mainCat.percentage);
      const subcategories = DEFAULT_SUBCATEGORIES[mainCat.id as keyof typeof DEFAULT_SUBCATEGORIES].map(sub => ({
        id: generateId(),
        name: sub.name,
        allocatedAmount: (totalAllocated * sub.percentage) / 100,
        allocatedPercentage: sub.percentage,
        spentAmount: 0,
        balance: (totalAllocated * sub.percentage) / 100,
        expenses: []
      }));

      return {
        id: mainCat.id,
        name: mainCat.name,
        percentage: mainCat.percentage,
        totalAllocated,
        totalSpent: 0,
        totalBalance: totalAllocated,
        subcategories
      };
    });

    return newCategories;
  };

  // Initialize empty categories for display before income is added
  const initializeEmptyCategories = () => {
    const emptyCategories: MainCategory[] = MAIN_CATEGORIES.map(mainCat => {
      const subcategories = DEFAULT_SUBCATEGORIES[mainCat.id as keyof typeof DEFAULT_SUBCATEGORIES].map(sub => ({
        id: generateId(),
        name: sub.name,
        allocatedAmount: 0,
        allocatedPercentage: sub.percentage,
        spentAmount: 0,
        balance: 0,
        expenses: []
      }));

      return {
        id: mainCat.id,
        name: mainCat.name,
        percentage: mainCat.percentage,
        totalAllocated: 0,
        totalSpent: 0,
        totalBalance: 0,
        subcategories
      };
    });

    return emptyCategories;
  };

  // Add income and initialize or update categories
  const handleIncomeAdd = (amount: number, description: string, source: string, date: Date) => {
    const newIncomeTransaction: IncomeTransaction = {
      id: generateId(),
      amount,
      description,
      source,
      date
    };

    setFinanceState(prev => {
      const newIncome = prev.income + amount;
      
      if (prev.categories.length === 0) {
        // First time setup
        return {
          ...prev,
          income: newIncome,
          incomeTransactions: [...prev.incomeTransactions, newIncomeTransaction],
          categories: initializeCategories(newIncome)
        };
      } else {
        // Update existing categories proportionally
        const updatedCategories = prev.categories.map(category => {
          const newTotalAllocated = calculateCategoryAllocation(newIncome, category.percentage);
          
          const updatedSubcategories = category.subcategories.map(sub => ({
            ...sub,
            allocatedAmount: (newTotalAllocated * sub.allocatedPercentage) / 100,
            balance: ((newTotalAllocated * sub.allocatedPercentage) / 100) - sub.spentAmount
          }));

          const newTotalSpent = updatedSubcategories.reduce((sum, sub) => sum + sub.spentAmount, 0);

          return {
            ...category,
            totalAllocated: newTotalAllocated,
            totalSpent: newTotalSpent,
            totalBalance: newTotalAllocated - newTotalSpent,
            subcategories: updatedSubcategories
          };
        });

        return {
          ...prev,
          income: newIncome,
          incomeTransactions: [...prev.incomeTransactions, newIncomeTransaction],
          categories: updatedCategories
        };
      }
    });
  };

  // Delete transaction (expense or income)
  const handleDeleteTransaction = (transactionId: string, transactionType: 'expense' | 'income') => {
    if (transactionType === 'income') {
      // Handle income transaction deletion
      const transactionToDelete = financeState.incomeTransactions.find(t => t.id === transactionId);
      if (!transactionToDelete) return;
      
      const updatedIncomeTransactions = financeState.incomeTransactions.filter(t => t.id !== transactionId);
      const newIncome = updatedIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      
      setFinanceState(prev => {
        // Update categories proportionally based on new income
        const updatedCategories = prev.categories.map(category => {
          const newTotalAllocated = calculateCategoryAllocation(newIncome, category.percentage);
          const ratio = category.totalAllocated > 0 ? newTotalAllocated / category.totalAllocated : 1;
          
          const updatedSubcategories = category.subcategories.map(sub => ({
            ...sub,
            allocatedAmount: newTotalAllocated > 0 ? (newTotalAllocated * sub.allocatedPercentage) / 100 : 0,
            balance: newTotalAllocated > 0 ? ((newTotalAllocated * sub.allocatedPercentage) / 100) - sub.spentAmount : -sub.spentAmount
          }));

          return {
            ...category,
            totalAllocated: newTotalAllocated,
            totalBalance: newTotalAllocated - category.totalSpent,
            subcategories: updatedSubcategories
          };
        });

        return {
          ...prev,
          income: newIncome,
          incomeTransactions: updatedIncomeTransactions,
          categories: updatedCategories
        };
      });
    } else {
      // Handle expense transaction deletion
      const transactionToDelete = financeState.transactions.find(t => t.id === transactionId);
      if (!transactionToDelete) return;
      
      setFinanceState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== transactionId),
        categories: prev.categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(sub => {
            if (sub.id !== transactionToDelete.subcategoryId) return sub;
            
            const newSpentAmount = sub.spentAmount - transactionToDelete.amount;
            const newExpenses = sub.expenses.filter(e => e.id !== transactionId);
            
            return {
              ...sub,
              spentAmount: Math.max(0, newSpentAmount),
              balance: sub.allocatedAmount - Math.max(0, newSpentAmount),
              expenses: newExpenses
            };
          }),
          totalSpent: category.subcategories.reduce((sum, sub) => {
            if (sub.id === transactionToDelete.subcategoryId) {
              return sum + Math.max(0, sub.spentAmount - transactionToDelete.amount);
            }
            return sum + sub.spentAmount;
          }, 0),
          totalBalance: category.totalAllocated - category.subcategories.reduce((sum, sub) => {
            if (sub.id === transactionToDelete.subcategoryId) {
              return sum + Math.max(0, sub.spentAmount - transactionToDelete.amount);
            }
            return sum + sub.spentAmount;
          }, 0)
        }))
      }));
    }
  };

  // Edit transaction (expense or income)
  const handleEditTransaction = (transactionId: string, transactionType: 'expense' | 'income', newAmount: number, newDescription: string) => {
    if (transactionType === 'income') {
      // Handle income transaction edit
      const updatedIncomeTransactions = financeState.incomeTransactions.map(transaction =>
        transaction.id === transactionId
          ? { ...transaction, amount: newAmount, description: newDescription }
          : transaction
      );

      const newIncome = updatedIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

      setFinanceState(prev => {
        // Update categories proportionally based on new income
        const updatedCategories = prev.categories.map(category => {
          const newTotalAllocated = calculateCategoryAllocation(newIncome, category.percentage);
          
          const updatedSubcategories = category.subcategories.map(sub => ({
            ...sub,
            allocatedAmount: newIncome > 0 ? (newTotalAllocated * sub.allocatedPercentage) / 100 : 0,
            balance: newIncome > 0 ? ((newTotalAllocated * sub.allocatedPercentage) / 100) - sub.spentAmount : -sub.spentAmount
          }));

          return {
            ...category,
            totalAllocated: newTotalAllocated,
            totalBalance: newTotalAllocated - category.totalSpent,
            subcategories: updatedSubcategories
          };
        });

        return {
          ...prev,
          income: newIncome,
          incomeTransactions: updatedIncomeTransactions,
          categories: updatedCategories
        };
      });
    } else {
      // Handle expense transaction edit
      const oldTransaction = financeState.transactions.find(t => t.id === transactionId);
      if (!oldTransaction) return;
      
      const amountDifference = newAmount - oldTransaction.amount;
      
      setFinanceState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === transactionId 
            ? { ...t, amount: newAmount, description: newDescription }
            : t
        ),
        categories: prev.categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(sub => {
            if (sub.id !== oldTransaction.subcategoryId) return sub;
            
            const newSpentAmount = sub.spentAmount + amountDifference;
            const updatedExpenses = sub.expenses.map(e => 
              e.id === transactionId 
                ? { ...e, amount: newAmount, description: newDescription }
                : e
            );
            
            return {
              ...sub,
              spentAmount: Math.max(0, newSpentAmount),
              balance: sub.allocatedAmount - Math.max(0, newSpentAmount),
              expenses: updatedExpenses
            };
          }),
          totalSpent: category.subcategories.reduce((sum, sub) => {
            if (sub.id === oldTransaction.subcategoryId) {
              return sum + Math.max(0, sub.spentAmount + amountDifference);
            }
            return sum + sub.spentAmount;
          }, 0),
          totalBalance: category.totalAllocated - category.subcategories.reduce((sum, sub) => {
            if (sub.id === oldTransaction.subcategoryId) {
              return sum + Math.max(0, sub.spentAmount + amountDifference);
            }
            return sum + sub.spentAmount;
          }, 0)
        }))
      }));
    }
  };

  // Update subcategory allocation
  const handleSubcategoryUpdate = (categoryId: string, subcategoryId: string, newAmount: number) => {
    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if (category.id !== categoryId) return category;

        const updatedSubcategories = redistributeSubcategories(
          category.subcategories,
          subcategoryId,
          newAmount,
          category.totalAllocated
        );

        const newTotalSpent = updatedSubcategories.reduce((sum, sub) => sum + sub.spentAmount, 0);

        return {
          ...category,
          subcategories: updatedSubcategories,
          totalBalance: category.totalAllocated - newTotalSpent
        };
      })
    }));
  };

  // Add new subcategory
  const handleSubcategoryAdd = (categoryId: string, name: string, percentage: number) => {
    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if (category.id !== categoryId) return category;

        const newSubcategory: SubCategory = {
          id: generateId(),
          name,
          allocatedAmount: (category.totalAllocated * percentage) / 100,
          allocatedPercentage: percentage,
          spentAmount: 0,
          balance: (category.totalAllocated * percentage) / 100,
          expenses: []
        };

        // Redistribute existing subcategories to accommodate the new one
        const remainingPercentage = 100 - percentage;
        const totalCurrentPercentage = category.subcategories.reduce((sum, sub) => sum + sub.allocatedPercentage, 0);
        
        const updatedSubcategories = category.subcategories.map(sub => {
          const newPercentage = totalCurrentPercentage > 0 
            ? (sub.allocatedPercentage / totalCurrentPercentage) * remainingPercentage
            : remainingPercentage / category.subcategories.length;
          const newAmount = (category.totalAllocated * newPercentage) / 100;
          
          return {
            ...sub,
            allocatedPercentage: newPercentage,
            allocatedAmount: newAmount,
            balance: newAmount - sub.spentAmount
          };
        });

        return {
          ...category,
          subcategories: [...updatedSubcategories, newSubcategory],
          totalBalance: category.totalAllocated - category.totalSpent
        };
      })
    }));
  };

  // Delete subcategory
  const handleSubcategoryDelete = (categoryId: string, subcategoryId: string) => {
    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if (category.id !== categoryId) return category;

        const subcategoryToDelete = category.subcategories.find(sub => sub.id === subcategoryId);
        if (!subcategoryToDelete) return category;

        const remainingSubcategories = category.subcategories.filter(sub => sub.id !== subcategoryId);
        
        if (remainingSubcategories.length === 0) {
          // If no subcategories left, create a default one
          const defaultSubcategory: SubCategory = {
            id: generateId(),
            name: 'General',
            allocatedAmount: category.totalAllocated,
            allocatedPercentage: 100,
            spentAmount: 0,
            balance: category.totalAllocated,
            expenses: []
          };
          
          return {
            ...category,
            subcategories: [defaultSubcategory],
            totalSpent: 0,
            totalBalance: category.totalAllocated
          };
        }

        // Redistribute the deleted subcategory's allocation among remaining ones
        const totalRemainingPercentage = remainingSubcategories.reduce((sum, sub) => sum + sub.allocatedPercentage, 0);
        const redistributedSubcategories = remainingSubcategories.map(sub => {
          const newPercentage = totalRemainingPercentage > 0 
            ? (sub.allocatedPercentage / totalRemainingPercentage) * 100
            : 100 / remainingSubcategories.length;
          const newAmount = (category.totalAllocated * newPercentage) / 100;
          
          return {
            ...sub,
            allocatedPercentage: newPercentage,
            allocatedAmount: newAmount,
            balance: newAmount - sub.spentAmount
          };
        });

        const newTotalSpent = redistributedSubcategories.reduce((sum, sub) => sum + sub.spentAmount, 0);

        return {
          ...category,
          subcategories: redistributedSubcategories,
          totalSpent: newTotalSpent,
          totalBalance: category.totalAllocated - newTotalSpent
        };
      }),
      // Remove any transactions associated with the deleted subcategory
      transactions: prev.transactions.filter(transaction => transaction.subcategoryId !== subcategoryId)
    }));
  };

  // Rename subcategory
  const handleSubcategoryRename = (categoryId: string, subcategoryId: string, newName: string) => {
    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if (category.id !== categoryId) return category;

        return {
          ...category,
          subcategories: category.subcategories.map(sub =>
            sub.id === subcategoryId ? { ...sub, name: newName } : sub
          )
        };
      })
    }));
  };

  // Add expense to subcategory
  const handleExpenseAdd = (subcategoryId: string, expense: { amount: number; description: string; date: Date }) => {
    const newExpense: Expense = {
      id: generateId(),
      ...expense,
      subcategoryId
    };

    setFinanceState(prev => ({
      ...prev,
      transactions: [...prev.transactions, newExpense],
      categories: prev.categories.map(category => ({
        ...category,
        subcategories: category.subcategories.map(sub => {
          if (sub.id !== subcategoryId) return sub;
          
          const newSpentAmount = sub.spentAmount + expense.amount;
          return {
            ...sub,
            spentAmount: newSpentAmount,
            balance: sub.allocatedAmount - newSpentAmount,
            expenses: [...sub.expenses, newExpense]
          };
        }),
        totalSpent: category.subcategories.reduce((sum, sub) => 
          sub.id === subcategoryId ? sum + sub.spentAmount + expense.amount : sum + sub.spentAmount, 0
        ),
        totalBalance: category.totalAllocated - category.subcategories.reduce((sum, sub) => 
          sub.id === subcategoryId ? sum + sub.spentAmount + expense.amount : sum + sub.spentAmount, 0
        )
      }))
    }));
  };

  // Transfer amount between categories
  const handleTransfer = (fromCategoryId: string, toCategoryId: string, amount: number) => {
    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if (category.id === fromCategoryId) {
          return {
            ...category,
            totalAllocated: category.totalAllocated - amount,
            totalBalance: category.totalBalance - amount,
            subcategories: category.subcategories.map(sub => ({
              ...sub,
              allocatedAmount: sub.allocatedAmount * (category.totalAllocated - amount) / category.totalAllocated,
              balance: sub.allocatedAmount * (category.totalAllocated - amount) / category.totalAllocated - sub.spentAmount
            }))
          };
        } else if (category.id === toCategoryId) {
          return {
            ...category,
            totalAllocated: category.totalAllocated + amount,
            totalBalance: category.totalBalance + amount,
            subcategories: category.subcategories.map(sub => ({
              ...sub,
              allocatedAmount: sub.allocatedAmount * (category.totalAllocated + amount) / category.totalAllocated,
              balance: sub.allocatedAmount * (category.totalAllocated + amount) / category.totalAllocated - sub.spentAmount
            }))
          };
        }
        return category;
      })
    }));
  };

  // EMI Management
  const handleEMIAdd = (emi: Omit<EMI, 'id'>) => {
    setFinanceState(prev => ({
      ...prev,
      emis: [...prev.emis, { ...emi, id: generateId() }]
    }));
  };

  const handleEMIEdit = (emiId: string, updatedEMI: Omit<EMI, 'id'>) => {
    setFinanceState(prev => ({
      ...prev,
      emis: prev.emis.map(emi => 
        emi.id === emiId ? { ...updatedEMI, id: emiId } : emi
      )
    }));
  };

  const handleEMIDelete = (emiId: string) => {
    setFinanceState(prev => ({
      ...prev,
      emis: prev.emis.filter(emi => emi.id !== emiId)
    }));
  };

  // Edit income transaction
  const handleIncomeEdit = (transactionId: string, amount: number, description: string, source: string, date: Date) => {
    setFinanceState(prev => {
      const updatedIncomeTransactions = prev.incomeTransactions.map(transaction =>
        transaction.id === transactionId
          ? { ...transaction, amount, description, source, date }
          : transaction
      );

      const newIncome = updatedIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

      // Update categories proportionally based on new income
      const updatedCategories = prev.categories.map(category => {
        const newTotalAllocated = calculateCategoryAllocation(newIncome, category.percentage);
        const ratio = category.totalAllocated > 0 ? newTotalAllocated / category.totalAllocated : 1;
        
        const updatedSubcategories = category.subcategories.map(sub => ({
          ...sub,
          allocatedAmount: sub.allocatedAmount * ratio,
          balance: (sub.allocatedAmount * ratio) - sub.spentAmount
        }));

        return {
          ...category,
          totalAllocated: newTotalAllocated,
          totalBalance: newTotalAllocated - category.totalSpent,
          subcategories: updatedSubcategories
        };
      });

      return {
        ...prev,
        income: newIncome,
        incomeTransactions: updatedIncomeTransactions,
        categories: updatedCategories
      };
    });
  };

  // Delete income transaction
  const handleIncomeDelete = (transactionId: string) => {
    setFinanceState(prev => {
      const updatedIncomeTransactions = prev.incomeTransactions.filter(
        transaction => transaction.id !== transactionId
      );

      const newIncome = updatedIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

      // Update categories proportionally based on new income
      const updatedCategories = prev.categories.map(category => {
        const newTotalAllocated = calculateCategoryAllocation(newIncome, category.percentage);
        const ratio = category.totalAllocated > 0 ? newTotalAllocated / category.totalAllocated : 1;
        
        const updatedSubcategories = category.subcategories.map(sub => ({
          ...sub,
          allocatedAmount: sub.allocatedAmount * ratio,
          balance: (sub.allocatedAmount * ratio) - sub.spentAmount
        }));

        return {
          ...category,
          totalAllocated: newTotalAllocated,
          totalBalance: newTotalAllocated - category.totalSpent,
          subcategories: updatedSubcategories
        };
      });

      return {
        ...prev,
        income: newIncome,
        incomeTransactions: updatedIncomeTransactions,
        categories: updatedCategories
      };
    });
  };

  const handleEMIPayment = (emiId: string) => {
    const emi = financeState.emis.find(e => e.id === emiId);
    if (!emi) return;

    // Add expense to Bank EMI subcategory first
    const bankEMISubcategory = financeState.categories
      .find(cat => cat.id === 'needs')?.subcategories
      .find(sub => sub.name === 'Bank EMI');
    
    if (bankEMISubcategory) {
      handleExpenseAdd(bankEMISubcategory.id, {
        amount: emi.amount,
        description: `EMI Payment - ${emi.name}`,
        date: new Date()
      });
    }

    // Then update EMI status
    setFinanceState(prev => ({
      ...prev,
      emis: prev.emis.map(emi => {
        if (emi.id !== emiId) return emi;
        
        const newTenureLeft = emi.tenureLeft - 1;
        const newPaidCount = emi.paidCount + 1;
        const isCompleted = newTenureLeft <= 0;

        return {
          ...emi,
          tenureLeft: Math.max(0, newTenureLeft),
          paidCount: newPaidCount,
          isActive: !isCompleted
        };
      })
    }));
  };

  // Debt Management
  const handleDebtAdd = (debt: Omit<Debt, 'id'>) => {
    setFinanceState(prev => ({
      ...prev,
      debts: [...prev.debts, { ...debt, id: generateId() }]
    }));
  };

  const handleDebtEdit = (debtId: string, updatedDebt: Omit<Debt, 'id'>) => {
    setFinanceState(prev => ({
      ...prev,
      debts: prev.debts.map(debt => 
        debt.id === debtId ? { ...updatedDebt, id: debtId } : debt
      )
    }));
  };

  const handleDebtDelete = (debtId: string) => {
    setFinanceState(prev => ({
      ...prev,
      debts: prev.debts.filter(debt => debt.id !== debtId)
    }));
  };

  const handleDebtPayment = (debtId: string) => {
    const debt = financeState.debts.find(d => d.id === debtId);
    if (!debt) return;

    // Add expense to Debts subcategory first
    const debtsSubcategory = financeState.categories
      .find(cat => cat.id === 'needs')?.subcategories
      .find(sub => sub.name === 'Debts');
    
    if (debtsSubcategory) {
      handleExpenseAdd(debtsSubcategory.id, {
        amount: debt.monthlyPayment,
        description: `Debt Payment - ${debt.name}`,
        date: new Date()
      });
    }

    // Then update debt status
    setFinanceState(prev => ({
      ...prev,
      debts: prev.debts.map(debt => {
        if (debt.id !== debtId) return debt;
        
        const newPaidAmount = debt.paidAmount + debt.monthlyPayment;
        const newPendingAmount = Math.max(0, debt.pendingAmount - debt.monthlyPayment);
        const isCompleted = newPendingAmount <= 0;

        // Update reminder date to next month if debt is still active
        let newReminderDate = debt.reminderDate;
        if (!isCompleted && debt.reminderDate) {
          const nextReminder = new Date(debt.reminderDate);
          nextReminder.setMonth(nextReminder.getMonth() + 1);
          newReminderDate = nextReminder;
        }
        return {
          ...debt,
          pendingAmount: newPendingAmount,
          paidAmount: newPaidAmount,
          isActive: !isCompleted,
          reminderDate: isCompleted ? undefined : newReminderDate
        };
      })
    }));
  };

  // Notification handlers
  const handleEmailAdd = (email: string, provider: string) => {
    const newEmailAccount = {
      id: generateId(),
      email,
      provider: provider as 'gmail' | 'outlook' | 'yahoo' | 'other',
      isConnected: true,
      connectedAt: new Date(),
      lastSync: new Date(),
      displayName: email.split('@')[0]
    };

    setNotificationState(prev => ({
      ...prev,
      isConnected: true,
      settings: {
        ...prev.settings,
        emailIntegrationEnabled: true,
        connectedEmails: [...prev.settings.connectedEmails, newEmailAccount]
      }
    }));
  };

  const handleEmailRemove = (emailId: string) => {
    setNotificationState(prev => {
      const updatedEmails = prev.settings.connectedEmails.filter(email => email.id !== emailId);
      return {
        ...prev,
        isConnected: updatedEmails.length > 0,
        settings: {
          ...prev.settings,
          connectedEmails: updatedEmails,
          emailIntegrationEnabled: updatedEmails.length > 0
        }
      };
    });
  };

  const handleEmailSync = () => {
    // Simulate email sync
    setNotificationState(prev => ({
      ...prev,
      lastSync: new Date()
    }));
  };

  const handleNotificationSettingsUpdate = (settings: NotificationSettings) => {
    setNotificationState(prev => ({
      ...prev,
      settings
    }));
  };

  const handleNotificationProcess = (notificationId: string, action: 'accept' | 'ignore') => {
    setNotificationState(prev => ({
      ...prev,
      notifications: prev.notifications.map(notification => {
        if (notification.id === notificationId) {
          return {
            ...notification,
            processingStatus: action === 'accept' ? 'processed' : 'ignored',
            isRead: true
          };
        }
        return notification;
      }),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));
  };

  const handleTransactionFromNotification = (transaction: BankTransaction) => {
    // Map bank transaction to expense format and add to appropriate subcategory
    const category = categorizeTransaction(transaction);
    
    // Find appropriate subcategory based on transaction type and category
    let targetSubcategory = null;
    
    if (transaction.transactionType === 'credit') {
      // Handle income
      handleIncomeAdd(
        transaction.amount,
        transaction.description,
        transaction.bankName,
        transaction.date
      );
      return;
    }
    
    // Handle expenses - find appropriate subcategory
    for (const cat of financeState.categories) {
      for (const sub of cat.subcategories) {
        if (category.toLowerCase().includes('emi') && sub.name.toLowerCase().includes('emi')) {
          targetSubcategory = sub;
          break;
        } else if (category.toLowerCase().includes('food') && sub.name.toLowerCase().includes('home')) {
          targetSubcategory = sub;
          break;
        } else if (category.toLowerCase().includes('transport') && sub.name.toLowerCase().includes('vehicle')) {
          targetSubcategory = sub;
          break;
        } else if (category.toLowerCase().includes('utilities') && sub.name.toLowerCase().includes('bills')) {
          targetSubcategory = sub;
          break;
        } else if (category.toLowerCase().includes('shopping') && sub.name.toLowerCase().includes('phone')) {
          targetSubcategory = sub;
          break;
        }
      }
      if (targetSubcategory) break;
    }
    
    // If no specific subcategory found, use the first subcategory of WANTS category
    if (!targetSubcategory) {
      const wantsCategory = financeState.categories.find(cat => cat.id === 'wants');
      if (wantsCategory && wantsCategory.subcategories.length > 0) {
        targetSubcategory = wantsCategory.subcategories[0];
      }
    }
    
    if (targetSubcategory) {
      handleExpenseAdd(targetSubcategory.id, {
        amount: transaction.amount,
        description: `${transaction.description} (${transaction.bankName})`,
        date: transaction.date
      });
    }
  };

  const tabs = [
    { id: 'budget', name: 'Budget Overview', icon: TrendingUp },
    { id: 'emi', name: 'EMI Tracker', icon: CreditCard },
    { id: 'debt', name: 'Debt Tracker', icon: Target },
    { id: 'transactions', name: 'Transactions', icon: Receipt }
  ];

  const unreadNotificationCount = notificationState.unreadCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 relative">
          {/* Top Row - Icons */}
          <div className="flex items-center justify-between mb-4">
            {/* Left side - Home and Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Back to Home"
              >
                <Home className="h-5 w-5" />
              </button>
              
              <button
                onClick={toggleDarkMode}
                className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Toggle dark mode"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  {isDarkMode ? (
                    <Moon className="h-4 w-4 text-gray-700 m-1" />
                  ) : (
                    <Sun className="h-4 w-4 text-yellow-500 m-1" />
                  )}
                </span>
              </button>
            </div>
            
            {/* Right side - User Info and Actions */}
            <div className="flex items-center space-x-2">
              {/* User Info */}
              {user && (
                <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
              )}
              
              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Email Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              
              {/* UPI Payment Button */}
              <button
                onClick={() => setShowUpiPaymentForm(true)}
                className="flex items-center space-x-2 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">UPI Pay</span>
                <span className="sm:hidden">Pay</span>
              </button>
              
              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* App Title - Centered */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                NiVi AI Finance Manager
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Intelligent budget allocation and expense tracking
              {user && (
                <span className="block text-sm mt-1">
                  Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'User'}!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Income Input */}
        <IncomeInput
          currentIncome={financeState.income}
          incomeTransactions={financeState.incomeTransactions}
          onIncomeAdd={handleIncomeAdd}
          onIncomeEdit={handleIncomeEdit}
          onIncomeDelete={handleIncomeDelete}
        />

        {/* Notification Center */}
        {showNotifications && (
          <div className="mb-6">
            <NotificationCenter
              notifications={notificationState.notifications}
              settings={notificationState.settings}
              isConnected={notificationState.isConnected}
              lastSync={notificationState.lastSync}
              onSettingsUpdate={handleNotificationSettingsUpdate}
              onNotificationProcess={handleNotificationProcess}
              onTransactionAdd={handleTransactionFromNotification}
              onEmailAdd={handleEmailAdd}
              onEmailRemove={handleEmailRemove}
              onSync={handleEmailSync}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max px-2 md:px-0">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isDebtTab = tab.id === 'debt';
                const shouldBlink = isDebtTab && showDebtReminderBlink;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1 md:space-x-2 py-2 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${shouldBlink ? 'blink-animation' : ''}`}
                  >
                    <Icon className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {financeState.categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                categories={financeState.categories}
                onSubcategoryUpdate={handleSubcategoryUpdate}
                onExpenseAdd={handleExpenseAdd}
                onTransfer={handleTransfer}
                onSubcategoryAdd={handleSubcategoryAdd}
                onSubcategoryDelete={handleSubcategoryDelete}
                onSubcategoryRename={handleSubcategoryRename}
              />
            ))}
          </div>
        )}

        {activeTab === 'emi' && (
          <EMITracker
            emis={financeState.emis}
            onEMIAdd={handleEMIAdd}
            onEMIPayment={handleEMIPayment}
            onEMIEdit={handleEMIEdit}
            onEMIDelete={handleEMIDelete}
          />
        )}

        {activeTab === 'debt' && (
          <DebtTracker
            debts={financeState.debts}
            isReminding={showDebtReminderBlink}
            onDebtAdd={handleDebtAdd}
            onDebtPayment={handleDebtPayment}
            onDebtEdit={handleDebtEdit}
            onDebtDelete={handleDebtDelete}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistory
            transactions={financeState.transactions}
            incomeTransactions={financeState.incomeTransactions}
            categories={financeState.categories}
            onDeleteTransaction={handleDeleteTransaction}
            onEditTransaction={handleEditTransaction}
          />
        )}
      </div>

      {/* UPI Payment Form Modal */}
      {showUpiPaymentForm && (
        <UpiPaymentFormModal
          onClose={() => setShowUpiPaymentForm(false)}
          onPaymentInitiated={(paymentData) => {
            console.log('Payment initiated:', paymentData);
            // You can add logic here to track the payment or add it as an expense
          }}
        />
      )}
    </div>
  );
};