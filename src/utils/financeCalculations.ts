import { MainCategory, SubCategory, EMI, Debt } from '../types/finance';

export const MAIN_CATEGORIES = [
  { id: 'needs', name: 'NEEDS', percentage: 60 },
  { id: 'wants', name: 'WANTS', percentage: 20 },
  { id: 'goals', name: 'GOALS', percentage: 15 },
  { id: 'unwanted', name: 'UNWANTED & UNEXPECTED', percentage: 5 }
];

export const DEFAULT_SUBCATEGORIES = {
  needs: [
    { name: 'Bank EMI', percentage: 30 },
    { name: 'Debts', percentage: 20 },
    { name: 'Home Needs', percentage: 15 },
    { name: 'Bills', percentage: 20 },
    { name: 'Education', percentage: 10 },
    { name: 'Insurances', percentage: 5 }
  ],
  wants: [
    { name: 'Vehicle (Gas/Repair)', percentage: 25 },
    { name: 'Phone/Gadgets', percentage: 20 },
    { name: 'Dr/Pharmacy Visits', percentage: 30 },
    { name: 'Investments', percentage: 25 }
  ],
  goals: [
    { name: 'New Home', percentage: 40 },
    { name: 'New Vehicle', percentage: 30 },
    { name: 'New Furniture/Gadgets', percentage: 20 },
    { name: 'Tours/Travels', percentage: 10 }
  ],
  unwanted: [
    { name: 'Hotels/Restaurants', percentage: 40 },
    { name: 'Entertainment', percentage: 35 },
    { name: 'Parties', percentage: 25 }
  ]
};

export const calculateCategoryAllocation = (income: number, percentage: number): number => {
  return (income * percentage) / 100;
};

export const calculateSubcategoryAllocation = (
  categoryAmount: number,
  subcategories: SubCategory[]
): SubCategory[] => {
  return subcategories.map(sub => ({
    ...sub,
    allocatedAmount: (categoryAmount * sub.allocatedPercentage) / 100,
    balance: (categoryAmount * sub.allocatedPercentage) / 100 - sub.spentAmount
  }));
};

export const redistributeSubcategories = (
  subcategories: SubCategory[],
  changedSubId: string,
  newAmount: number,
  totalCategoryAmount: number
): SubCategory[] => {
  const changedSub = subcategories.find(s => s.id === changedSubId);
  if (!changedSub) return subcategories;

  const otherSubs = subcategories.filter(s => s.id !== changedSubId);
  const remainingAmount = totalCategoryAmount - newAmount;
  const totalOtherPercentage = otherSubs.reduce((sum, sub) => sum + sub.allocatedPercentage, 0);

  return subcategories.map(sub => {
    if (sub.id === changedSubId) {
      return {
        ...sub,
        allocatedAmount: newAmount,
        allocatedPercentage: (newAmount / totalCategoryAmount) * 100,
        balance: newAmount - sub.spentAmount
      };
    } else {
      const newPercentage = totalOtherPercentage > 0 
        ? (sub.allocatedPercentage / totalOtherPercentage) * ((remainingAmount / totalCategoryAmount) * 100)
        : (remainingAmount / totalCategoryAmount) * 100 / otherSubs.length;
      const newAmount = (remainingAmount / otherSubs.length);
      
      return {
        ...sub,
        allocatedAmount: newAmount,
        allocatedPercentage: newPercentage,
        balance: newAmount - sub.spentAmount
      };
    }
  });
};

export const calculateEMIProgress = (emi: EMI): number => {
  return ((emi.totalTenure - emi.tenureLeft) / emi.totalTenure) * 100;
};

export const calculateDebtTimeline = (pendingAmount: number, monthlyPayment: number): number => {
  return Math.ceil(pendingAmount / monthlyPayment);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};