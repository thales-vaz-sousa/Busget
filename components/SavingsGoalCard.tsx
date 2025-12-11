
import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { SettingsIcon, PlusIcon } from './Icons';

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onUpdate: (goal: SavingsGoal) => void;
}

const SavingsGoalCard: React.FC<SavingsGoalCardProps> = ({ goal, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(goal);

  // Calculate percentage (clamped between 0 and 100)
  const percentage = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100));

  const handleSave = () => {
    onUpdate({
      ...editForm,
      targetAmount: Number(editForm.targetAmount),
      currentAmount: Number(editForm.currentAmount)
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-butterfly-500 h-full">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Edit Savings Goal</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Goal Name</label>
            <input 
              type="text" 
              value={editForm.name} 
              onChange={e => setEditForm({...editForm, name: e.target.value})}
              className="w-full border-b border-gray-300 focus:border-butterfly-500 outline-none py-1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Target Amount ($)</label>
            <input 
              type="number" 
              value={editForm.targetAmount} 
              onChange={e => setEditForm({...editForm, targetAmount: Number(e.target.value)})}
              className="w-full border-b border-gray-300 focus:border-butterfly-500 outline-none py-1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Current Saved ($)</label>
            <input 
              type="number" 
              value={editForm.currentAmount} 
              onChange={e => setEditForm({...editForm, currentAmount: Number(e.target.value)})}
              className="w-full border-b border-gray-300 focus:border-butterfly-500 outline-none py-1"
            />
          </div>
          <div className="flex gap-2 mt-4 pt-2">
            <button onClick={handleSave} className="flex-1 bg-butterfly-600 text-white py-2 rounded-lg text-sm font-bold">Save</button>
            <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-butterfly-500 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-butterfly-50 rounded-full opacity-50"></div>

      <div className="relative z-10 flex justify-between items-start mb-2">
        <div>
           <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Savings Goal</p>
           <h3 className="text-xl font-bold text-gray-800 mt-1">{goal.name}</h3>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-300 hover:text-butterfly-600 hover:bg-butterfly-50 rounded-full transition"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-6 mt-2">
        {/* Butterfly SVG Visualizer */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="butterflyFill" x1="0" x2="0" y1="1" y2="0">
                <stop offset={`${percentage}%`} stopColor="#d946ef" /> {/* butterfly-500 */}
                <stop offset={`${percentage}%`} stopColor="#fdf4ff" /> {/* butterfly-50 (empty part) */}
              </linearGradient>
            </defs>
            {/* Simplified Butterfly Shape for Filling */}
            <path 
              d="M12 21.5c4-1 9-4.5 9-9 0-4-3.5-5.5-6.5-4-1-1.5-2.5-3.5-2.5-5.5 0 2-1.5 4-2.5 5.5-3-1.5-6.5 0-6.5 4 0 4.5 5 8 9 9z"
              fill="url(#butterflyFill)"
              stroke="#c026d3" 
              strokeWidth="0.5"
            />
            {/* Inner Details Overlay */}
            <path d="M12 3v18.5" stroke="#a21caf" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            <path d="M12 12c2 1 4 0 5-2" stroke="#a21caf" strokeWidth="0.5" fill="none" opacity="0.3" />
            <path d="M12 12c-2 1-4 0-5-2" stroke="#a21caf" strokeWidth="0.5" fill="none" opacity="0.3" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-butterfly-800 bg-white/60 backdrop-blur-sm px-1 rounded shadow-sm">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-end">
             <div>
               <p className="text-xs text-gray-400 uppercase">Saved</p>
               <p className="text-2xl font-bold text-butterfly-600">${goal.currentAmount.toLocaleString()}</p>
             </div>
             <div className="text-right">
               <p className="text-xs text-gray-400 uppercase">Target</p>
               <p className="text-sm font-bold text-gray-600">${goal.targetAmount.toLocaleString()}</p>
             </div>
          </div>
          
          {/* Progress Bar Fallback/Complement */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-butterfly-400 to-butterfly-600 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>

          {/* Quick Add Button */}
          <button 
             onClick={() => {
                const amount = prompt("Amount to add to savings?");
                if(amount && !isNaN(Number(amount))) {
                   onUpdate({...goal, currentAmount: goal.currentAmount + Number(amount)});
                }
             }}
             className="text-xs flex items-center gap-1 text-butterfly-600 font-bold hover:underline"
          >
             <PlusIcon className="w-3 h-3" /> Add Funds
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsGoalCard;
