import React from 'react';
import { 
  Pill, 
  Hospital, 
  Package, 
  ShoppingBag, 
  Truck, 
  Store,
  CheckCircle2
} from 'lucide-react';

const OPTIONS = [
  { id: 'PHARMACY', label: 'Pharmacy', icon: Pill, gradient: 'from-pink-500 to-orange-400', shadow: 'shadow-orange-200', bg: 'bg-rose-50' },
  { id: 'HOSPITAL', label: 'Hospital', icon: Hospital, gradient: 'from-blue-600 to-indigo-400', shadow: 'shadow-blue-200', bg: 'bg-blue-50' },
  { id: 'WHOLESALER', label: 'Wholesaler', icon: Package, gradient: 'from-amber-500 to-yellow-400', shadow: 'shadow-amber-200', bg: 'bg-amber-50' },
  { id: 'RETAILER', label: 'Retailer', icon: ShoppingBag, gradient: 'from-purple-600 to-pink-400', shadow: 'shadow-purple-200', bg: 'bg-emerald-50' },
  { id: 'DISTRIBUTOR', label: 'Distributor', icon: Truck, gradient: 'from-blue-500 to-cyan-400', shadow: 'shadow-cyan-200', bg: 'bg-indigo-50' },
  { id: 'MEDICAL_STORE', label: 'Medical Store', icon: Store, gradient: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-200', bg: 'bg-purple-50' },
];

interface Props {
  data: string;
  update: (val: string) => void;
  onNext: () => void;
}

export default function Step1BusinessType({ data, update, onNext }: Props) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3 underline decoration-indigo-200 underline-offset-8">Select Your Industry</h2>
        <p className="text-slate-500 font-medium">Tailoring your workspace requires understanding your core operation.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = data === opt.id;
          
          return (
            <button
              key={opt.id}
              onClick={() => {
                update(opt.id);
                // Auto-advance after a brief delay for better UX
                setTimeout(onNext, 400);
              }}
              className={`
                group relative p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col items-center gap-5
                hover:scale-105 hover:shadow-2xl 
                ${isSelected 
                  ? `border-indigo-600 bg-white ring-8 ring-indigo-50 ${opt.shadow}` 
                  : 'border-slate-50 bg-slate-50/50 hover:bg-white text-slate-600 hover:border-indigo-200'}
              `}
            >
              <div className={`
                w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-lg
                ${isSelected 
                  ? `bg-gradient-to-br ${opt.gradient} text-white rotate-6` 
                  : 'bg-white text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-600 group-hover:-rotate-3'}
              `}>
                <Icon className="w-8 h-8" />
              </div>
              
              <div className="text-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] block mb-1 ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {opt.label}
                </span>
                <div className={`h-1 mx-auto bg-slate-200 mt-3 rounded-full transition-all duration-500 ${isSelected ? 'w-12 bg-indigo-500' : 'w-4 group-hover:w-8 group-hover:bg-indigo-300'}`} />
              </div>

              {isSelected && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white p-2 rounded-full shadow-lg z-20 animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-3">
        <span className="h-px w-8 bg-slate-100" />
        Strict industry mapping for compliance
        <span className="h-px w-8 bg-slate-100" />
      </p>
    </div>
  );
}
