import React, { useState } from 'react';
import { Plus, Target, TrendingDown, CheckCircle, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { Debt } from '../types/finance';
import { calculateDebtTimeline } from '../utils/financeCalculations';

interface DebtTrackerProps {
  debts: Debt[];
  isReminding: boolean;
  onDebtAdd: (debt: Omit<Debt, 'id'>) => void;
  onDebtPayment: (debtId: string) => void;
  onDebtEdit: (debtId: string, debt: Omit<Debt, 'id'>) => void;
  onDebtDelete: (debtId: string) => void;
}

export const DebtTracker: React.FC<DebtTrackerProps> = ({
  debts,
  isReminding,
  onDebtAdd,
  onDebtPayment,
  onDebtEdit,
  onDebtDelete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pendingAmount: '',
    monthlyPayment: '',
    reminderDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pendingAmount = parseFloat(formData.pendingAmount);
    const monthlyPayment = parseFloat(formData.monthlyPayment);
    
    if (pendingAmount > 0 && monthlyPayment > 0) {
      const totalMonths = calculateDebtTimeline(pendingAmount, monthlyPayment);
      const reminderDate = formData.reminderDate ? new Date(formData.reminderDate) : undefined;
      
      if (editingId) {
        onDebtEdit(editingId, {
          name: formData.name.trim(),
          pendingAmount,
          monthlyPayment,
          totalMonths,
          paidAmount: 0,
          isActive: true,
          reminderDate
        });
        setEditingId(null);
      } else {
        onDebtAdd({
          name: formData.name.trim(),
          pendingAmount,
          monthlyPayment,
          totalMonths,
          paidAmount: 0,
          isActive: true,
          reminderDate
        });
      }
      
      setFormData({ name: '', pendingAmount: '', monthlyPayment: '', reminderDate: '' });
      setShowForm(false);
    }
  };

  const handleEdit = (debt: Debt) => {
    setFormData({
      name: debt.name,
      pendingAmount: debt.pendingAmount.toString(),
      monthlyPayment: debt.monthlyPayment.toString(),
      reminderDate: debt.reminderDate ? new Date(debt.reminderDate).toISOString().split('T')[0] : ''
    });
    setEditingId(debt.id);
    setShowForm(true);
  };

  const handleDelete = (debtId: string) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      onDebtDelete(debtId);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', pendingAmount: '', monthlyPayment: '', reminderDate: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const activeDebts = debts.filter(debt => debt.isActive);
  const completedDebts = debts.filter(debt => !debt.isActive);
  const totalMonthlyDebt = activeDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  const totalPendingAmount = activeDebts.reduce((sum, debt) => sum + debt.pendingAmount, 0);

  return (
    <div className={`space-y-6 ${isReminding ? 'blink-animation' : ''}`}>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-red-500 p-3 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Debt Tracker</h2>
              <p className="text-gray-600">Manage and track your debt payments</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 bg-red-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Debt</span>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-1">Active Debts</h3>
            <p className="text-2xl font-bold text-red-600">{activeDebts.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-orange-800 mb-1">Monthly Payment</h3>
            <p className="text-2xl font-bold text-orange-600">₹{totalMonthlyDebt.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Total Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">₹{totalPendingAmount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Add Debt Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit Debt' : 'Add New Debt'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debt Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Credit Card, Personal Loan, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Payment
                </label>
                <input
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  placeholder="500.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pending Amount
                </label>
                <input
                  type="number"
                  value={formData.pendingAmount}
                  onChange={(e) => setFormData({ ...formData, pendingAmount: e.target.value })}
                  placeholder="10000.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reminder Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {formData.pendingAmount && formData.monthlyPayment && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Estimated Timeline:</strong> {' '}
                  {calculateDebtTimeline(parseFloat(formData.pendingAmount), parseFloat(formData.monthlyPayment))} months
                  ({Math.ceil(calculateDebtTimeline(parseFloat(formData.pendingAmount), parseFloat(formData.monthlyPayment)) / 12)} years)
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingId ? 'Update Debt' : 'Add Debt'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Debts */}
      {activeDebts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            Active Debts
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeDebts.map(debt => {
              const progress = debt.paidAmount / (debt.paidAmount + debt.pendingAmount) * 100;
              const monthsLeft = calculateDebtTimeline(debt.pendingAmount, debt.monthlyPayment);
              
              // Check if reminder is due (1 day before reminder date)
              const isReminderDue = debt.reminderDate && (() => {
                const today = new Date();
                const reminderDate = new Date(debt.reminderDate);
                const timeDiff = reminderDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                return daysDiff <= 1 && daysDiff >= 0;
              })();
              
              return (
                <div key={debt.id} className={`border border-red-200 rounded-lg p-4 ${isReminderDue ? 'bg-red-50 border-red-400' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">{debt.name}</h4>
                      {isReminderDue && (
                        <p className="text-sm text-red-600 font-medium">⚠️ Payment due soon!</p>
                      )}
                      {debt.reminderDate && (
                        <p className="text-xs text-gray-500">
                          Next reminder: {new Date(debt.reminderDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-red-600">
                        ₹{debt.pendingAmount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleEdit(debt)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit Debt"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(debt.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Debt"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Monthly Payment: ₹{debt.monthlyPayment.toLocaleString()}</span>
                      <span>{monthsLeft} months left</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Paid: ₹{debt.paidAmount.toLocaleString()}</p>
                        <p>{progress.toFixed(1)}% completed</p>
                      </div>
                      <button
                        onClick={() => onDebtPayment(debt.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Debts */}
      {completedDebts.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Completed Debts
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedDebts.map(debt => (
              <div key={debt.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{debt.name}</h4>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete Debt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Total Paid: ₹{debt.paidAmount.toLocaleString()}</p>
                  <p>Monthly Payment: ₹{debt.monthlyPayment.toLocaleString()}</p>
                  <p className="text-green-600 font-medium">✓ Debt Cleared</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {debts.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Debts Added</h3>
          <p className="text-gray-600 mb-4">Track your debts to create a clear payoff strategy.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Add Your First Debt
          </button>
        </div>
      )}
    </div>
  );
};