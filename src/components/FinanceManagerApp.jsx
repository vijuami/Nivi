import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { IncomeInput } from './IncomeInput';
import { CategoryCard } from './CategoryCard';
import { EMITracker } from './EMITracker';
import { DebtTracker } from './DebtTracker';
import { TransactionHistory } from './TransactionHistory';
import { UpiPaymentFormModal } from './UpiPaymentFormModal';
// import { NotificationCenter } from './NotificationCenter';
import { 
  MAIN_CATEGORIES, 
  DEFAULT_SUBCATEGORIES, 
  calculateCategoryAllocation,
  redistributeSubcategories,
  generateId
} from '../utils/financeCalculations';
import { TrendingUp, Target, CreditCard, Receipt, Sun, Moon, ArrowLeft } from 'lucide-react';
import { Send, Home, Bell, LogOut } from 'lucide-react';

export const FinanceManagerApp = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Initialize state with data from localStorage
  const defaultFinanceState = {
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
  // const [showNotifications, setShowNotifications] = useState(false);
  const [showDebtReminderBlink, setShowDebtReminderBlink] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUpiPaymentForm, setShowUpiPaymentForm] = useState(false);
  
  // Load data from API on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        const loadedState = await apiClient.getFinanceData();
        
        // If no categories exist, initialize empty categories for display
        if (!loadedState.categories || loadedState.categories.length === 0) {
          loadedState.categories = initializeEmptyCategories();
        }
        
        setFinanceState(loadedState);
        setIsStateLoaded(true);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to default states
        setFinanceState({ ...defaultFinanceState, categories: initializeEmptyCategories() });
        setIsStateLoaded(true);
      }
    };

    loadUserData();
  }, [user]);

  // Save data to API whenever financeState changes (but only after initial load)
  useEffect(() => {
    if (isStateLoaded && user) {
      const saveData = async () => {
        try {
          await apiClient.updateFinanceData(financeState);
        } catch (error) {
          console.error('Error saving finance data:', error);
        }
      };
      saveData();
    }
  }, [financeState, isStateLoaded, user]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize empty categories for display
  const initializeEmptyCategories = () => {
    return MAIN_CATEGORIES.map(category => ({
      ...category,
      allocated: 0,
      spent: 0,
      subcategories: DEFAULT_SUBCATEGORIES[category.id]?.map(sub => ({
        ...sub,
        allocated: 0,
        spent: 0,
        transactions: []
      })) || []
    }));
  };

  // Handle income update
  const handleIncomeUpdate = (newIncome) => {
    const allocations = calculateCategoryAllocation(newIncome);
    
    setFinanceState(prev => {
      const updatedCategories = prev.categories.map(category => {
        const allocation = allocations[category.id] || 0;
        const updatedSubcategories = redistributeSubcategories(category.subcategories, allocation);
        
        return {
          ...category,
          allocated: allocation,
          subcategories: updatedSubcategories
        };
      });

      return {
        ...prev,
        income: newIncome,
        categories: updatedCategories
      };
    });
  };

  // Handle income transaction add
  const handleIncomeAdd = (amount, description, source, date) => {
    const newTransaction = {
      id: generateId(),
      amount: parseFloat(amount),
      description,
      source,
      date: date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    setFinanceState(prev => ({
      ...prev,
      incomeTransactions: [...prev.incomeTransactions, newTransaction]
    }));
  };

  // Handle income transaction delete
  const handleIncomeDelete = (transactionId) => {
    setFinanceState(prev => ({
      ...prev,
      incomeTransactions: prev.incomeTransactions.filter(t => t.id !== transactionId)
    }));
  };

  // Handle expense addition
  const handleExpenseAdd = (subcategoryId, expense) => {
    const newExpense = {
      id: generateId(),
      ...expense,
      amount: parseFloat(expense.amount),
      date: expense.date || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => ({
        ...category,
        subcategories: category.subcategories.map(sub => {
          if (sub.id === subcategoryId) {
            const updatedTransactions = [...sub.transactions, newExpense];
            const newSpent = updatedTransactions.reduce((sum, t) => sum + t.amount, 0);
            return {
              ...sub,
              transactions: updatedTransactions,
              spent: newSpent
            };
          }
          return sub;
        }),
        spent: category.subcategories.reduce((sum, sub) => {
          if (sub.id === subcategoryId) {
            return sum + parseFloat(expense.amount);
          }
          return sum + sub.spent;
        }, 0)
      })),
      transactions: [...prev.transactions, { ...newExpense, subcategoryId }]
    }));
  };

  // Handle expense deletion
  const handleExpenseDelete = (subcategoryId, expenseId) => {
    setFinanceState(prev => ({
      ...prev,
      categories: prev.categories.map(category => ({
        ...category,
        subcategories: category.subcategories.map(sub => {
          if (sub.id === subcategoryId) {
            const updatedTransactions = sub.transactions.filter(t => t.id !== expenseId);
            const newSpent = updatedTransactions.reduce((sum, t) => sum + t.amount, 0);
            return {
              ...sub,
              transactions: updatedTransactions,
              spent: newSpent
            };
          }
          return sub;
        }),
        spent: category.subcategories.reduce((sum, sub) => {
          if (sub.id === subcategoryId) {
            const expenseToDelete = sub.transactions.find(t => t.id === expenseId);
            return sum - (expenseToDelete ? expenseToDelete.amount : 0);
          }
          return sum + sub.spent;
        }, 0)
      })),
      transactions: prev.transactions.filter(t => t.id !== expenseId)
    }));
  };

  const tabs = [
    { id: 'budget', name: 'Budget Overview', icon: TrendingUp },
    { id: 'emi', name: 'EMI Tracker', icon: CreditCard },
    { id: 'debt', name: 'Debt Tracker', icon: Target },
    { id: 'transactions', name: 'Transactions', icon: Receipt }
  ];

  // Calculate totals
  const totalAllocated = financeState.categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = financeState.categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalIncome = financeState.incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remainingBudget = totalAllocated - totalSpent;

  // EMI handlers
  const handleEMIAdd = (emi) => {
    const newEMI = {
      id: generateId(),
      ...emi,
      amount: parseFloat(emi.amount),
      startDate: emi.startDate,
      endDate: emi.endDate,
      createdAt: new Date().toISOString()
    };

    setFinanceState(prev => ({
      ...prev,
      emis: [...prev.emis, newEMI]
    }));
  };

  const handleEMIUpdate = (emiId, updates) => {
    setFinanceState(prev => ({
      ...prev,
      emis: prev.emis.map(emi => 
        emi.id === emiId 
          ? { ...emi, ...updates, amount: parseFloat(updates.amount || emi.amount) }
          : emi
      )
    }));
  };

  const handleEMIDelete = (emiId) => {
    setFinanceState(prev => ({
      ...prev,
      emis: prev.emis.filter(emi => emi.id !== emiId)
    }));
  };

  // Debt handlers
  const handleDebtAdd = (debt) => {
    const newDebt = {
      id: generateId(),
      ...debt,
      amount: parseFloat(debt.amount),
      interestRate: parseFloat(debt.interestRate),
      createdAt: new Date().toISOString()
    };

    setFinanceState(prev => ({
      ...prev,
      debts: [...prev.debts, newDebt]
    }));
  };

  const handleDebtUpdate = (debtId, updates) => {
    setFinanceState(prev => ({
      ...prev,
      debts: prev.debts.map(debt => 
        debt.id === debtId 
          ? { 
              ...debt, 
              ...updates, 
              amount: parseFloat(updates.amount || debt.amount),
              interestRate: parseFloat(updates.interestRate || debt.interestRate)
            }
          : debt
      )
    }));
  };

  const handleDebtDelete = (debtId) => {
    setFinanceState(prev => ({
      ...prev,
      debts: prev.debts.filter(debt => debt.id !== debtId)
    }));
  };

  const handleDebtPayment = (debtId, paymentAmount, paymentDate) => {
    const payment = {
      id: generateId(),
      amount: parseFloat(paymentAmount),
      date: paymentDate || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };

    setFinanceState(prev => ({
      ...prev,
      debts: prev.debts.map(debt => {
        if (debt.id === debtId) {
          const updatedPayments = [...(debt.payments || []), payment];
          const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
          const remainingAmount = debt.amount - totalPaid;
          
          return {
            ...debt,
            payments: updatedPayments,
            remainingAmount: Math.max(0, remainingAmount),
            status: remainingAmount <= 0 ? 'paid' : 'active'
          };
        }
        return debt;
      })
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Manager</h1>
                <p className="text-gray-600 dark:text-gray-400">Track your income, expenses, and financial goals</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              {/* Notifications Button */}
              {/* <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Email Notifications"
              >
                <Bell className="h-5 w-5" />
              </button> */}
              
              {/* UPI Payment Button */}
              <button
                onClick={() => setShowUpiPaymentForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="UPI Payment"
              >
                <Send className="h-4 w-4" />
                <span>Pay</span>
              </button>
              
              {/* Sign Out Button */}
              <button
                onClick={signOut}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Income Input */}
        <IncomeInput
          income={financeState.income}
          incomeTransactions={financeState.incomeTransactions}
          totalIncome={totalIncome}
          onIncomeUpdate={handleIncomeUpdate}
          onIncomeAdd={handleIncomeAdd}
          onIncomeDelete={handleIncomeDelete}
        />

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="-mb-px flex space-x-8 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalIncome.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget Allocated</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalAllocated.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Receipt className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalSpent.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCard className={`h-8 w-8 ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</p>
                    <p className={`text-2xl font-semibold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{remainingBudget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {financeState.categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onExpenseAdd={handleExpenseAdd}
                  onExpenseDelete={handleExpenseDelete}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'emi' && (
          <EMITracker
            emis={financeState.emis}
            onEMIAdd={handleEMIAdd}
            onEMIUpdate={handleEMIUpdate}
            onEMIDelete={handleEMIDelete}
          />
        )}

        {activeTab === 'debt' && (
          <DebtTracker
            debts={financeState.debts}
            onDebtAdd={handleDebtAdd}
            onDebtUpdate={handleDebtUpdate}
            onDebtDelete={handleDebtDelete}
            onDebtPayment={handleDebtPayment}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionHistory
            transactions={financeState.transactions}
            incomeTransactions={financeState.incomeTransactions}
            categories={financeState.categories}
          />
        )}

        {/* UPI Payment Form Modal */}
        {showUpiPaymentForm && (
          <UpiPaymentFormModal
            onClose={() => setShowUpiPaymentForm(false)}
            onPaymentComplete={(paymentData) => {
              // Handle payment completion
              console.log('Payment completed:', paymentData);
              setShowUpiPaymentForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
};