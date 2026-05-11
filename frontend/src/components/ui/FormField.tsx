import React from 'react';
import Label from './Label';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <Label required={required}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        {children}
      </div>

      {(error || helperText) && (
        <div className="mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {error ? (
            <p className="text-red-500 text-xs font-medium leading-relaxed">
              {error}
            </p>
          ) : (
            <p className="text-slate-500 text-xs leading-relaxed">
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default FormField;
