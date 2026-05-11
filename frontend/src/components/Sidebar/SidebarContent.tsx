import React, { useEffect, useState } from 'react';
import { useSidebar } from '../../context/SidebarContext';
import type { SidebarMode } from '../../context/SidebarContext';
import { useSidebarMode } from '../../hooks/useSidebarMode';
import { mainMenu } from '../../configs/mainMenu';
import { settingsMenu } from '../../configs/settingsMenu';
import SidebarItem from './SidebarItem';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../context/AuthContext';
import { Settings, ArrowLeft } from 'lucide-react';

const SidebarContent: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { mode, switchToMain } = useSidebarMode();
  const { user } = useAuth();
  const { hasPermission, hasModuleAccess } = usePermission();
  const [displayMode, setDisplayMode] = useState<SidebarMode>(mode);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const businessType = user?.businessType || 'DEFAULT';

  const resolveItemTitle = (title: string | Record<string, string>) => {
    if (typeof title === 'string') return title;
    return title[businessType] || title['DEFAULT'] || 'Module';
  };

  // Switcher Logic with Tailwind Transitions
  useEffect(() => {
    if (mode !== displayMode) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayMode(mode);
        setIsTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mode, displayMode]);

  const filteredMainMenu = mainMenu.filter(item => {
    // 1. Strict Role-Based Isolation
    if (isSuperAdmin) {
      // Super Admin ONLY sees items where businessTypes includes 'SUPER_ADMIN'
      if (!item.businessTypes?.includes('SUPER_ADMIN')) return false;
    } else {
      // Store Admins NEVER see items where businessTypes is ONLY ['SUPER_ADMIN']
      if (item.businessTypes?.includes('SUPER_ADMIN') && item.businessTypes?.length === 1) return false;
      
      // Check business type match for store items
      if (item.businessTypes && !item.businessTypes.includes(businessType)) return false;
    }

    // 2. Permission & Module Gates
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.module && !hasModuleAccess(item.module)) return false;
    
    return true;
  });

  const filteredSettingsMenu = settingsMenu.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.permission && !hasPermission(item.permission)) return false;
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Settings Indicator Logic */}
      {mode === 'SETTINGS' && (
        <div className={`px-6 py-4 border-b border-slate-800/30 bg-slate-800/20 transition-all duration-300 ${isCollapsed ? 'items-center justify-center flex' : ''}`}>
          {isCollapsed ? (
            <button
               onClick={switchToMain}
               className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-indigo-400 hover:text-white transition-all shadow-lg border border-slate-700"
               title="Back to Main Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
               <div className="flex items-center gap-2 mb-3 text-indigo-400">
                <Settings className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Settings</span>
              </div>
              <button
                onClick={switchToMain}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Main Menu</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Menu with Transitions */}
      <div 
        className={`flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
          isTransitioning 
            ? 'opacity-0 -translate-x-2' 
            : 'opacity-100 translate-x-0'
        }`}
      >
        {displayMode === 'MAIN' ? (
          filteredMainMenu.map((item) => (
            <SidebarItem
              key={resolveItemTitle(item.title)}
              to={item.path}
              icon={item.icon}
              title={resolveItemTitle(item.title)}
            />
          ))
        ) : (
          <div className="space-y-6">
            {filteredSettingsMenu.map((section) => (
              <div key={section.id} className="mb-6 last:mb-2 text-slate-200">
                {!isCollapsed && (
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 mb-3">
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem
                      key={item.id}
                      to={item.path}
                      icon={item.icon}
                      title={item.label}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarContent;
