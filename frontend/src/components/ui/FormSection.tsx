import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="border-b border-slate-100 pb-3 mb-2">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500 font-medium opacity-80">
            {description}
          </p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
