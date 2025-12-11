
import { Transaction, Category, TransactionType, PredictedItem, YoYStats } from '../types';

/**
 * Predicts upcoming shopping items based on purchase frequency.
 */
export const predictShoppingItems = (transactions: Transaction[]): PredictedItem[] => {
  const predictions: PredictedItem[] = [];
  const today = new Date();
  
  // 1. Filter Grocery/Food items from last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const foodTransactions = transactions.filter(t => 
    t.type === TransactionType.EXPENSE && 
    (t.category === Category.FOOD || t.category === Category.SHOPPING) &&
    new Date(t.date) >= oneYearAgo
  );

  // 2. Group purchase dates by Item Name (normalized)
  const itemDates: Record<string, { originalName: string, dates: Date[] }> = {};

  foodTransactions.forEach(t => {
    // Normalize: "Milk (1gal)" -> "milk (1gal)"
    const key = t.description.trim().toLowerCase();
    
    // Skip generic entries like "grocery store" or "supermarket" as they aren't specific items
    if (['grocery', 'groceries', 'supermarket', 'market', 'food'].includes(key)) return;

    if (!itemDates[key]) {
      itemDates[key] = { originalName: t.description, dates: [] };
    }
    itemDates[key].dates.push(new Date(t.date));
  });

  // 3. Calculate frequency and predict next date
  Object.values(itemDates).forEach(({ originalName, dates }) => {
    // Sort dates ascending
    dates.sort((a, b) => a.getTime() - b.getTime());

    // Need at least 3 purchases to establish a reliable pattern
    if (dates.length < 3) return;

    // Calculate average difference in days
    let totalDiffDays = 0;
    for (let i = 1; i < dates.length; i++) {
      const diffTime = Math.abs(dates[i].getTime() - dates[i-1].getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDiffDays += diffDays;
    }
    const avgFrequency = totalDiffDays / (dates.length - 1);

    // Predict next date
    const lastPurchase = dates[dates.length - 1];
    const nextDateTimestamp = lastPurchase.getTime() + (avgFrequency * 24 * 60 * 60 * 1000);
    const nextDate = new Date(nextDateTimestamp);

    // Check if prediction is within the next 7 days (and not in the past)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // We allow "overdue" items (past predicted date) to show up, 
    // but maybe limit how far back (e.g., predicted in last 7 days or next 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    if (nextDate >= sevenDaysAgo && nextDate <= sevenDaysFromNow) {
      const daysSinceLast = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 3600 * 24));
      
      predictions.push({
        name: originalName,
        lastBoughtDate: lastPurchase.toISOString().split('T')[0],
        daysAgo: daysSinceLast,
        predictedDate: nextDate.toISOString().split('T')[0],
        avgFrequencyDays: Math.round(avgFrequency)
      });
    }
  });

  return predictions;
};

/**
 * Calculates Year-over-Year spending comparison for the current month.
 */
export const calculateYoYComparison = (transactions: Transaction[]): YoYStats => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;

  // Helper to filter expenses for a specific month/year
  const getMonthlyTotal = (month: number, year: number) => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return (
          t.type === TransactionType.EXPENSE &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const currentMonthTotal = getMonthlyTotal(currentMonth, currentYear);
  const lastYearMonthTotal = getMonthlyTotal(currentMonth, lastYear);

  const variance = currentMonthTotal - lastYearMonthTotal;
  
  // Avoid division by zero
  let percentageChange = 0;
  if (lastYearMonthTotal > 0) {
    percentageChange = (variance / lastYearMonthTotal) * 100;
  } else if (currentMonthTotal > 0 && lastYearMonthTotal === 0) {
    percentageChange = 100; // Treated as 100% increase if previous was 0
  }

  return {
    currentMonthTotal,
    lastYearMonthTotal,
    variance,
    percentageChange,
    hasHistory: lastYearMonthTotal > 0
  };
};
