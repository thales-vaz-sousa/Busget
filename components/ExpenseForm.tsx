
import React, { useState, useRef } from 'react';
import { Transaction, TransactionType, Category, OcrResult } from '../types';
import { CameraIcon, UploadIcon } from './Icons';
import { parseReceiptImage } from '../services/geminiService';
import { CATEGORY_KEYWORDS } from '../constants';
import { useToast } from '../context/ToastContext';

interface ExpenseFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddTransaction, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);

    // Auto-suggest category logic
    if (type === TransactionType.EXPENSE) {
      const lowerDesc = val.toLowerCase();
      // Iterate through keywords to find a match
      for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
        if (lowerDesc.includes(keyword)) {
          setCategory(cat);
          break; // Stop at first match
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onAddTransaction({
      amount: parseFloat(amount),
      description,
      category: type === TransactionType.INCOME ? Category.INCOME : category,
      date,
      type,
      isRecurring: type === TransactionType.EXPENSE ? isRecurring : false
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const result: OcrResult = await parseReceiptImage(base64String, file.type);
          
          if (result.amount) setAmount(result.amount.toString());
          if (result.description) {
            setDescription(result.description);
            // Also trigger auto-suggest for OCR result
            const lowerDesc = result.description.toLowerCase();
            for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
                if (lowerDesc.includes(keyword)) {
                  setCategory(cat);
                  break;
                }
            }
          }
          if (result.date) setDate(result.date);
          if (result.category) {
             // Simple matching logic if OCR provided a category
             const matchedCat = Object.values(Category).find(c => c.toLowerCase() === result.category?.toLowerCase());
             if (matchedCat) setCategory(matchedCat);
          }
          setType(TransactionType.EXPENSE); // Receipts are usually expenses
          showToast('success', 'Receipt processed successfully!');
        } catch (err) {
          setError("Failed to extract data. Please enter manually.");
          showToast('error', "AI scan failed. Please enter details manually.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      showToast('error', "Could not read the file.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full border-t-8 border-butterfly-500">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Transaction</h2>
      
      {/* OCR Section */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 text-center">Scan Receipt with AI</label>
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            cursor-pointer border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 min-h-[100px] group
            ${isProcessing ? 'bg-butterfly-50 border-butterfly-300' : 'bg-gray-50 border-gray-300 hover:border-butterfly-400 hover:bg-butterfly-50'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          {isProcessing ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-butterfly-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-butterfly-600 font-medium">Analyzing Receipt...</span>
            </div>
          ) : (
            <>
              <CameraIcon className="w-8 h-8 text-gray-400 group-hover:text-butterfly-500 mb-2 transition-colors" />
              <span className="text-gray-500 text-sm font-medium group-hover:text-butterfly-600 transition-colors">Tap to Upload or Snap Photo</span>
            </>
          )}
        </div>
        {error && <p className="text-red-500 text-xs text-center mt-2">{error}</p>}
      </div>

      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-wider">Or Enter Manually</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className="flex gap-4 justify-center mb-6">
          <button
            type="button"
            onClick={() => setType(TransactionType.EXPENSE)}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition transform active:scale-95 ${type === TransactionType.EXPENSE ? 'bg-butterfly-500 text-white shadow-lg shadow-butterfly-200 ring-2 ring-butterfly-500 ring-offset-2' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType(TransactionType.INCOME)}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition transform active:scale-95 ${type === TransactionType.INCOME ? 'bg-nature-500 text-white shadow-lg shadow-nature-200 ring-2 ring-nature-500 ring-offset-2' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Income
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-5 py-3.5 text-lg rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-butterfly-400 focus:border-butterfly-400 outline-none transition text-gray-900 placeholder-gray-400 font-bold"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-5 py-3.5 text-base rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-butterfly-400 focus:border-butterfly-400 outline-none transition text-gray-900 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={handleDescriptionChange}
            className="w-full px-5 py-3.5 text-base rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-butterfly-400 focus:border-butterfly-400 outline-none transition text-gray-900 placeholder-gray-400 font-medium"
            placeholder="e.g. Grocery Shopping"
          />
        </div>

        {type === TransactionType.EXPENSE && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-5 py-3.5 text-base rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-butterfly-400 focus:border-butterfly-400 outline-none transition text-gray-900 font-medium appearance-none"
              >
                {Object.values(Category).filter(c => c !== Category.INCOME).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        )}

        {type === TransactionType.EXPENSE && (
          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="recurring" 
              checked={isRecurring} 
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-5 h-5 text-butterfly-500 border-gray-300 rounded focus:ring-butterfly-400 cursor-pointer"
            />
            <label htmlFor="recurring" className="text-sm font-bold text-gray-600 cursor-pointer select-none">Recurring Monthly?</label>
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-4 rounded-xl bg-gradient-to-r from-butterfly-500 to-butterfly-600 text-white font-bold hover:from-butterfly-600 hover:to-butterfly-700 shadow-lg shadow-butterfly-200 transition transform active:scale-95"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
