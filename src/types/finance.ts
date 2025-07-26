export interface SubCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  allocatedPercentage: number;
  spentAmount: number;
  balance: number;
  expenses: Expense[];
}

export interface MainCategory {
  id: string;
  name: string;
  percentage: number;
  totalAllocated: number;
  totalSpent: number;
  totalBalance: number;
  subcategories: SubCategory[];
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  subcategoryId: string;
}

export interface IncomeTransaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  source: string;
}

export interface EMI {
  id: string;
  name: string;
  amount: number;
  tenureLeft: number;
  totalTenure: number;
  paidCount: number;
  isActive: boolean;
}

export interface Debt {
  id: string;
  name: string;
  pendingAmount: number;
  monthlyPayment: number;
  totalMonths: number;
  paidAmount: number;
  isActive: boolean;
  reminderDate?: Date;
}

export interface FinanceState {
  income: number;
  incomeTransactions: IncomeTransaction[];
  categories: MainCategory[];
  emis: EMI[];
  debts: Debt[];
  transactions: Expense[];
}