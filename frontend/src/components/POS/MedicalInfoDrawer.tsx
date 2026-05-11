import React from 'react';
import { X, Activity, LifeBuoy, AlertCircle, Info } from 'lucide-react';

interface MedicalInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    medicalDescription?: string;
    uses?: string;
    sideEffects?: string;
    precautions?: string;
    dosageInfo?: string;
  } | null;
}

const MedicalInfoDrawer: React.FC<MedicalInfoDrawerProps> = ({ isOpen, onClose, product }) => {
  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[201] shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Medical Intelligence</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {product.medicalDescription && (
              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} /> Description
                </h4>
                <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {product.medicalDescription}
                </p>
              </section>
            )}

            {product.uses && (
              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Primary Uses
                </h4>
                <div className="text-sm font-bold text-slate-800 whitespace-pre-line leading-relaxed">
                  {product.uses}
                </div>
              </section>
            )}

            {product.sideEffects && (
              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                  <LifeBuoy size={14} /> Side Effects
                </h4>
                <div className="text-sm font-semibold text-slate-600 whitespace-pre-line leading-relaxed p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50">
                  {product.sideEffects}
                </div>
              </section>
            )}

            {product.precautions && (
              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} /> Critical Warnings
                </h4>
                <div className="text-sm font-bold text-rose-700 whitespace-pre-line leading-relaxed p-4 bg-rose-50 rounded-2xl border border-rose-100 animate-pulse">
                  {product.precautions}
                </div>
              </section>
            )}

            {product.dosageInfo && (
              <section className="space-y-3">
                <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Standard Dosage</h4>
                <div className="text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed bg-blue-50/30 p-4 rounded-xl border border-blue-50">
                  {product.dosageInfo}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium italic">
              Data sourced from medical intelligence module. Always verify with current prescription.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MedicalInfoDrawer;
