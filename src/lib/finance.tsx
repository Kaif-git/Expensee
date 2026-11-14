import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const CATEGORIES = [
  { name: 'Food', icon: '🍜', color: '#F59E0B' },
  { name: 'Transport', icon: '🚕', color: '#4F7DF3' },
  { name: 'Shopping', icon: '🛍️', color: '#E879A9' },
  { name: 'Bills', icon: '🧾', color: '#8B6DE9' },
  { name: 'Health', icon: '💊', color: '#36A889' },
  { name: 'Entertainment', icon: '🎬', color: '#F07855' },
  { name: 'Other', icon: '✨', color: '#8290A3' },
] as const;

export type Category = (typeof CATEGORIES)[number]['name'];
export type Expense = { id: string; title: string; amount: number; category: Category; date: string; note?: string };
type FinanceContextValue = {
  expenses: Expense[]; budget: number; currency: string; ready: boolean;
  addExpense: (expense: Omit<Expense, 'id'>, id?: string) => void;
  deleteExpense: (id: string) => void; setBudget: (budget: number) => void; setCurrency: (currency: string) => void;
};

const STORAGE_KEY = 'expenss-tracker-v1';
const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudgetState] = useState(1500);
  const [currency, setCurrencyState] = useState('USD');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        try {
          const saved = JSON.parse(value) as { expenses?: Expense[]; budget?: number; currency?: string };
          setExpenses(Array.isArray(saved.expenses) ? saved.expenses : []);
          if (typeof saved.budget === 'number') setBudgetState(saved.budget);
          if (saved.currency) setCurrencyState(saved.currency);
        } catch { /* Ignore an invalid local save and start fresh. */ }
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ expenses, budget, currency })).catch(() => {});
  }, [expenses, budget, currency, ready]);

  const value = useMemo<FinanceContextValue>(() => ({
    expenses,
    budget,
    currency,
    ready,
    addExpense: (expense, id) => setExpenses((current) => {
      const item = { ...expense, id: id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
      const existingIndex = current.findIndex((entry) => entry.id === item.id);
      if (existingIndex < 0) return [item, ...current];
      return current.map((entry) => entry.id === item.id ? item : entry);
    }),
    deleteExpense: (id) => setExpenses((current) => current.filter((expense) => expense.id !== id)),
    setBudget: (next) => setBudgetState(next),
    setCurrency: (next) => setCurrencyState(next),
  }), [expenses, budget, currency, ready]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error('useFinance must be used within FinanceProvider');
  return value;
}

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'CAD', 'AUD'] as const;
export const currencySymbol = (currency: string) => ({ USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', CAD: 'CA$', AUD: 'A$' }[currency] ?? '$');
export const formatMoney = (amount: number, currency: string) => `${currencySymbol(currency)}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
