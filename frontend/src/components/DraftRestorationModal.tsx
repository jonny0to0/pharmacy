import React from 'react';
import Modal from './Modal';
import Button from './ui/Button';
import { RefreshCw, Trash2, Clock } from 'lucide-react';

interface DraftRestorationModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  formName: string;
  timestamp?: number;
}

const DraftRestorationModal: React.FC<DraftRestorationModalProps> = ({
  isOpen,
  onRestore,
  onDiscard,
  formName,
  timestamp
}) => {
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown time';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDiscard} // Discard on close for safety
      maxWidth="max-w-md"
    >
      <Modal.Body className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full ring-8 ring-blue-50/50">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin-slow" />
          </div>
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          Restore your work?
        </h2>
        
        <p className="text-slate-500 mb-8 px-4">
          We found an unsaved draft for <span className="font-bold text-slate-700">{formName}</span> from <span className="font-medium text-blue-600">{formattedTime}</span>. Would you like to resume where you left off?
        </p>

        <div className="space-y-3">
          <Button 
            className="w-full py-6 rounded-2xl text-lg flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
            onClick={onRestore}
          >
            <RefreshCw className="w-5 h-5" />
            Restore Draft
          </Button>
          
          <Button 
            variant="ghost"
            className="w-full py-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center gap-2 group"
            onClick={onDiscard}
          >
            <Trash2 className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            Discard Unsaved Data
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DraftRestorationModal;
