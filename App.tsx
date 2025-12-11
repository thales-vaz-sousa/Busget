
import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Transaction, BudgetData, AppSettings, SavingsGoal } from './types';
import { INITIAL_BUDGET, SAMPLE_DATA, INITIAL_SAVINGS_GOAL } from './constants';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import RecipePlanner from './components/RecipePlanner';
import Settings from './components/Settings';
import Login from './components/Login';
import { ButterflyIcon, PlusIcon, PieChartIcon, UtensilsIcon, SettingsIcon, MenuIcon, XIcon } from './components/Icons';
import { checkReminders } from './services/reminderService';
import { checkAndProcessRollover } from './services/budgetService';
import { ToastProvider, useToast } from './context/ToastContext';

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : SAMPLE_DATA;
  });

  // Initialize Budget with Migration for Rollover Fields
  const [budget, setBudget] = useState<BudgetData>(() => {
    const saved = localStorage.getItem('budget');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure new fields exist
      if (parsed.baseAmount === undefined) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return {
          monthlyLimit: parsed.monthlyLimit,
          baseAmount: parsed.monthlyLimit,
          rolloverAmount: 0,
          lastRolloverMonth: currentMonth // Assume current month is handled to prevent immediate rollover on first load
        };
      }
      return parsed;
    }
    return { 
      monthlyLimit: INITIAL_BUDGET, 
      baseAmount: INITIAL_BUDGET, 
      rolloverAmount: 0, 
      lastRolloverMonth: new Date().toISOString().slice(0, 7)
    };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : { notificationsEnabled: false };
  });

  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>(() => {
    const saved = localStorage.getItem('savingsGoal');
    return saved ? JSON.parse(saved) : INITIAL_SAVINGS_GOAL;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Mock Group Data for UI demonstration
  const [groups] = useState([
    { id: 1, name: "My Personal Budget" },
    { id: 2, name: "Family Shared" }
  ]);
  const [activeGroupId, setActiveGroupId] = useState(1);

  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('savingsGoal', JSON.stringify(savingsGoal));
  }, [savingsGoal]);

  // Check reminders
  useEffect(() => {
    if (settings.notificationsEnabled) {
      const sentIds = checkReminders(transactions);
      if (sentIds.length > 0) {
        setTransactions(prev => prev.map(t => 
          sentIds.includes(t.id) ? { ...t, reminderSent: true } : t
        ));
      }
    }
  }, [transactions, settings.notificationsEnabled]);

  // Check for Budget Rollover on Mount
  useEffect(() => {
    const result = checkAndProcessRollover(budget, transactions);
    if (result) {
      setBudget(result.updatedBudget);
      // We use a small timeout to ensure ToastProvider is ready if mounting simultaneously
      setTimeout(() => {
        showToast('info', result.message);
      }, 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: crypto.randomUUID(),
      isPaid: false, // Default to unpaid for new manual entries
      reminderSent: false
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setShowAddModal(false);
    showToast('success', 'Transaction added successfully! 🦋');
  };

  const deleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast('info', 'Transaction deleted.');
    }
  };

  const markAsPaid = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isPaid: true } : t
    ));
    showToast('success', 'Marked as paid! Great job keeping up! 🦋');
  };

  const updateBudget = (newLimit: number) => {
    setBudget(prev => ({
      ...prev,
      baseAmount: newLimit,
      monthlyLimit: newLimit + prev.rolloverAmount
    }));
    showToast('success', 'Monthly base budget updated.');
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = parseInt(e.target.value);
    setActiveGroupId(newId);
    showToast('info', `Switched to ${groups.find(g => g.id === newId)?.name}`);
  };

  const isActive = (path: string) => location.pathname === path;

  // If on login page, render simpler layout
  if (location.pathname === '/login') {
    return <Login />;
  }

  // Mobile Menu Toggle Function
  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-butterfly-50 via-white to-nature-50 text-gray-800 font-sans pb-24 md:pb-8">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-butterfly-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 relative z-50">
            <div className="p-2 bg-gradient-to-tr from-butterfly-400 to-butterfly-600 rounded-lg text-white shadow-lg shadow-butterfly-200">
              <ButterflyIcon className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-butterfly-700 to-butterfly-500 hidden sm:block">
              Butterfly Tracker
            </h1>
          </Link>
          
          <div className="flex items-center gap-4 md:gap-6">
             {/* Desktop Group Switcher */}
             <div className="relative hidden md:block">
               <select 
                 value={activeGroupId}
                 onChange={handleGroupChange}
                 className="appearance-none bg-butterfly-50 border border-butterfly-200 text-butterfly-800 text-sm font-bold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-butterfly-400 cursor-pointer hover:bg-butterfly-100 transition"
               >
                 {groups.map(g => (
                   <option key={g.id} value={g.id}>{g.name}</option>
                 ))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-butterfly-600">
                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
               </div>
             </div>

             {/* Desktop Navigation Links */}
             <nav className="hidden md:flex gap-4">
               <Link 
                 to="/" 
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${isActive('/') ? 'text-butterfly-700 bg-butterfly-50' : 'text-gray-500 hover:text-butterfly-600'}`}
               >
                 <PieChartIcon className="w-4 h-4" />
                 Dashboard
               </Link>
               <Link 
                 to="/meal-planner" 
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${isActive('/meal-planner') ? 'text-butterfly-700 bg-butterfly-50' : 'text-gray-500 hover:text-butterfly-600'}`}
               >
                 <UtensilsIcon className="w-4 h-4" />
                 Meal Planner
               </Link>
               <Link 
                 to="/settings" 
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${isActive('/settings') ? 'text-butterfly-700 bg-butterfly-50' : 'text-gray-500 hover:text-butterfly-600'}`}
               >
                 <SettingsIcon className="w-4 h-4" />
                 Settings
               </Link>
             </nav>
             
             {/* Divider */}
             <div className="hidden md:block h-6 w-px bg-gray-200"></div>

             {/* Logout Button (Server Side Link) */}
             <a 
               href="/logout"
               className="hidden md:flex text-sm font-medium text-gray-400 hover:text-red-500 transition-colors"
               title="Sign Out"
             >
               Sign Out
             </a>

             {/* Desktop Add Expense Button */}
             <button 
                onClick={() => setShowAddModal(true)}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-butterfly-600 to-butterfly-700 text-white px-5 py-2.5 rounded-full hover:from-butterfly-700 hover:to-butterfly-800 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
             >
                <PlusIcon className="w-4 h-4" />
                <span>Add Expense</span>
             </button>

             {/* Mobile Hamburger Button */}
             <button
               onClick={toggleMenu}
               className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg z-50 transition-colors"
               aria-label="Menu"
             >
                <MenuIcon className="w-6 h-6" />
             </button>
          </div>
        </div>

        {/* Full Screen Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-white md:hidden animate-in slide-in-from-right duration-200 flex flex-col">
             
             {/* Menu Header */}
             <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                   <div className="p-2 bg-gradient-to-tr from-butterfly-400 to-butterfly-600 rounded-lg text-white shadow-md">
                      <ButterflyIcon className="w-5 h-5" />
                   </div>
                   <span className="text-lg font-bold text-gray-800">Menu</span>
                </div>
                <button
                  onClick={toggleMenu}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close Menu"
                >
                  <XIcon className="w-6 h-6" />
                </button>
             </div>

             {/* Menu Content */}
             <div className="flex-1 overflow-y-auto p-6">
                <nav className="flex flex-col gap-4">
                    
                    {/* Mobile Group Switcher */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Budget Group</label>
                        <div className="relative">
                           <select 
                             value={activeGroupId}
                             onChange={handleGroupChange}
                             className="w-full appearance-none bg-white border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-butterfly-400 shadow-sm"
                           >
                             {groups.map(g => (
                               <option key={g.id} value={g.id}>{g.name}</option>
                             ))}
                           </select>
                           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-600">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                           </div>
                        </div>
                    </div>

                    <Link 
                      to="/" 
                      onClick={toggleMenu}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-bold transition-all border shadow-sm ${isActive('/') ? 'bg-butterfly-100 border-butterfly-200 text-butterfly-800' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <PieChartIcon className="w-6 h-6" />
                      Dashboard
                    </Link>
                    <Link 
                      to="/meal-planner" 
                      onClick={toggleMenu}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-bold transition-all border shadow-sm ${isActive('/meal-planner') ? 'bg-butterfly-100 border-butterfly-200 text-butterfly-800' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <UtensilsIcon className="w-6 h-6" />
                      Meal Planner
                    </Link>
                    <Link 
                      to="/settings" 
                      onClick={toggleMenu}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-bold transition-all border shadow-sm ${isActive('/settings') ? 'bg-butterfly-100 border-butterfly-200 text-butterfly-800' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                    >
                      <SettingsIcon className="w-6 h-6" />
                      Settings
                    </Link>
                    
                    <hr className="my-2 border-gray-100" />
                    
                    <a 
                      href="/logout"
                      className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      Sign Out
                    </a>
                </nav>
             </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modal Overlay */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
             <div className="w-full max-w-lg animate-in zoom-in-95 duration-200">
                <ExpenseForm 
                  onAddTransaction={addTransaction}
                  onCancel={() => setShowAddModal(false)}
                />
             </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <Dashboard 
              transactions={transactions} 
              budget={budget} 
              onUpdateBudget={updateBudget} 
              savingsGoal={savingsGoal}
              onUpdateSavingsGoal={setSavingsGoal}
              onDeleteTransaction={deleteTransaction}
              onMarkAsPaid={markAsPaid}
            />
          } />
          
          <Route path="/meal-planner" element={<RecipePlanner transactions={transactions} />} />
          <Route path="/settings" element={<Settings settings={settings} onUpdateSettings={setSettings} transactions={transactions} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      {/* Mobile Floating Action Button */}
      {/* Kept as per instructions to optimize Add Expense button access */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-butterfly-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-butterfly-700 active:scale-90 transition z-40 focus:outline-none focus:ring-4 focus:ring-butterfly-300"
        aria-label="Add Expense"
      >
        <PlusIcon className="w-8 h-8" />
      </button>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
};

export default App;
