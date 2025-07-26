import React, { useState } from 'react';
import { Edit3, Plus, Minus, ArrowRightLeft, Settings, X, Check } from 'lucide-react';
import { MainCategory, SubCategory } from '../types/finance';
import { SubcategoryItem } from './SubcategoryItem';

interface CategoryCardProps {
  category: MainCategory;
  onSubcategoryUpdate: (categoryId: string, subcategoryId: string, newAmount: number) => void;
  onExpenseAdd: (subcategoryId: string, expense: { amount: number; description: string; date: Date }) => void;
  onTransfer: (fromCategoryId: string, toCategoryId: string, amount: number) => void;
  onSubcategoryAdd: (categoryId: string, name: string, percentage: number) => void;
  onSubcategoryDelete: (categoryId: string, subcategoryId: string) => void;
  onSubcategoryRename: (categoryId: string, subcategoryId: string, newName: string) => void;
  categories: MainCategory[];
}

const getCategoryColor = (categoryId: string) => {
  switch (categoryId) {
    case 'needs': return 'green';
    case 'wants': return 'blue';
    case 'goals': return 'purple';
    case 'unwanted': return 'red';
    default: return 'gray';
  }
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onSubcategoryUpdate,
  onExpenseAdd,
  onTransfer,
  onSubcategoryAdd,
  onSubcategoryDelete,
  onSubcategoryRename,
  categories
}) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [showManagement, setShowManagement] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryPercentage, setNewSubcategoryPercentage] = useState('');
  
  const color = getCategoryColor(category.id);
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const headerColorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (amount > 0 && targetCategory && amount <= category.totalBalance) {
      onTransfer(category.id, targetCategory, amount);
      setTransferAmount('');
      setTargetCategory('');
      setShowTransfer(false);
    }
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    const percentage = parseFloat(newSubcategoryPercentage);
    if (newSubcategoryName.trim() && percentage > 0 && percentage <= 100) {
      onSubcategoryAdd(category.id, newSubcategoryName.trim(), percentage);
      setNewSubcategoryName('');
      setNewSubcategoryPercentage('');
      setShowAddForm(false);
    }
  };

  const handleDeleteSubcategory = (subcategoryId: string, subcategoryName: string) => {
    if (window.confirm(`Are you sure you want to delete "${subcategoryName}"? This action cannot be undone.`)) {
      onSubcategoryDelete(category.id, subcategoryId);
    }
  };

  return (
    <div className={`rounded-lg md:rounded-xl border-2 ${colorClasses[color]} overflow-hidden transition-colors duration-300`}>
      <div className={`${headerColorClasses[color]} text-white p-3 md:p-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <h3 className="text-base md:text-lg font-semibold">{category.name}</h3>
            <p className="text-sm opacity-90">{category.percentage}% of income</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl md:text-2xl font-bold">₹{category.totalAllocated.toLocaleString()}</p>
            <p className="text-sm opacity-90">
              Balance: ₹{category.totalBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:space-x-4 text-xs md:text-sm space-y-1 sm:space-y-0">
            <span>Allocated: ₹{category.totalAllocated.toLocaleString()}</span>
            <span>Spent: ₹{category.totalSpent.toLocaleString()}</span>
            <span className={category.totalBalance < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
              {category.totalBalance < 0 ? 'Overspent' : 'Remaining'}: ₹{Math.abs(category.totalBalance).toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowManagement(!showManagement)}
              className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 transition-colors text-sm"
            >
              <Settings className="h-4 w-4" />
              <span>Manage</span>
            </button>
            <button
              onClick={() => setShowTransfer(!showTransfer)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors text-sm"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Management Panel */}
        {showManagement && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-800">Manage Subcategories</h4>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>
            
            {showAddForm && (
              <form onSubmit={handleAddSubcategory} className="mb-3 p-3 bg-white rounded border">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="Subcategory name"
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                  <input
                    type="number"
                    value={newSubcategoryPercentage}
                    onChange={(e) => setNewSubcategoryPercentage(e.target.value)}
                    placeholder="% of category"
                    className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                    min="0.1"
                    max="100"
                    step="0.1"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSubcategoryName('');
                      setNewSubcategoryPercentage('');
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
            
            <p className="text-xs text-gray-600">
              Note: Adding/removing subcategories will redistribute allocations proportionally
            </p>
          </div>
        )}
        {showTransfer && (
          <form onSubmit={handleTransfer} className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                max={category.totalBalance}
                required
              />
              <select
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories
                  .filter(cat => cat.id !== category.id)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))
                }
              </select>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Transfer
              </button>
              <button
                type="button"
                onClick={() => setShowTransfer(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {category.subcategories.map(subcategory => (
            <SubcategoryItem
              key={subcategory.id}
              subcategory={subcategory}
              categoryColor={color}
              isManagementMode={showManagement}
              onUpdate={(newAmount) => onSubcategoryUpdate(category.id, subcategory.id, newAmount)}
              onExpenseAdd={(expense) => onExpenseAdd(subcategory.id, expense)}
              onRename={(newName) => onSubcategoryRename(category.id, subcategory.id, newName)}
              onDelete={() => handleDeleteSubcategory(subcategory.id, subcategory.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};