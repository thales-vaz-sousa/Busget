
import React from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { TrashIcon } from './Icons';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onMarkAsPaid }) => {
  // Sort by date descending
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 overflow-hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-2 h-6 bg-nature-400 rounded-full"></span>
        Recent Activity
      </h2>
      
      {sortedTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No transactions yet.
        </div>
      ) : (
        <>
          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-butterfly-50 transition-colors group">
                    <td className="py-4 pl-2 text-sm text-gray-500 whitespace-nowrap">{t.date}</td>
                    <td className="py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${CATEGORY_COLORS[t.category]}20`, // 20% opacity
                            color: CATEGORY_COLORS[t.category]
                          }}
                        >
                          {t.category}
                        </span>
                        {t.isRecurring && (
                           <span className="text-[10px] text-gray-400 flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                             Recurring
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-700 font-medium">{t.description}</td>
                    <td className={`py-4 text-sm font-bold text-right whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-nature-600' : 'text-gray-800'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                    </td>
                    <td className="py-4 text-center">
                      {t.type === TransactionType.EXPENSE ? (
                        t.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-nature-600 bg-nature-50 px-2 py-1 rounded-md">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Paid
                          </span>
                        ) : (
                          <button 
                            onClick={() => onMarkAsPaid(t.id)}
                            className="text-xs font-bold text-white bg-nature-500 hover:bg-nature-600 px-3 py-1.5 rounded-md shadow-sm transition active:scale-95 whitespace-nowrap"
                          >
                            Mark Paid
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="text-gray-300 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
             {sortedTransactions.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                  <div className="flex justify-between items-start mb-2">
                     <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">{t.date}</p>
                        <p className="font-bold text-gray-800 text-base">{t.description}</p>
                     </div>
                     <p className={`text-lg font-bold ${t.type === TransactionType.INCOME ? 'text-nature-600' : 'text-gray-800'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
                     </p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                     <div className="flex flex-col gap-2">
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold"
                          style={{ 
                            backgroundColor: `${CATEGORY_COLORS[t.category]}20`,
                            color: CATEGORY_COLORS[t.category]
                          }}
                        >
                          {t.category}
                        </span>
                        {t.isRecurring && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Recurring
                          </span>
                        )}
                     </div>

                     <div className="flex items-center gap-2">
                        {t.type === TransactionType.EXPENSE && (
                          t.isPaid ? (
                             <span className="text-xs font-bold text-nature-600 bg-nature-50 px-2 py-1 rounded">Paid</span>
                          ) : (
                             <button 
                               onClick={() => onMarkAsPaid(t.id)}
                               className="text-xs font-bold text-white bg-nature-500 px-3 py-1.5 rounded shadow-sm"
                             >
                               Mark Paid
                             </button>
                          )
                        )}
                        <button onClick={() => onDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                           <TrashIcon className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </div>
             ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionList;
