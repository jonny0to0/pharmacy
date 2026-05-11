import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';

// Pages
import Dashboard from './pages/Dashboard';
import SalesPOS from './pages/SalesPOS';
import Purchases from './pages/Purchases';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupLayout from './pages/setup/SetupLayout';
import SetupPassword from './pages/auth/SetupPassword';

// Account Pages
import AccountLayout from './pages/account/AccountLayout';
import AccountOverview from './pages/account/Overview';
import BusinessProfile from './pages/account/BusinessProfile';
import PersonalProfile from './pages/account/PersonalProfile';
import Compliance from './pages/account/Compliance';
import BusinessAddress from './pages/account/BusinessAddress';
import BillingSettings from './pages/account/BillingSettings';
import StaffManagement from './pages/account/staff';
import RoleManagement from './pages/account/RoleManagement';
import SecuritySettings from './pages/account/SecuritySettings';
import SubscriptionPlan from './pages/account/SubscriptionPlan';
import Notifications from './pages/account/Notifications';
import DataBackup from './pages/account/DataBackup';
import Modules from './pages/account/Modules';
import TenantManagement from './pages/admin/TenantManagement';
import GlobalUserSearch from './pages/admin/GlobalUserSearch';
import PlanManagement from './pages/admin/PlanManagement';
import BillingCenter from './pages/admin/BillingCenter';
import SystemHealth from './pages/admin/SystemHealth';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import GlobalAuditLogs from './pages/admin/GlobalAuditLogs';
import AdminSubscriptions from './pages/admin/Subscriptions';
import AdminFeatureFlags from './pages/admin/FeatureFlags';
import AdminSupportTools from './pages/admin/SupportTools';
import AdminReports from './pages/admin/AdminReports';
import PlatformSettings from './pages/admin/PlatformSettings';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminIntegrations from './pages/admin/Integrations';
import DeviceManagement from './pages/admin/DeviceManagement';
import GlobalSearch from './pages/admin/GlobalSearch';
import Reports from './pages/Reports';

const ROLE_LANDING_PAGES: Record<string, string> = {
  SUPER_ADMIN: '/admin/dashboard',
  BUSINESS_ADMIN: '/dashboard',
  PHARMACIST: '/products',
  CASHIER: '/sales',
};

function ProtectedRoute({ children, requireSetup = true }: { children: React.ReactNode, requireSetup?: boolean }) {
  const { token, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Establishing Secure Session...</p>
      </div>
    );
  }

  if (!token) {
    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
    return <Navigate to="/login" replace />;
  }

  // Ensure isSuperAdmin check uses the same logic as AuthContext
  const isSuperAdmin = Array.isArray(user?.roles) && user.roles.includes('SUPER_ADMIN');

  if (requireSetup && user && !user.isSetupCompleted && !isSuperAdmin) {
    return <Navigate to="/setup" replace />;
  }

  if (!requireSetup && user && user.isSetupCompleted) {
    const primaryRole = Array.isArray(user.roles) ? user.roles[0] : null;
    const defaultPath = primaryRole ? (ROLE_LANDING_PAGES[primaryRole] || '/') : '/';
    return <Navigate to={defaultPath} replace />;
  }
  
  return <>{children}</>;
}

function RoleBasedHome() {
  const { user } = useAuth();
  
  const primaryRole = Array.isArray(user?.roles) ? user.roles[0] : null;
  const defaultPath = primaryRole ? (ROLE_LANDING_PAGES[primaryRole] || '/dashboard') : '/dashboard';
  
  return <Navigate to={defaultPath} replace />;
}

function App() {
  return (
    <Router>
      <SidebarProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup-account" element={<SetupPassword />} />
        
        {/* Setup Route */}
        <Route path="/setup" element={
          <ProtectedRoute requireSetup={false}>
            <SetupLayout />
          </ProtectedRoute>
        } />
        
        {/* Main App Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<RoleBasedHome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesPOS />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/products" element={<Products />} />
          {/* We'll handle business-specific sub-routes here if needed, or inside the components */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Navigate to="/account/overview" replace />} />
          
          {/* New Account Section */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Navigate to="/account/overview" replace />} />
            <Route path="personal-profile" element={<PersonalProfile />} />
            <Route path="overview" element={<AccountOverview />} />
            <Route path="profile" element={<BusinessProfile />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="address" element={<BusinessAddress />} />
            <Route path="billing" element={<BillingSettings />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="subscription" element={<SubscriptionPlan />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="data" element={<DataBackup />} />
            <Route path="modules" element={<Modules />} />
          </Route>

          {/* Super Admin Global Routes */}
          <Route path="/admin">
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="businesses" element={<TenantManagement />} />
            <Route path="users" element={<GlobalUserSearch />} />
            <Route path="plans" element={<PlanManagement />} />
            <Route path="billing" element={<BillingCenter />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="devices" element={<DeviceManagement />} />
            <Route path="logs" element={<GlobalAuditLogs />} />
            <Route path="search" element={<GlobalSearch />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="flags" element={<AdminFeatureFlags />} />
            <Route path="support" element={<AdminSupportTools />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<PlatformSettings />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="integrations" element={<AdminIntegrations />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </SidebarProvider>
    </Router>
  );
}

export default App;

