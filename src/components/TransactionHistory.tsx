import React, { useState, useMemo } from 'react';
import { Receipt, Calendar, DollarSign, Filter, Search, TrendingUp, TrendingDown, Edit3, Trash2, Check, X } from 'lucide-react';
import { Expense, MainCategory, IncomeTransaction } from '../types/finance';

interface TransactionHistoryProps {
  transactions: Expense[];
  incomeTransactions: IncomeTransaction[];
  categories: MainCategory[];
  onDeleteTransaction: (transactionId: string, transactionType: 'expense' | 'income') => void;
  onEditTransaction: (transactionId: string, transactionType: 'expense' | 'income', newAmount: number, newDescription: string) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  incomeTransactions,
  categories,
  onDeleteTransaction,
  onEditTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Get subcategory name by ID
  const getSubcategoryName = (subcategoryId: string) => {
    for (const category of categories) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        return { 
          subcategoryName: subcategory.name, 
          categoryName: category.name,
          categoryId: category.id
        };
      }
    }
    return { subcategoryName: 'Unknown', categoryName: 'Unknown', categoryId: '' };
  };

  // Combine income and expense transactions
  const allTransactions = useMemo(() => {
    const expenseTransactions = transactions.map(transaction => {
      const { subcategoryName, categoryName, categoryId } = getSubcategoryName(transaction.subcategoryId);
      return {
        ...transaction,
        type: 'expense' as const,
        subcategoryName,
        categoryName,
        category: categoryId
      };
    });

    const incomeTransactionsMapped = incomeTransactions.map(transaction => ({
      ...transaction,
      type: 'income' as const,
      subcategoryName: 'Income',
      categoryName: 'Income',
      category: 'income'
    }));

    return [...expenseTransactions, ...incomeTransactionsMapped].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, incomeTransactions]);

  // Filter transactions
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.subcategoryName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || transaction.category === selectedCategory;
    
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      matchesDate = transactionDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesDate = transactionDate >= monthAgo;
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => {
    return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
  }, 0);

  const getCategoryColor = (categoryId: string) => {
    switch (categoryId) {
      case 'needs': return 'green';
      case 'wants': return 'blue';
      case 'goals': return 'purple';
      case 'unwanted': return 'red';
      default: return 'gray';
    }
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  const handleEditStart = (transaction: any, type: 'expense' | 'income') => {
    setEditingTransaction(`${type}-${transaction.id}`);
    setEditAmount(transaction.amount.toString());
    setEditDescription(transaction.description);
  };

  const handleEditSave = (transactionId: string, transactionType: 'expense' | 'income') => {
    const amount = parseFloat(editAmount);
    if (amount > 0 && editDescription.trim()) {
      onEditTransaction(transactionId, transactionType, amount, editDescription.trim());
      setEditingTransaction(null);
      setEditAmount('');
      setEditDescription('');
    }
  };

  const handleEditCancel = () => {
    setEditingTransaction(null);
    setEditAmount('');
    setEditDescription('');
  };

  const handleDelete = (transactionId: string, transactionType: 'expense' | 'income', transactionDescription: string) => {
    if (window.confirm(`Are you sure you want to delete "${transactionDescription}"? This action cannot be undone.`)) {
      onDeleteTransaction(transactionId, transactionType);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500 p-3 rounded-lg">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Transaction History</h2>
              <p className="text-gray-600">Track and analyze your spending patterns</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-indigo-800 mb-1">Total Transactions</h3>
            <p className="text-2xl font-bold text-indigo-600">{filteredTransactions.length}</p>
          </div>
          <div className={`p-4 rounded-lg ${totalAmount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className={`text-sm font-medium mb-1 ${totalAmount >= 0 ? 'text-green-800' : 'text-red-800'}`}>Net Amount</h3>
            <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(totalAmount).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="income">Income</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Transactions ({filteredTransactions.length})
        </h3>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-800 mb-2">No Transactions Found</h4>
            <p className="text-gray-600">
              {allTransactions.length === 0
                ? "Start adding income and expenses to see your transaction history."
                : "Try adjusting your filters to see more transactions."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTransactions
              .map(transaction => {
                const isIncome = transaction.type === 'income';
                const color = isIncome ? 'green' : getCategoryColor(transaction.category);
                const transactionKey = `${transaction.type}-${transaction.id}`;
                const isEditing = editingTransaction === transactionKey;
                
                return (
                  <div key={transactionKey} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              {isIncome ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Description"
                              />
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-gray-600">Amount:</span>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-3 mb-2">
                            {isIncome ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <h4 className="font-medium text-gray-800">{transaction.description}</h4>
                            {isIncome ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Income
                              </span>
                            ) : (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
                                {transaction.subcategoryName}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                          {isIncome ? (
                            <span>Source: {(transaction as IncomeTransaction).source}</span>
                          ) : (
                            <span>{transaction.categoryName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`flex items-center text-lg font-semibold ${
                            isIncome ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isIncome ? '+' : '-'}
                            ₹{transaction.amount.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleEditSave(transaction.id, transaction.type)}
                                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                title="Save changes"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                                title="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditStart(transaction, transaction.type)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit transaction"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(transaction.id, transaction.type, transaction.description)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Delete transaction"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};