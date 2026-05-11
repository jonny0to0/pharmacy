import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, iconPosition = 'left', className = '', containerClassName = '', ...props }, ref) => {
    // Automatically add calendar icon for date type if no icon is provided
    const isDate = props.type === 'date';
    const displayIcon = icon || (isDate ? <Calendar className="w-5 h-5" /> : null);
    const displayIconPosition = icon ? iconPosition : (isDate ? 'right' : iconPosition);

    return (
      <div className={`relative w-full group ${containerClassName}`}>
        {displayIcon && displayIconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-indigo-600">
            {React.isValidElement(displayIcon) ? React.cloneElement(displayIcon as React.ReactElement<any>, { size: 20 }) : displayIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            w-full transition-all duration-300 outline-none
            bg-white text-slate-900 placeholder:text-slate-400 font-medium
            border ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50'}
            rounded-xl py-3 
            ${displayIcon && displayIconPosition === 'left' ? 'pl-11 pr-4' : 'px-4'}
            ${displayIcon && displayIconPosition === 'right' ? 'pr-11' : ''}
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            appearance-none text-sm
            ${className}
          `}
          {...props}
        />

        {displayIcon && displayIconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-indigo-600">
            {React.isValidElement(displayIcon) ? React.cloneElement(displayIcon as React.ReactElement<any>, { size: 20 }) : displayIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
