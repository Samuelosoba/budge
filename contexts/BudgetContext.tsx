import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useApi } from './ApiContext';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: {
    _id: string;
    name: string;
    color: string;
    type: 'income' | 'expense';
  };
  type: 'income' | 'expense';
  date: string;
  isRecurring?: boolean;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  budget?: number;
  icon?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
  isConnected: boolean;
  bankName?: string;
}

interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  bankAccounts: BankAccount[];
  monthlyBudget: number;
  isLoading: boolean;
  error: string | null;
}

interface BudgetContextType {
  state: BudgetState;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'category'> & { category: string }) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;
  updateBankAccount: (account: BankAccount) => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getBalance: () => number;
  getCategorySpending: (categoryId: string) => number;
  refreshData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const { get, post, put, delete: deleteApi } = useApi();
  
  const [state, setState] = useState<BudgetState>({
    transactions: [],
    categories: [],
    bankAccounts: [],
    monthlyBudget: 3000,
    isLoading: false,
    error: null,
  });

  // Load data when user is authenticated
  useEffect(() => {
    if (user && token) {
      refreshData();
    } else {
      // Clear data when user logs out
      setState(prev => ({
        ...prev,
        transactions: [],
        categories: [],
        bankAccounts: [],
        monthlyBudget: 3000,
      }));
    }
  }, [user, token]);

  const refreshData = async () => {
    if (!token) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [transactionsRes, categoriesRes, bankAccountsRes] = await Promise.all([
        get('/transactions', token),
        get('/categories', token),
        get('/bank-accounts', token),
      ]);

      setState(prev => ({
        ...prev,
        transactions: transactionsRes.transactions.map((t: any) => ({
          id: t._id,
          amount: t.amount,
          description: t.description,
          category: {
            _id: t.category._id,
            name: t.category.name,
            color: t.category.color,
            type: t.category.type,
          },
          type: t.type,
          date: t.date,
          isRecurring: t.isRecurring,
          notes: t.notes,
        })),
        categories: categoriesRes.categories.map((c: any) => ({
          id: c._id,
          name: c.name,
          color: c.color,
          type: c.type,
          budget: c.budget,
          icon: c.icon,
        })),
        bankAccounts: bankAccountsRes.accounts.map((a: any) => ({
          id: a._id,
          name: a.name,
          balance: a.balance,
          type: a.type,
          isConnected: a.isConnected,
          bankName: a.bankName,
        })),
        monthlyBudget: user?.monthlyBudget || 3000,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'category'> & { category: string }) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await post('/transactions', {
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        type: transactionData.type,
        date: transactionData.date,
        notes: transactionData.notes,
      }, token);

      const newTransaction: Transaction = {
        id: response.transaction._id,
        amount: response.transaction.amount,
        description: response.transaction.description,
        category: response.transaction.category,
        type: response.transaction.type,
        date: response.transaction.date,
        isRecurring: response.transaction.isRecurring,
        notes: response.transaction.notes,
      };

      setState(prev => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }));
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await put(`/transactions/${transaction.id}`, {
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category._id,
        type: transaction.type,
        date: transaction.date,
        notes: transaction.notes,
      }, token);

      const updatedTransaction: Transaction = {
        id: response.transaction._id,
        amount: response.transaction.amount,
        description: response.transaction.description,
        category: response.transaction.category,
        type: response.transaction.type,
        date: response.transaction.date,
        isRecurring: response.transaction.isRecurring,
        notes: response.transaction.notes,
      };

      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t =>
          t.id === transaction.id ? updatedTransaction : t
        ),
      }));
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      await deleteApi(`/transactions/${id}`, token);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await post('/categories', categoryData, token);
      const newCategory: Category = {
        id: response.category._id,
        name: response.category.name,
        color: response.category.color,
        type: response.category.type,
        budget: response.category.budget,
        icon: response.category.icon,
      };

      setState(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }));

      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await put(`/categories/${category.id}`, {
        name: category.name,
        color: category.color,
        budget: category.budget,
        icon: category.icon,
      }, token);

      const updatedCategory: Category = {
        id: response.category._id,
        name: response.category.name,
        color: response.category.color,
        type: response.category.type,
        budget: response.category.budget,
        icon: response.category.icon,
      };

      setState(prev => ({
        ...prev,
        categories: prev.categories.map(c =>
          c.id === category.id ? updatedCategory : c
        ),
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!token) throw new Error('No authentication token');

    try {
      await deleteApi(`/categories/${id}`, token);
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addBankAccount = async (accountData: Omit<BankAccount, 'id'>) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await post('/bank-accounts', accountData, token);
      const newAccount: BankAccount = {
        id: response.account._id,
        name: response.account.name,
        balance: response.account.balance,
        type: response.account.type,
        isConnected: response.account.isConnected,
        bankName: response.account.bankName,
      };

      setState(prev => ({
        ...prev,
        bankAccounts: [...prev.bankAccounts, newAccount],
      }));
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw error;
    }
  };

  const updateBankAccount = async (account: BankAccount) => {
    if (!token) throw new Error('No authentication token');

    try {
      const response = await put(`/bank-accounts/${account.id}`, {
        name: account.name,
        balance: account.balance,
        isConnected: account.isConnected,
        bankName: account.bankName,
      }, token);

      const updatedAccount: BankAccount = {
        id: response.account._id,
        name: response.account.name,
        balance: response.account.balance,
        type: response.account.type,
        isConnected: response.account.isConnected,
        bankName: response.account.bankName,
      };

      setState(prev => ({
        ...prev,
        bankAccounts: prev.bankAccounts.map(a =>
          a.id === account.id ? updatedAccount : a
        ),
      }));
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  };

  const setMonthlyBudget = async (budget: number) => {
    if (!token) throw new Error('No authentication token');

    try {
      await put('/budget/monthly', { monthlyBudget: budget }, token);
      setState(prev => ({
        ...prev,
        monthlyBudget: budget,
      }));
    } catch (error) {
      console.error('Error updating monthly budget:', error);
      throw error;
    }
  };

  const getTotalIncome = () => {
    return state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const getCategorySpending = (categoryId: string) => {
    return state.transactions
      .filter(t => t.category._id === categoryId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <BudgetContext.Provider value={{
      state,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addBankAccount,
      updateBankAccount,
      setMonthlyBudget,
      getTotalIncome,
      getTotalExpenses,
      getBalance,
      getCategorySpending,
      refreshData,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}