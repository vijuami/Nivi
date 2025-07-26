import React, { useState } from 'react';
import { DollarSign, Plus, Edit3, Trash2, Calendar } from 'lucide-react';
import { IncomeTransaction } from '../types/finance';

interface IncomeInputProps {
  currentIncome: number;
  incomeTransactions: IncomeTransaction[];
  onIncomeAdd: (amount: number, description: string, source: string, date: Date) => void;
  onIncomeEdit: (id: string, amount: number, description: string, source: string, date: Date) => void;
  onIncomeDelete: (id: string) => void;
}

export const IncomeInput: React.FC<IncomeInputProps> = ({ 
  currentIncome, 
  incomeTransactions, 
  onIncomeAdd, 
  onIncomeEdit, 
  onIncomeDelete 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incomeAmount = parseFloat(amount);
    if (incomeAmount > 0 && description.trim() && source.trim()) {
      if (editingId) {
        onIncomeEdit(editingId, incomeAmount, description.trim(), source.trim(), new Date(date));
        setEditingId(null);
      } else {
        onIncomeAdd(incomeAmount, description.trim(), source.trim(), new Date(date));
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSource('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (transaction: IncomeTransaction) => {
    setAmount(transaction.amount.toString());
    setDescription(transaction.description);
    setSource(transaction.source);
    setDate(new Date(transaction.date).toISOString().split('T')[0]);
    setEditingId(transaction.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this income transaction?')) {
      onIncomeDelete(id);
    }
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
  };

  const cancelEditing = () => {
    resetForm();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-4 md:mb-6 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 p-3 rounded-lg">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Total Income</h2>
            <p className="text-2xl md:text-3xl font-bold text-green-600">₹{currentIncome.toLocaleString()}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{incomeTransactions.length} income sources</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          {incomeTransactions.length > 0 && (
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="flex items-center justify-center space-x-2 bg-gray-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              <Calendar className="h-4 w-4" />
              <span>{showTransactions ? 'Hide' : 'View'} History</span>
            </button>
          )}
          {!isAdding && (
            <button
              onClick={startAdding}
              className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Income</span>
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Salary, Bonus, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Company, Freelance, etc."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              {editingId ? 'Update Income' : 'Add Income'}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Income Transactions History */}
      {showTransactions && incomeTransactions.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Income History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {incomeTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-800">{transaction.description}</h4>
                      <span className="text-sm text-gray-600">from {transaction.source}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-green-600">
                      +₹{transaction.amount.toLocaleString()}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};