import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import Button from '../ui/Button';

interface AdminErrorBoxProps {
  message: string;
  onRetry?: () => void;
}

const AdminErrorBox: React.FC<AdminErrorBoxProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-rose-50 border-2 border-rose-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-200/50">
        <AlertCircle size={32} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-rose-900 tracking-tight">Data Access Error</h3>
        <p className="text-sm text-rose-600 font-medium max-w-sm mx-auto">
          {message || 'The system encountered an error while retrieving administrative data.'}
        </p>
      </div>
      {onRetry && (
        <Button 
          variant="primary" 
          onClick={onRetry}
          className="bg-rose-600 hover:bg-rose-700 border-none shadow-xl shadow-rose-200 gap-2 px-8 py-3 text-[10px] uppercase font-black tracking-widest"
        >
          <RefreshCcw size={14} />
          Retry Request
        </Button>
      )}
    </div>
  );
};

export default AdminErrorBox;
