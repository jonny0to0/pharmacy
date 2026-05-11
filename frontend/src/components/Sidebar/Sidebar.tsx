import React from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarContent from './SidebarContent';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:relative h-screen bg-[#0F172A] border-r border-slate-800 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out`}
      >
      <SidebarHeader />
      <SidebarContent />

      {/* Profile Summary Footer */}
      <div className="p-4 border-t border-slate-800/50 mt-auto">
        {!isCollapsed && (
          <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-400">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
   </>
  );
};

export default Sidebar;
