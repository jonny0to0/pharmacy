import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  animate?: boolean;
}

const Modal: React.FC<ModalProps> & {
  Header: React.FC<{ children: React.ReactNode; onClose?: () => void }>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
} = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-2xl',
  className = '',
  animate = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 ${animate ? 'animate-fade-in' : ''}`}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col transition-all duration-300 ${animate ? 'animate-in zoom-in-95 fade-in' : ''} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex-1">
              {typeof title === 'string' ? (
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
              ) : (
                title
              )}
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[calc(90vh-80px)]">
          {children}
        </div>

        {footer && (
          <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    modalRoot
  );
};

Modal.Header = ({ children, onClose }) => (
  <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
    <div className="flex-1">{children}</div>
    {onClose && (
      <button 
        onClick={onClose}
        className="w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer hover:rotate-90"
      >
        <X className="w-6 h-6" />
      </button>
    )}
  </div>
);

Modal.Body = ({ children, className = '' }) => (
  <div className={`p-8 ${className}`}>
    {children}
  </div>
);

Modal.Footer = ({ children, className = '' }) => (
  <div className={`px-8 py-6 border-t border-slate-100 bg-slate-50/50 ${className}`}>
    {children}
  </div>
);

export default Modal;
