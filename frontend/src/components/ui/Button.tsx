import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';
import alerts from '../../utils/alerts';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconOnly?: React.ReactNode;
  permission?: string;
  module?: string;
}

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md border-transparent hover:shadow-lg',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-transparent',
  outline: 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100 hover:border-rose-200 shadow-sm'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs h-8',
  md: 'px-5 py-2.5 text-sm h-11',
  lg: 'px-8 py-3 text-base h-14',
  icon: 'p-2.5 h-11 w-11 justify-center'
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className = '',
  variant = 'primary',
  size,
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  iconOnly,
  children,
  disabled,
  permission,
  module,
  onClick,
  ...props
}, ref) => {
  const { hasPermission, hasModuleAccess } = usePermission();

  const isAuthorized = 
    (permission ? hasPermission(permission) : true) &&
    (module ? hasModuleAccess(module) : true);

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAuthorized) {
      e.preventDefault();
      e.stopPropagation();
      alerts.friendlyError('Permission denied');
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  const isButtonDisabled = disabled || isLoading || !isAuthorized;
  const effectiveSize = size || (iconOnly ? 'icon' : 'md');
  const baseClasses = 'inline-flex items-center justify-center cursor-pointer font-bold rounded-xl transition-all active:scale-[0.98] border focus:outline-none focus:ring-4 focus:ring-indigo-100 gap-2';
  
  const combinedClasses = `
    ${baseClasses} 
    ${variants[variant]} 
    ${sizes[effectiveSize]} 
    ${fullWidth ? 'w-full' : ''} 
    ${isButtonDisabled ? 'opacity-60 cursor-not-allowed shadow-none active:scale-100 hover:border-inherit hover:bg-inherit' : ''}
    ${className}
  `.trim();

  return (
    <button ref={ref} className={combinedClasses} disabled={isButtonDisabled} onClick={handleOnClick} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="animate-spin w-4 h-4 shrink-0" />
          {children && <span>{children}</span>}
        </>
      ) : iconOnly ? (
        <span className="shrink-0">{iconOnly}</span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
