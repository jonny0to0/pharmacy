import { 
  User, Building2, ShieldCheck, MapPin, CreditCard, 
  Users, Lock, Zap, Bell, Database, PieChart
} from 'lucide-react';

export interface SettingsSection {
  id: string;
  label: string;
  items: SettingsMenuItem[];
}

export interface SettingsMenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  permission?: string;
}

export const settingsMenu: SettingsSection[] = [
  {
    id: 'personal',
    label: 'My Account',
    items: [
      { id: 'personal', label: 'Personal Profile', icon: User, path: '/account/personal-profile' },
      { id: 'security', label: 'Security Settings', icon: Lock, path: '/account/security' },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/account/notifications' },
    ]
  },
  {
    id: 'business',
    label: 'Business Settings',
    items: [
      { id: 'overview', label: 'Business Overview', icon: PieChart, path: '/account/overview', permission: 'SETTINGS_OPERATIONAL.READ' },
      { id: 'profile', label: 'Business Profile', icon: Building2, path: '/account/profile', permission: 'SETTINGS_BUSINESS.READ' },
      { id: 'compliance', label: 'Compliance & Legal', icon: ShieldCheck, path: '/account/compliance', permission: 'SETTINGS_BUSINESS.READ' },
      { id: 'address', label: 'Business Address', icon: MapPin, path: '/account/address', permission: 'SETTINGS_BUSINESS.READ' },
    ]
  },
  {
    id: 'operations',
    label: 'Operational Controls',
    items: [
      { id: 'staff', label: 'Staff Management', icon: Users, path: '/account/staff', permission: 'STAFF.READ' },
      { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, path: '/account/roles', permission: 'ROLES.READ' },
      { id: 'modules', label: 'System Modules', icon: Zap, path: '/account/modules', permission: 'SETTINGS_BUSINESS.READ' },
      { id: 'data', label: 'Data & Backup', icon: Database, path: '/account/data', permission: 'SETTINGS_OPERATIONAL.READ' },
    ]
  },
  {
    id: 'billing',
    label: 'Financials',
    items: [
      { id: 'subscription', label: 'Subscription Plan', icon: Zap, path: '/account/subscription', permission: 'SETTINGS_BUSINESS.READ' },
      { id: 'billing', label: 'Billing & Payments', icon: CreditCard, path: '/account/billing', permission: 'SETTINGS_BUSINESS.READ' },
    ]
  }
];
