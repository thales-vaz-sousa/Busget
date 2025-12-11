
import { BudgetData, Transaction, TransactionType } from '../types';

/**
 * Checks if a rollover is needed for the new month.
 * If the current month is different from the lastRolloverMonth,
 * it calculates the surplus/deficit from the *previous* month and updates the budget.
 */
export const checkAndProcessRollover = (
  currentBudget: BudgetData,
  transactions: Transaction[]
): { updatedBudget: BudgetData; message: string } | null => {
  const now = new Date();
  const currentMonthKey = now.toISOString().slice(0, 7); // "YYYY-MM"

  // If we have already processed this month, do nothing
  if (currentBudget.lastRolloverMonth === currentMonthKey) {
    return null;
  }

  // Determine the previous month context
  // We want to calculate the surplus of the IMMEDIATELY preceding month to the current one.
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = prevDate.toISOString().slice(0, 7); // "YYYY-MM"

  // 1. Calculate Expenses for the previous month
  const prevMonthExpenses = transactions.reduce((sum, t) => {
    const tMonthKey = t.date.slice(0, 7);
    if (t.type === TransactionType.EXPENSE && tMonthKey === prevMonthKey) {
      return sum + t.amount;
    }
    return sum;
  }, 0);

  // 2. Calculate the Surplus (Base Amount - Actual Expenses)
  // We use the baseAmount because rollover is usually "extra" on top of the standard plan.
  // Using monthlyLimit (which might include previous rollover) could lead to infinite accumulation issues 
  // if not handled carefully, but standard practice is often (Limit - Expenses).
  // Let's use the Effective Limit of the previous month.
  // Assumption: The 'monthlyLimit' stored in state was the effective limit for that previous month.
  
  const surplus = currentBudget.monthlyLimit - prevMonthExpenses;

  // 3. New Rollover Amount
  // We cap negative rollovers (debt) if desired, but let's allow it to be negative or positive.
  // Strategy: The new month starts fresh with Base Amount + Surplus from previous.
  const newRollover = surplus; 
  const newEffectiveLimit = currentBudget.baseAmount + newRollover;

  const updatedBudget: BudgetData = {
    baseAmount: currentBudget.baseAmount,
    rolloverAmount: newRollover,
    monthlyLimit: newEffectiveLimit,
    lastRolloverMonth: currentMonthKey,
  };

  let message = '';
  if (newRollover > 0) {
    message = `Rollover processed! You have an extra $${newRollover.toFixed(2)} from last month! 🦋`;
  } else if (newRollover < 0) {
    message = `Budget adjusted. Last month's overspending of $${Math.abs(newRollover).toFixed(2)} was deducted.`;
  } else {
    message = `New month started. Your budget is reset to $${currentBudget.baseAmount}.`;
  }

  return { updatedBudget, message };
};
