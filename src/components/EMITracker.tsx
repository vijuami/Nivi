import React, { useState } from 'react';
import { Plus, CreditCard, Calendar, TrendingUp, CheckCircle, Clock, Edit3, Trash2 } from 'lucide-react';
import { EMI } from '../types/finance';
import { calculateEMIProgress } from '../utils/financeCalculations';

interface EMITrackerProps {
  emis: EMI[];
  onEMIAdd: (emi: Omit<EMI, 'id'>) => void;
  onEMIPayment: (emiId: string) => void;
  onEMIEdit: (emiId: string, emi: Omit<EMI, 'id'>) => void;
  onEMIDelete: (emiId: string) => void;
}

export const EMITracker: React.FC<EMITrackerProps> = ({
  emis,
  onEMIAdd,
  onEMIPayment,
  onEMIEdit,
  onEMIDelete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    tenureLeft: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    const tenureLeft = parseInt(formData.tenureLeft);
    
    if (amount > 0 && tenureLeft > 0) {
      if (editingId) {
        onEMIEdit(editingId, {
          name: formData.name.trim(),
          amount,
          totalTenure: tenureLeft,
          tenureLeft,
          paidCount: 0,
          isActive: tenureLeft > 0
        });
        setEditingId(null);
      } else {
        onEMIAdd({
          name: formData.name.trim(),
          amount,
          totalTenure: tenureLeft,
          tenureLeft,
          paidCount: 0,
          isActive: tenureLeft > 0
        });
      }
      
      setFormData({ name: '', amount: '', tenureLeft: '' });
      setShowForm(false);
    }
  };

  const handleEdit = (emi: EMI) => {
    setFormData({
      name: emi.name,
      amount: emi.amount.toString(),
      tenureLeft: emi.tenureLeft.toString()
    });
    setEditingId(emi.id);
    setShowForm(true);
  };

  const handleDelete = (emiId: string) => {
    if (window.confirm('Are you sure you want to delete this EMI?')) {
      onEMIDelete(emiId);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', amount: '', tenureLeft: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const activeEMIs = emis.filter(emi => emi.isActive);
  const completedEMIs = emis.filter(emi => !emi.isActive);
  const totalMonthlyEMI = activeEMIs.reduce((sum, emi) => sum + emi.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-3 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">EMI Tracker</h2>
              <p className="text-gray-600">Manage your loan EMIs and track progress</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add EMI</span>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-1">Active EMIs</h3>
            <p className="text-2xl font-bold text-blue-600">{activeEMIs.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-1">Monthly Commitment</h3>
            <p className="text-2xl font-bold text-green-600">₹{totalMonthlyEMI.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800 mb-1">Completed EMIs</h3>
            <p className="text-2xl font-bold text-purple-600">{completedEMIs.length}</p>
          </div>
        </div>
      </div>

      {/* Add EMI Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Edit EMI' : 'Add New EMI'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EMI Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Home Loan, Car Loan, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly EMI Amount
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenure Left (Months)
                </label>
                <input
                  type="number"
                  value={formData.tenureLeft}
                  onChange={(e) => setFormData({ ...formData, tenureLeft: e.target.value })}
                  placeholder="36"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                {editingId ? 'Update EMI' : 'Add EMI'}
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

      {/* Active EMIs */}
      {activeEMIs.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-blue-500" />
            Active EMIs
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEMIs.map(emi => {
              const remainingProgress = (emi.tenureLeft / emi.totalTenure) * 100;
              return (
                <div key={emi.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">{emi.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{emi.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleEdit(emi)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit EMI"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emi.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete EMI"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Monthly Payment: ₹{emi.amount.toLocaleString()}</span>
                      <span>{emi.tenureLeft} months left</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Outstanding: ₹{(emi.amount * emi.tenureLeft).toLocaleString()}</span>
                      <span>Paid: {emi.paidCount} installments</span>
                    </div>
                    
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-red-500 rounded-full transition-all duration-300"
                        style={{ width: `${remainingProgress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {remainingProgress.toFixed(1)}% remaining
                      </span>
                      <button
                        onClick={() => onEMIPayment(emi.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Mark as Paid
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed EMIs */}
      {completedEMIs.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Completed EMIs
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {completedEMIs.map(emi => (
              <div key={emi.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{emi.name}</h4>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <button
                      onClick={() => handleDelete(emi.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete EMI"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Monthly Amount: ₹{emi.amount.toLocaleString()}</p>
                  <p>Total Tenure: {emi.totalTenure} months</p>
                  <p className="text-green-600 font-medium">✓ Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {emis.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No EMIs Added</h3>
          <p className="text-gray-600 mb-4">Start tracking your loan EMIs to manage your monthly commitments.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Your First EMI
          </button>
        </div>
      )}
    </div>
  );
};