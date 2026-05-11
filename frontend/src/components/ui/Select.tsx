import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, children, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={`relative w-full ${containerClassName}`}>
        <select
          ref={ref}
          className={`
            w-full transition-all duration-200 outline-none
            bg-white text-slate-900 
            border ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100'}
            rounded-xl px-4 py-3 
            appearance-none cursor-pointer
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-500">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
