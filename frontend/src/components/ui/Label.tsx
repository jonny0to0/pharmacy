import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ children, required, className = '', ...props }) => {
  return (
    <label 
      className={`block text-sm font-medium text-slate-900 mb-1.5 truncate ${className}`} 
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1" title="Required field">*</span>}
    </label>
  );
};

export default Label;
