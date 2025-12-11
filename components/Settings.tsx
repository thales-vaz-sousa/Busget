
import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BellIcon, SettingsIcon, UploadIcon } from './Icons';
import { requestNotificationPermission } from '../services/reminderService';
import { AppSettings, Transaction, TransactionType } from '../types';
import { useToast } from '../context/ToastContext';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  transactions: Transaction[];
}

type TimeRange = 'month' | 'year' | 'all';
type ExportFormat = 'csv' | 'pdf';

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, transactions }) => {
  const [permissionStatus, setPermissionStatus] = useState(Notification.permission);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();
  
  // Share State
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleToggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setPermissionStatus(Notification.permission);
      if (granted) {
        onUpdateSettings({ ...settings, notificationsEnabled: true });
        showToast('success', "Notifications Enabled! You'll be reminded of bills.");
      } else {
        showToast('error', "Permission denied. Please enable notifications in your browser settings.");
      }
    } else {
      onUpdateSettings({ ...settings, notificationsEnabled: false });
      showToast('info', "Notifications disabled.");
    }
  };

  const getFilteredTransactions = () => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (timeRange === 'month') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }
      if (timeRange === 'year') {
        return tDate.getFullYear() === now.getFullYear();
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const generateCSV = (data: Transaction[]) => {
    const headers = ['Date', 'Category', 'Description', 'Type', 'Amount'];
    const rows = data.map(t => [
      t.date,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
      t.type,
      t.amount.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `butterfly_budget_report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = (data: Transaction[]) => {
    const doc = new jsPDF();
    const title = `Butterfly Budget Report - ${timeRange === 'month' ? 'Current Month' : timeRange === 'year' ? 'Current Year' : 'All Time'}`;
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(162, 28, 175); // Butterfly purple
    doc.text(title, 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Summary
    let totalIncome = 0;
    let totalExpense = 0;
    data.forEach(t => {
      if (t.type === TransactionType.INCOME) totalIncome += t.amount;
      else totalExpense += t.amount;
    });

    // Explicitly call autoTable as a function passing 'doc'
    // This avoids "doc.autoTable is not a function" errors
    autoTable(doc, {
      startY: 40,
      head: [['Total Income', 'Total Expenses', 'Net Balance']],
      body: [[
        `$${totalIncome.toFixed(2)}`, 
        `$${totalExpense.toFixed(2)}`, 
        `$${(totalIncome - totalExpense).toFixed(2)}`
      ]],
      theme: 'plain',
      styles: { fontSize: 12, cellPadding: 5 },
      headStyles: { fontStyle: 'bold' }
    });

    // Details Table
    // Access state via (doc as any).lastAutoTable if available, otherwise default to hardcoded Y
    const finalY = (doc as any).lastAutoTable?.finalY || 60;

    autoTable(doc, {
      startY: finalY + 10,
      head: [['Date', 'Category', 'Description', 'Type', 'Amount']],
      body: data.map(t => [
        t.date,
        t.category,
        t.description,
        t.type,
        `$${t.amount.toFixed(2)}`
      ]),
      headStyles: { fillColor: [162, 28, 175], textColor: 255 },
      alternateRowStyles: { fillColor: [253, 244, 255] }, // light butterfly
    });

    doc.save(`butterfly_budget_report_${timeRange}.pdf`);
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Wrap in try/catch to gracefully handle PDF generation errors
    try {
      const data = getFilteredTransactions();
      
      if (data.length === 0) {
        showToast('error', "No data found for the selected time range.");
        setIsExporting(false);
        return;
      }

      if (format === 'csv') {
        generateCSV(data);
      } else {
        generatePDF(data);
      }
      showToast('success', "Report downloaded successfully!");
    } catch (error) {
      console.error("Export failed:", error);
      showToast('error', "Failed to generate report. Please try again.");
    } finally {
      // Small delay to allow UI to update
      setTimeout(() => setIsExporting(false), 1000);
    }
  };
  
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    
    // In a real app, this calls /api/share_budget
    // For this prototype, we simulate a successful API call
    try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate net delay
        showToast('success', `Invitation sent to ${inviteEmail}!`);
        setInviteEmail('');
    } catch (err) {
        showToast('error', 'Failed to invite user.');
    } finally {
        setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-sm p-8 border-l-4 border-butterfly-500">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-butterfly-100 rounded-full text-butterfly-600">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
            <p className="text-gray-500">Manage your app preferences.</p>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Notifications Section */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
             <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${settings.notificationsEnabled ? 'bg-nature-100 text-nature-600' : 'bg-gray-200 text-gray-400'}`}>
                   <BellIcon className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-gray-800">Expense Reminders</h3>
                   <p className="text-sm text-gray-500">Get notified 3 days before recurring bills.</p>
                   {settings.notificationsEnabled && permissionStatus !== 'granted' && (
                     <p className="text-xs text-red-500 mt-1 font-bold">Browser permission denied.</p>
                   )}
                </div>
             </div>
             
             <button 
                onClick={handleToggleNotifications}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-butterfly-500 focus:ring-offset-2 ${settings.notificationsEnabled ? 'bg-butterfly-500' : 'bg-gray-300'}`}
             >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-200 ease-in-out ${settings.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
             </button>
          </div>

          {/* Share Budget Section (New) */}
          <div className="border-t border-gray-100 pt-8">
            <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800">Share Budget</h3>
                <span className="bg-butterfly-100 text-butterfly-600 text-xs px-2 py-1 rounded-full font-medium">Collaboration</span>
            </div>

            <div className="bg-butterfly-50 rounded-xl p-6 border border-butterfly-100">
                <p className="text-sm text-gray-600 mb-4">
                    Invite family or friends to manage this budget together. They will receive an email invitation.
                </p>
                
                <form onSubmit={handleInvite} className="flex gap-3">
                    <input 
                        type="email" 
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 px-4 py-3 rounded-xl border border-butterfly-200 focus:ring-2 focus:ring-butterfly-300 outline-none text-gray-700"
                    />
                    <button 
                        type="submit"
                        disabled={isInviting}
                        className="px-6 py-3 bg-butterfly-600 text-white font-bold rounded-xl hover:bg-butterfly-700 transition shadow-md disabled:opacity-50"
                    >
                        {isInviting ? 'Sending...' : 'Invite'}
                    </button>
                </form>
            </div>
          </div>

          {/* Export Data Section */}
          <div className="border-t border-gray-100 pt-8">
             <div className="flex items-center gap-3 mb-4">
               <h3 className="text-lg font-bold text-gray-800">Export Data</h3>
               <span className="bg-butterfly-100 text-butterfly-600 text-xs px-2 py-1 rounded-full font-medium">New</span>
             </div>
             
             <div className="bg-butterfly-50 rounded-xl p-6 border border-butterfly-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Time Range */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Time Range</label>
                    <div className="flex bg-white rounded-lg p-1 border border-butterfly-200 shadow-sm">
                       {['month', 'year', 'all'].map((range) => (
                         <button
                           key={range}
                           onClick={() => setTimeRange(range as TimeRange)}
                           className={`flex-1 py-2 rounded-md text-sm font-medium transition ${timeRange === range ? 'bg-butterfly-500 text-white shadow' : 'text-gray-500 hover:text-butterfly-600'}`}
                         >
                           {range === 'month' ? 'Month' : range === 'year' ? 'Year' : 'All'}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Format</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${format === 'csv' ? 'border-butterfly-500 bg-white text-butterfly-700' : 'border-transparent bg-white/50 hover:bg-white text-gray-500'}`}>
                        <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} className="hidden" />
                        <span className="font-bold">CSV</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${format === 'pdf' ? 'border-butterfly-500 bg-white text-butterfly-700' : 'border-transparent bg-white/50 hover:bg-white text-gray-500'}`}>
                         <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={() => setFormat('pdf')} className="hidden" />
                         <span className="font-bold">PDF</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-butterfly-600 to-butterfly-700 text-white py-3 rounded-xl font-bold hover:from-butterfly-700 hover:to-butterfly-800 transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                >
                  {isExporting ? (
                    <span className="animate-pulse">Generating Report...</span>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5 transform rotate-180" /> {/* Reusing upload icon as download */}
                      Download Expense Report 🦋
                    </>
                  )}
                </button>
             </div>
          </div>

        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">About</h3>
          <p className="text-gray-600 text-sm">
            Butterfly Budget Tracker v1.3.0 <br/>
            Designed with 💜 for a simpler financial life.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
