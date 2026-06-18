import { Outlet, useLocation } from "react-router-dom";
import UserDropdown from "./UserDropdown";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import ImpersonationBanner from "./ImpersonationBanner";
import { mainMenu } from "../configs/mainMenu";
import ErrorBoundary from "./ErrorBoundary";
import { useSidebar } from "../context/SidebarContext";
import { Menu } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const { toggleMobile } = useSidebar();
  
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const businessType = user?.businessType || 'DEFAULT';

  // We still need to resolve the current page title for the header
  const currentPageItem = mainMenu.find(n => n.path === location.pathname);
  
  const resolveItemTitle = (item: any) => {
    if (!item) return null;
    if (typeof item.title === 'string') return item.title;
    if (item.title && typeof item.title === 'object') {
      return item.title[businessType] || item.title['DEFAULT'] || 'Module';
    }
    return 'Module';
  };

  const currentPage = resolveItemTitle(currentPageItem) || 
    (location.pathname === "/settings" ? "Settings" : 
     (location.pathname.startsWith("/account") ? "Account Center" : "Overview"));

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden mesh-bg-subtle">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <ImpersonationBanner />
        <header className="h-20 glass-surface border-b border-slate-200/60 flex items-center px-4 md:px-8 shadow-sm justify-between z-20 shrink-0 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobile}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="h-6 w-1 bg-indigo-600 rounded-full hidden sm:block"></div>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight truncate">{currentPage}</h1>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:flex px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 items-center gap-2">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                  {isSuperAdmin ? 'System Admin' : user?.businessType}
                </span>
             </div>
             <UserDropdown />
          </div>
        </header>

        <div className="flex-1 overflow-auto relative custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-10 h-full">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
