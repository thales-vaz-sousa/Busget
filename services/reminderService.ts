
import { Transaction, TransactionType } from '../types';

/**
 * Checks for expenses due in exactly 2 days that haven't been paid.
 * Returns a list of Transaction IDs that were reminded, so the app can update their 'reminderSent' status.
 */
export const checkReminders = (transactions: Transaction[]): string[] => {
  const remindedIds: string[] = [];

  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notification");
    return [];
  }

  if (Notification.permission !== 'granted') {
    return [];
  }

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Filter for: Expenses, NOT paid, Reminder NOT sent yet
  const pendingExpenses = transactions.filter(t => 
    t.type === TransactionType.EXPENSE && 
    !t.isPaid && 
    !t.reminderSent
  );

  pendingExpenses.forEach(expense => {
    // Parse expense date (acting as due date)
    // Note: dates are stored as YYYY-MM-DD string
    const dueDate = new Date(expense.date);
    dueDate.setHours(0, 0, 0, 0);

    // Calculate difference in time
    const diffTime = dueDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Check if due in exactly 2 days (or within a close window like 1-2 days if user missed a day opening app)
    if (diffDays >= 0 && diffDays <= 2) {
      new Notification(`🦋 Payment Due Soon: ${expense.description}`, {
        body: `Friendly reminder: This expense of $${expense.amount.toFixed(2)} is due ${diffDays === 0 ? 'today' : `in ${diffDays} days`}.`,
        icon: '/favicon.ico', 
      });
      remindedIds.push(expense.id);
    }
  });

  return remindedIds;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};
