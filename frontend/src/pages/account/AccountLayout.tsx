import React from 'react';
import { Outlet } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';

const AccountLayout = () => {
  return (
    <div className="min-h-[calc(100vh-120px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Content Area - Full Width */}
      <main className="w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-full overflow-hidden">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default AccountLayout;
