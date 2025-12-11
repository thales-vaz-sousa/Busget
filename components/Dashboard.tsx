
import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Transaction, TransactionType, Category, BudgetData, PredictedItem, SavingsGoal } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { DollarIcon, PlusIcon, DragHandleIcon, ButterflyArrowIcon } from './Icons';
import { predictShoppingItems, calculateYoYComparison } from '../services/analysisService';
import SavingsGoalCard from './SavingsGoalCard';
import TransactionList from './TransactionList';

interface DashboardProps {
  transactions: Transaction[];
  budget: BudgetData;
  onUpdateBudget: (newLimit: number) => void;
  savingsGoal: SavingsGoal;
  onUpdateSavingsGoal: (goal: SavingsGoal) => void;
  onDeleteTransaction: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

// Widget Configuration
type WidgetId = 'budget' | 'spent' | 'remaining' | 'savings' | 'chart' | 'shopping' | 'transactions' | 'yoy';

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'budget', 'spent', 'remaining', 'yoy', 'savings', 
  'chart', 'shopping', 
  'transactions'
];

interface SortableWidgetProps {
  id: WidgetId;
  children: React.ReactNode;
  className?: string;
}

const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group h-full ${className}`}
    >
      {/* Drag Handle - Visible on hover or touch */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-4 right-4 z-10 p-1 bg-white/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to rearrange"
      >
        <DragHandleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
      </div>
      {children}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  budget, 
  onUpdateBudget, 
  savingsGoal, 
  onUpdateSavingsGoal,
  onDeleteTransaction,
  onMarkAsPaid
}) => {
  const [activeShoppingList, setActiveShoppingList] = useState<string[]>(() => {
    const saved = localStorage.getItem('shoppingList');
    return saved ? JSON.parse(saved) : [];
  });

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    const saved = localStorage.getItem('dashboardWidgetOrder');
    return saved ? JSON.parse(saved) : DEFAULT_WIDGET_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Drag after 5px movement
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Persistence
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(activeShoppingList));
  }, [activeShoppingList]);

  useEffect(() => {
    localStorage.setItem('dashboardWidgetOrder', JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  // Derived Data
  const { totalExpenses, totalIncome, expensesByCategory } = useMemo(() => {
    let exp = 0;
    let inc = 0;
    const catMap: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type === TransactionType.EXPENSE) {
        exp += t.amount;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      } else {
        inc += t.amount;
      }
    });

    const chartData = Object.entries(catMap).map(([name, value]) => ({ name, value }));
    return { totalExpenses: exp, totalIncome: inc, expensesByCategory: chartData };
  }, [transactions]);

  const predictions = useMemo(() => predictShoppingItems(transactions), [transactions]);
  const yoyStats = useMemo(() => calculateYoYComparison(transactions), [transactions]);

  const remaining = budget.monthlyLimit - totalExpenses;
  const isOverBudget = remaining < 0;

  // Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgetOrder((items) => {
        const oldIndex = items.indexOf(active.id as WidgetId);
        const newIndex = items.indexOf(over.id as WidgetId);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addToShoppingList = (item: string) => {
    if (!activeShoppingList.includes(item)) {
      setActiveShoppingList([...activeShoppingList, item]);
    }
  };

  const removeFromShoppingList = (item: string) => {
    setActiveShoppingList(activeShoppingList.filter(i => i !== item));
  };

  const handleBudgetChange = () => {
    const newBudget = prompt("Enter new monthly base budget:", budget.baseAmount.toString());
    if (newBudget && !isNaN(parseFloat(newBudget))) {
      onUpdateBudget(parseFloat(newBudget));
    }
  };

  // Widget Renderers
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'budget':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-butterfly-500 h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Monthly Budget</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-2xl font-bold text-gray-800">${budget.monthlyLimit.toLocaleString()}</h3>
                  {budget.rolloverAmount !== 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${budget.rolloverAmount > 0 ? 'bg-nature-100 text-nature-700' : 'bg-red-100 text-red-700'}`}>
                      {budget.rolloverAmount > 0 ? '+' : ''}{budget.rolloverAmount.toLocaleString()} Rollover
                    </span>
                  )}
                </div>
                {budget.rolloverAmount !== 0 && (
                   <p className="text-xs text-gray-400 mt-1">Base: ${budget.baseAmount.toLocaleString()}</p>
                )}
              </div>
              <button onClick={handleBudgetChange} className="p-2 bg-butterfly-50 text-butterfly-600 rounded-full hover:bg-butterfly-100">
                <DollarIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 cursor-pointer hover:underline" onClick={handleBudgetChange}>Click to edit base plan</p>
          </div>
        );
      case 'spent':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-nature-400 h-full">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Spent</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-2">${totalExpenses.toLocaleString()}</h3>
            </div>
            <p className="text-xs text-nature-600 mt-2">+${totalIncome.toLocaleString()} Income</p>
          </div>
        );
      case 'remaining':
        return (
          <div className={`bg-white rounded-2xl shadow-sm p-6 border-l-4 h-full ${isOverBudget ? 'border-red-400' : 'border-teal-400'}`}>
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Remaining</p>
              <h3 className={`text-2xl font-bold mt-2 ${isOverBudget ? 'text-red-500' : 'text-teal-600'}`}>
                ${remaining.toLocaleString()}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {isOverBudget ? 'You have exceeded your budget.' : 'You are doing great!'}
            </p>
          </div>
        );
      case 'yoy':
        const isBetter = yoyStats.variance <= 0; // Spending less than last year is "Better" (Green)
        return (
          <div className={`bg-white rounded-2xl shadow-sm p-6 border-l-4 h-full ${yoyStats.hasHistory ? (isBetter ? 'border-nature-500' : 'border-red-400') : 'border-gray-300'}`}>
             <div className="flex justify-between items-start">
               <div>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Year-over-Year</p>
                  
                  {yoyStats.hasHistory ? (
                    <div className="mt-2">
                       <h3 className="text-2xl font-bold text-gray-800">${yoyStats.currentMonthTotal.toLocaleString()}</h3>
                       <p className="text-xs text-gray-400 mt-1">vs ${yoyStats.lastYearMonthTotal.toLocaleString()} last year</p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <h3 className="text-xl font-bold text-gray-400">No Data</h3>
                      <p className="text-xs text-gray-400 mt-1">No spending recorded last year.</p>
                    </div>
                  )}
               </div>

               {yoyStats.hasHistory && (
                 <div className={`flex flex-col items-center justify-center p-2 rounded-lg ${isBetter ? 'bg-nature-50 text-nature-600' : 'bg-red-50 text-red-500'}`}>
                    <ButterflyArrowIcon className="w-6 h-6" direction={isBetter ? 'down' : 'up'} />
                    <span className="text-xs font-bold mt-1">
                      {Math.abs(yoyStats.percentageChange).toFixed(1)}%
                    </span>
                 </div>
               )}
             </div>
             {yoyStats.hasHistory && (
               <p className={`text-xs mt-3 font-medium ${isBetter ? 'text-nature-600' : 'text-red-500'}`}>
                 {isBetter ? 'Spending less than last year!' : 'Spending more than last year.'}
               </p>
             )}
          </div>
        );
      case 'savings':
        return <SavingsGoalCard goal={savingsGoal} onUpdate={onUpdateSavingsGoal} />;
      case 'chart':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6 h-full">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-butterfly-500 rounded-full"></span>
              Spending Breakdown
            </h2>
            <div className="h-64 w-full">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#ccc'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  No expenses recorded yet.
                </div>
              )}
            </div>
          </div>
        );
      case 'shopping':
        return (
          <div className="space-y-6 h-full flex flex-col">
             {/* Prediction Card */}
             <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-nature-400 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-xl">🦋</span> Predicted Shopping
                  </h2>
                  <span className="text-xs font-medium bg-nature-100 text-nature-700 px-2 py-1 rounded-full">AI Powered</span>
                </div>
                
                {predictions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No regular items due soon.</p>
                ) : (
                  <div className="space-y-3">
                     {predictions.map((item, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 bg-nature-50 rounded-xl group">
                          <div>
                             <p className="font-bold text-gray-800 text-sm capitalize">{item.name}</p>
                             <p className="text-xs text-nature-600">Last bought: {item.daysAgo} days ago</p>
                          </div>
                          {activeShoppingList.includes(item.name) ? (
                             <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded-full">Added</span>
                          ) : (
                             <button 
                               onClick={() => addToShoppingList(item.name)}
                               className="p-1.5 bg-white text-nature-600 rounded-full shadow-sm border border-nature-200 hover:bg-nature-600 hover:text-white transition"
                             >
                               <PlusIcon className="w-4 h-4" />
                             </button>
                          )}
                       </div>
                     ))}
                  </div>
                )}
             </div>
  
             {/* Active Shopping List */}
             {activeShoppingList.length > 0 && (
               <div className="bg-white rounded-2xl shadow-sm p-6 flex-1">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Active Shopping List</h2>
                  <ul className="space-y-2">
                     {activeShoppingList.map((item, idx) => (
                       <li key={idx} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-lg transition">
                          <span className="capitalize text-gray-700">{item}</span>
                          <button onClick={() => removeFromShoppingList(item)} className="text-gray-400 hover:text-red-500">
                            &times;
                          </button>
                       </li>
                     ))}
                  </ul>
               </div>
             )}
          </div>
        );
      case 'transactions':
        return (
          <TransactionList 
             transactions={transactions} 
             onDelete={onDeleteTransaction} 
             onMarkAsPaid={onMarkAsPaid} 
          />
        );
      default:
        return null;
    }
  };

  // Define Layout Grid Classes for each Widget
  const getGridClass = (id: WidgetId) => {
    switch (id) {
      case 'budget':
      case 'spent':
      case 'remaining':
      case 'yoy':
        return 'col-span-1';
      case 'savings':
        return 'col-span-1 md:col-span-2 lg:col-span-4'; // Make savings full width on large screens
      case 'chart':
      case 'shopping':
        return 'col-span-1 md:col-span-2';
      case 'transactions':
        return 'col-span-1 md:col-span-2 lg:col-span-4';
      default:
        return 'col-span-1';
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={widgetOrder} 
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {widgetOrder.map((id) => (
            <SortableWidget key={id} id={id} className={getGridClass(id)}>
              {renderWidget(id)}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default Dashboard;
