import React from 'react';
import { 
  IndianRupee, TrendingUp, TrendingDown, Package, Users, Activity, 
  UserPlus, Calendar, Truck, ClipboardList, AlertCircle, 
  ShoppingCart, LayoutDashboard, Globe, Zap, ArrowUpRight, ArrowDownRight,
  ShoppingBag
} from 'lucide-react';

const icons: Record<string, any> = {
  QuickSummary: LayoutDashboard,
  TotalPlatformSales: IndianRupee,
  TotalOrders: ShoppingCart,
  ActiveBusinesses: Globe,
  RevenueTrends: TrendingUp,
  TotalPlatformRevenue: IndianRupee,
  ActiveSubscriptions: Zap,
  RecentRegistrations: UserPlus,
  FailedPayments: AlertCircle,
  ChurnRate: TrendingDown,
  PlatformEngagement: Activity,
  
  // Tenant Specific
  TotalSales: IndianRupee,
  NetProfit: TrendingUp,
  TotalPurchases: ShoppingBag,
  TotalTransactions: ClipboardList,
  
  POS: ShoppingCart,
  InventoryStatus: Package,
  RecentSales: IndianRupee,
  ExpiryAlerts: AlertCircle,
  PatientManagement: UserPlus,
  DoctorSchedule: Calendar,
  BillingOverview: ClipboardList,
  BedAvailability: Activity,
  BulkOrders: Truck,
  SupplierRelations: Users,
  WarehouseStatus: Package,
  CustomerLoyalty: Users,
  DailyReports: TrendingUp,
  LogisticsTracking: Truck,
  SupplierLedger: ClipboardList,
  CustomerDirectory: Users,
};

const colors: Record<string, string> = {
  TotalPlatformSales: 'indigo',
  TotalPlatformRevenue: 'indigo',
  TotalSales: 'indigo',
  NetProfit: 'emerald',
  TotalPurchases: 'amber',
  TotalTransactions: 'sky',
  TotalOrders: 'violet',
  ActiveBusinesses: 'blue',
  ActiveSubscriptions: 'rose',
  RecentRegistrations: 'orange',
  FailedPayments: 'rose',
  ChurnRate: 'amber',
  PlatformEngagement: 'emerald',
  InventoryStatus: 'amber',
  ExpiryAlerts: 'rose',
};

export const DashboardWidget = ({ type, data, trend }: { type: string, data?: any, trend?: { value: string, up: boolean } }) => {
  const Icon = icons[type] || LayoutDashboard;
  const color = colors[type] || 'slate';
  
  const value = data?.value !== undefined ? data.value : (data?.summary?.[type.charAt(0).toLowerCase() + type.slice(1)] ?? '0');
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
    orange: 'bg-orange-50 text-orange-600',
    slate: 'bg-slate-50 text-slate-600',
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 elevation-1 elevation-hover flex flex-col justify-between h-full min-h-[140px] min-w-0">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-2xl ${colorClasses[color] || colorClasses.slate} transition-transform duration-300`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        {trend && (
           <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${trend.up ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend.value}
           </div>
        )}
      </div>

      <div className="min-w-0">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400 mb-1 truncate">
          {type.replace(/([A-Z])/g, ' $1').trim()}
        </h4>
        <div className="flex items-baseline gap-2 min-w-0">
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans truncate">
            {(type.toLowerCase().includes('sales') || type.toLowerCase().includes('revenue') || type.toLowerCase().includes('profit') || type.toLowerCase().includes('purchases')) && !formattedValue.toString().startsWith('₹') ? `₹${formattedValue}` : formattedValue}
          </p>
        </div>
        
        {data?.status && (
          <div className="mt-2 text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <div className="w-1 h-1 rounded-full bg-slate-300"></div>
            {data.status}
          </div>
        )}
      </div>
    </div>
  );
};
