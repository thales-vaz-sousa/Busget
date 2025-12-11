
export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export enum Category {
  HOUSING = 'Housing',
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTHCARE = 'Healthcare',
  PERSONAL = 'Personal',
  SHOPPING = 'Shopping',
  INCOME = 'Income',
  OTHER = 'Other',
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  description: string;
  amount: number;
  category: Category;
  type: TransactionType;
  isRecurring?: boolean;
  isPaid?: boolean;       // New field: Tracks if the expense is paid
  reminderSent?: boolean; // New field: Prevents spamming reminders
}

export interface BudgetData {
  monthlyLimit: number;      // The effective limit (base + rollover)
  baseAmount: number;        // The user-defined standard monthly budget
  rolloverAmount: number;    // The surplus/deficit from previous month
  lastRolloverMonth: string; // The last month processed (YYYY-MM)
}

export interface SavingsGoal {
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  lastCheckDate?: string;
}

export interface OcrResult {
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
}

export interface MealPlanRecipe {
  recipe_name: string;
  cuisine_type: string;
  ingredients_used: string[];
  prep_time: string;
  cook_time: string;
  cooking_steps: string[];
  image_search_query: string;
}

export interface PredictedItem {
  name: string;
  lastBoughtDate: string;
  daysAgo: number;
  predictedDate: string;
  avgFrequencyDays: number;
}

export interface YoYStats {
  currentMonthTotal: number;
  lastYearMonthTotal: number;
  variance: number;
  percentageChange: number;
  hasHistory: boolean;
}
