import React, { useState } from 'react';
import { Edit3, Plus, DollarSign, Calendar, Trash2, Check, X } from 'lucide-react';
import { SubCategory } from '../types/finance';

interface SubcategoryItemProps {
  subcategory: SubCategory;
  categoryColor: string;
  isManagementMode: boolean;
  onUpdate: (newAmount: number) => void;
  onExpenseAdd: (expense: { amount: number; description: string; date: Date }) => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export const SubcategoryItem: React.FC<SubcategoryItemProps> = ({
  subcategory,
  categoryColor,
  isManagementMode,
  onUpdate,
  onExpenseAdd,
  onRename,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(subcategory.allocatedAmount.toString());
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(subcategory.name);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(editAmount);
    if (amount >= 0) {
      onUpdate(amount);
      setIsEditing(false);
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== subcategory.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
    setNewName(subcategory.name);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setNewName(subcategory.name);
  };

  const handleExpenseAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
    if (amount > 0 && expenseDescription.trim()) {
      onExpenseAdd({
        amount,
        description: expenseDescription.trim(),
        date: new Date(expenseDate)
      });
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setShowExpenseForm(false);
    }
  };

  const progressPercentage = subcategory.allocatedAmount > 0 
    ? Math.min((subcategory.spentAmount / subcategory.allocatedAmount) * 100, 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          {!isRenaming ? (
            <h4 className="font-medium text-gray-800 dark:text-white text-sm md:text-base">{subcategory.name}</h4>
          ) : (
            <form onSubmit={handleRename} className="flex items-center space-x-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                autoFocus
                required
              />
              <button
                type="submit"
                className="p-1 text-green-600 hover:text-green-800 transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={cancelRename}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs md:text-sm text-gray-600 mt-1 space-y-1 sm:space-y-0">
            {!isEditing ? (
              <>
                <span>Allocated: ₹{subcategory.allocatedAmount.toLocaleString()}</span>
                <span>Spent: ₹{subcategory.spentAmount.toLocaleString()}</span>
                <span className={subcategory.balance < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {subcategory.balance < 0 ? 'Over' : 'Left'}: ₹{Math.abs(subcategory.balance).toLocaleString()}
                </span>
              </>
            ) : (
              <form onSubmit={handleUpdate} className="flex space-x-2">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
                <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">
                  Save
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditAmount(subcategory.allocatedAmount.toString());
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isManagementMode && !isRenaming && !isEditing && (
            <>
              <button
                onClick={() => setIsRenaming(true)}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                title="Rename subcategory"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                title="Delete subcategory"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {!isEditing && !isManagementMode && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          )}
          {!isManagementMode && (
            <button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progressPercentage > 100 ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progressPercentage.toFixed(1)}% utilized
          {progressPercentage > 100 && ` (${(progressPercentage - 100).toFixed(1)}% over budget)`}
        </p>
      </div>

      {showExpenseForm && (
        <form onSubmit={handleExpenseAdd} className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="flex-1">
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => setShowExpenseForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Recent Expenses */}
      {subcategory.expenses.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Expenses</h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {subcategory.expenses.slice(-3).map(expense => (
              <div key={expense.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <span>{expense.description}</span>
                <div className="flex items-center space-x-2">
                  <span>₹{expense.amount.toLocaleString()}</span>
                  <span>{new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};