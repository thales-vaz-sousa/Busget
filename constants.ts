
import { Category, SavingsGoal } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.HOUSING]: '#a78bfa', // Violet 400
  [Category.FOOD]: '#f472b6', // Pink 400
  [Category.TRANSPORT]: '#34d399', // Emerald 400
  [Category.UTILITIES]: '#60a5fa', // Blue 400
  [Category.ENTERTAINMENT]: '#fbbf24', // Amber 400
  [Category.HEALTHCARE]: '#f87171', // Red 400
  [Category.PERSONAL]: '#c084fc', // Purple 400
  [Category.SHOPPING]: '#2dd4bf', // Teal 400
  [Category.INCOME]: '#a3e635', // Lime 400
  [Category.OTHER]: '#9ca3af', // Gray 400
};

export const INITIAL_BUDGET = 2000;

export const INITIAL_SAVINGS_GOAL: SavingsGoal = {
  name: 'Dream Vacation',
  targetAmount: 5000,
  currentAmount: 1250,
};

export const SAMPLE_DATA = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    description: 'Grocery Store',
    amount: 85.50,
    category: Category.FOOD,
    type: 'expense',
    isPaid: true,
    reminderSent: false
  },
  {
    id: '2',
    date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], // Set due in 2 days for testing
    description: 'Electric Bill',
    amount: 120.00,
    category: Category.UTILITIES,
    type: 'expense',
    isPaid: false,
    reminderSent: false,
    isRecurring: true
  },
  {
    id: '3',
    date: new Date().toISOString().split('T')[0],
    description: 'Monthly Salary',
    amount: 3500.00,
    category: Category.INCOME,
    type: 'income',
    isPaid: true,
    reminderSent: false
  }
];

export const CATEGORY_KEYWORDS: Record<string, Category> = {
  'grocery': Category.FOOD,
  'supermarket': Category.FOOD,
  'market': Category.FOOD,
  'food': Category.FOOD,
  'restaurant': Category.FOOD,
  'cafe': Category.FOOD,
  'coffee': Category.FOOD,
  'pizza': Category.FOOD,
  'burger': Category.FOOD,
  'uber': Category.TRANSPORT,
  'lyft': Category.TRANSPORT,
  'gas': Category.TRANSPORT,
  'fuel': Category.TRANSPORT,
  'shell': Category.TRANSPORT,
  'chevron': Category.TRANSPORT,
  'parking': Category.TRANSPORT,
  'electric': Category.UTILITIES,
  'water': Category.UTILITIES,
  'internet': Category.UTILITIES,
  'wifi': Category.UTILITIES,
  'mobile': Category.UTILITIES,
  'phone': Category.UTILITIES,
  'cinema': Category.ENTERTAINMENT,
  'movie': Category.ENTERTAINMENT,
  'netflix': Category.ENTERTAINMENT,
  'spotify': Category.ENTERTAINMENT,
  'hulu': Category.ENTERTAINMENT,
  'doctor': Category.HEALTHCARE,
  'pharmacy': Category.HEALTHCARE,
  'cvs': Category.HEALTHCARE,
  'walgreens': Category.HEALTHCARE,
  'gym': Category.PERSONAL,
  'fitness': Category.PERSONAL,
  'hair': Category.PERSONAL,
  'salon': Category.PERSONAL,
  'amazon': Category.SHOPPING,
  'target': Category.SHOPPING,
  'walmart': Category.SHOPPING,
  'clothes': Category.SHOPPING,
  'shoes': Category.SHOPPING,
  'rent': Category.HOUSING,
  'mortgage': Category.HOUSING,
};
