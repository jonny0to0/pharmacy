import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className = '', noPadding = false, children, ...props }, ref) => {
  return (
    <div 
      ref={ref} 
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`px-6 py-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className = '', ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-bold text-slate-900 tracking-tight ${className}`} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, CardProps>(({ className = '', noPadding = false, ...props }, ref) => (
  <div ref={ref} className={`${noPadding ? '' : 'p-6'} ${className}`} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className = '', ...props }, ref) => (
  <div ref={ref} className={`px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between ${className}`} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
