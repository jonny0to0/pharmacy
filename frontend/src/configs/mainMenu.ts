import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  CreditCard, 
  Wallet, 
  Settings, 
  LayoutDashboard,
  Activity,
  UserPlus,
  UserRound,
  Stethoscope,
  Globe,
  Shield,
  Database,
  Building2,
  Zap,
  Layers,
  ShieldCheck,
  Flag,
  LifeBuoy,
  Bell,
  Link as LinkIcon
} from 'lucide-react';

export interface MenuItem {
  title: string | Record<string, string>;
  path: string;
  icon: any;
  permission?: string;
  module?: string;
  businessTypes?: string[];
}

export const mainMenu: MenuItem[] = [
  // --- Store Admin Modules ---
  { 
    title: 'Dashboard', 
    path: '/dashboard', 
    icon: LayoutDashboard, 
    permission: 'DASHBOARD.READ',
    businessTypes: ['PHARMACY', 'RETAILER', 'HOSPITAL', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE']
  },
  { 
    title: {
      PHARMACY: 'POS / Billing',
      RETAILER: 'Point of Sale',
      HOSPITAL: 'Billing Center',
      WHOLESALER: 'Bulk Sales',
      DEFAULT: 'Sales'
    },
    path: '/sales', 
    icon: ShoppingCart, 
    module: 'SALES',
    businessTypes: ['PHARMACY', 'RETAILER', 'HOSPITAL', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE']
  },
  { 
    title: 'Patients', 
    path: '/patients', 
    icon: UserRound, 
    module: 'CUSTOMERS', 
    businessTypes: ['HOSPITAL'] 
  },
  { 
    title: 'Doctors', 
    path: '/doctors', 
    icon: Stethoscope, 
    permission: 'STAFF.READ', 
    businessTypes: ['HOSPITAL'] 
  },
  { 
    title: {
      PHARMACY: 'Medicine Inventory',
      HOSPITAL: 'Supplied Goods',
      WHOLESALER: 'Warehouse Stock',
      DEFAULT: 'Inventory'
    },
    path: '/products', 
    icon: Package, 
    module: 'PRODUCTS',
    businessTypes: ['PHARMACY', 'RETAILER', 'HOSPITAL', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE']
  },
  { 
    title: {
      WHOLESALER: 'Logistics',
      DISTRIBUTOR: 'Bulk Orders',
      DEFAULT: 'Purchases'
    },
    path: '/purchases', 
    icon: Truck, 
    module: 'PURCHASES',
    businessTypes: ['PHARMACY', 'RETAILER', 'HOSPITAL', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE']
  },
  { 
    title: {
      HOSPITAL: 'Patient Records',
      PHARMACY: 'Customer Base',
      WHOLESALER: 'Sub-Distributors',
      DEFAULT: 'Customers'
    },
    path: '/customers', 
    icon: Users, 
    module: 'CUSTOMERS',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  { 
    title: 'Suppliers', 
    path: '/suppliers', 
    icon: Users, 
    module: 'SUPPLIERS',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  { 
    title: 'Staff Management', 
    path: '/account/staff', 
    icon: UserPlus, 
    permission: 'STAFF.READ',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  { 
    title: 'Payments', 
    path: '/payments', 
    icon: CreditCard, 
    module: 'PAYMENTS',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  { 
    title: 'Expenses', 
    path: '/expenses', 
    icon: Wallet, 
    module: 'EXPENSES',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  { 
    title: 'Reports',
    path: '/reports',
    icon: BarChart3, 
    module: 'REPORTS',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  { 
    title: 'Settings', 
    path: '/account/overview', 
    icon: Settings, 
    permission: 'SETTINGS_OPERATIONAL.READ',
    businessTypes: ['PHARMACY', 'RETAILER', 'WHOLESALER', 'DISTRIBUTOR', 'MEDICAL_STORE', 'HOSPITAL']
  },
  
  // --- Enterprise Super Admin Panel (Unified Command Center) ---
  { title: 'Command Center', path: '/admin/dashboard', icon: LayoutDashboard, businessTypes: ['SUPER_ADMIN'], permission: 'SA_DASHBOARD.READ' },
  { title: 'Tenants', path: '/admin/businesses', icon: Building2, businessTypes: ['SUPER_ADMIN'], permission: 'TENANT.READ' },
  { title: 'Subscriptions', path: '/admin/subscriptions', icon: Zap, businessTypes: ['SUPER_ADMIN'], permission: 'SUBSCRIPTION.READ' },
  { title: 'Plans', path: '/admin/plans', icon: Layers, businessTypes: ['SUPER_ADMIN'], permission: 'PLAN.MANAGE' },
  { title: 'Billing', path: '/admin/billing', icon: CreditCard, businessTypes: ['SUPER_ADMIN'], permission: 'BILLING.READ' },
  { title: 'Users', path: '/admin/users', icon: ShieldCheck, businessTypes: ['SUPER_ADMIN'], permission: 'ADMIN_USER.READ' },
  { title: 'Audit Logs', path: '/admin/logs', icon: Database, businessTypes: ['SUPER_ADMIN'], permission: 'AUDIT.READ' },
  { title: 'Feature Flags', path: '/admin/flags', icon: Flag, businessTypes: ['SUPER_ADMIN'], permission: 'FEATURE_FLAG.MANAGE' },
  { title: 'Support Tools', path: '/admin/support', icon: LifeBuoy, businessTypes: ['SUPER_ADMIN'], permission: 'SUPPORT.ACCESS' },
  { title: 'Reports', path: '/admin/reports', icon: BarChart3, businessTypes: ['SUPER_ADMIN'], permission: 'SA_REPORTS.READ' },
  { title: 'Settings', path: '/admin/settings', icon: Settings, businessTypes: ['SUPER_ADMIN'], permission: 'SA_SETTINGS.READ' },
  { title: 'System Health', path: '/admin/health', icon: Activity, businessTypes: ['SUPER_ADMIN'], permission: 'SYSTEM_HEALTH.READ' },
  { title: 'Notifications', path: '/admin/notifications', icon: Bell, businessTypes: ['SUPER_ADMIN'], permission: 'SA_NOTIFICATIONS.READ' },
  { title: 'Integrations', path: '/admin/integrations', icon: LinkIcon, businessTypes: ['SUPER_ADMIN'], permission: 'SA_INTEGRATIONS.READ' },
];
