import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full transition-all duration-200 outline-none
          bg-white text-slate-900 placeholder:text-slate-400
          border ${error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100'}
          rounded-xl px-4 py-3 
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          resize-none
          ${className}
        `}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
