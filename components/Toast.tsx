
import React, { useEffect } from 'react';
import { ButterflyIcon } from './Icons';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000); // Auto-hide after 4 seconds
    return () => clearTimeout(timer);
  }, [id, onClose]);

  // Thematic Styles
  const styles = {
    success: 'bg-nature-50 border-nature-200 text-nature-800 shadow-nature-100',
    error: 'bg-red-50 border-red-200 text-red-800 shadow-red-100',
    info: 'bg-butterfly-50 border-butterfly-200 text-butterfly-800 shadow-butterfly-100',
  };

  const icons = {
    success: <ButterflyIcon className="w-5 h-5 text-nature-500 animate-pulse" />,
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: <ButterflyIcon className="w-5 h-5 text-butterfly-500" />,
  };

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg mb-3
      animate-in slide-in-from-right duration-500 fade-in
      max-w-sm w-full pointer-events-auto backdrop-blur-sm
      ${styles[type]}
    `}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="text-sm font-medium">{message}</p>
      <button 
        onClick={() => onClose(id)} 
        className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
