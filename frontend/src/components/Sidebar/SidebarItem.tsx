import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import alerts from '../../utils/alerts';

interface SidebarItemProps {
  to: string;
  icon: any;
  title: string;
  badge?: boolean;
  disabled?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon: Icon, title, badge, disabled }) => {
  const location = useLocation();
  const { isCollapsed } = useSidebar();
  const isActive = !disabled && location.pathname === to;

  return (
    <div className="relative group/tooltip">
      <Link
        to={disabled ? '#' : to}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            alerts.friendlyError('Permission denied');
          }
        }}
        className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 relative ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-transparent text-slate-600 hover:bg-transparent hover:text-slate-600"
            : isActive
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        }`}
      >
        {Icon && <Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-5 w-5'} flex-shrink-0 transition-transform duration-200 ${isActive ? "text-white scale-110" : disabled ? "text-slate-600" : "text-slate-500 group-hover:text-slate-200"}`} />}
        {!isCollapsed && <span className="flex-1 truncate">{title}</span>}
        {!isCollapsed && isActive && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </Link>

      {isCollapsed && (
        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-x-0 -translate-x-3 transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-800">
          {title}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
