import React, { useEffect } from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { PieChart, TrendingUp, Users, Package, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface AdminStats {
   summary: {
      mrr: number;
      totalTenants: number;
      activeSubscriptions: number;
      totalUsers: number;
      churnRate: string;
   };
   revenueTrend: Array<{ date: string; amount: number }>;
   topTenants: Array<{ id: string; businessName: string; currentPlan: string }>;
}

const AdminReports: React.FC = () => {
   const { data: stats, loading, error, fetchData } = useAdminData<AdminStats>('/admin/reports/dashboard');

   return (
      <AdminPageLayout
         title="Platform Insights"
         subtitle="Comprehensive data analytics and growth tracking"
         tag="Intelligence"
         icon={<PieChart className="text-indigo-600" size={24} />}
         actions={
            <Button variant="outline" onClick={() => fetchData()} disabled={loading} className="gap-2">
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
               Refresh Stats
            </Button>
         }
      >
         {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}

         {!error && (
            <div className={`space-y-8 ${loading && !stats ? 'opacity-50 pointer-events-none' : ''}`}>
               {/* Summary Cards */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { label: 'Platform MRR', value: `Rs. ${stats?.summary?.mrr?.toLocaleString() || 0}`, icon: Wallet, color: 'indigo', growth: '+12.4%' },
                     { label: 'Total Tenants', value: stats?.summary?.totalTenants || 0, icon: Package, color: 'emerald', growth: '+4.2%' },
                     { label: 'Active Users', value: stats?.summary?.totalUsers || 0, icon: Users, color: 'amber', growth: '+8.1%' },
                     { label: 'Monthly Churn', value: stats?.summary?.churnRate || '0%', icon: TrendingUp, color: 'rose', growth: '-0.5%', inverse: true }
                  ].map((card, i) => (
                     <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start">
                           <div className={`p-3 bg-${card.color}-50 text-${card.color}-600 rounded-2xl`}>
                              <card.icon size={24} />
                           </div>
                           <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter ${card.inverse ? 'text-emerald-600' : 'text-indigo-600'}`}>
                              {card.growth.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {card.growth}
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">{card.label}</p>
                           <p className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</p>
                        </div>
                     </div>
                  ))}
               </div>

               {/* Main Charts Row */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Revenue Trajectory</h3>
                           <p className="text-xs text-slate-500 font-medium">Daily platform revenue aggregation</p>
                        </div>
                        <Badge variant="info">Last 30 Days</Badge>
                     </div>

                     <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={stats?.revenueTrend || []}>
                              <defs>
                                 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                 dataKey="date"
                                 axisLine={false}
                                 tickLine={false}
                                 tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                 dy={10}
                              />
                              <YAxis
                                 axisLine={false}
                                 tickLine={false}
                                 tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                 tickFormatter={(val) => `Rs.${val}`}
                              />
                              <Tooltip
                                 contentStyle={{
                                    borderRadius: '16px',
                                    border: 'none',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                                    fontWeight: 700,
                                    fontSize: '12px'
                                 }}
                              />
                              <Area
                                 type="monotone"
                                 dataKey="amount"
                                 stroke="#4f46e5"
                                 strokeWidth={3}
                                 fillOpacity={1}
                                 fill="url(#colorRevenue)"
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 flex flex-col justify-between">
                     <div className="space-y-6">
                        <div className="space-y-1">
                           <h3 className="text-xl font-black tracking-tight uppercase">Top Growers</h3>
                           <p className="text-xs text-slate-400 font-medium font-sans">Business performance ranking</p>
                        </div>

                        <div className="space-y-4">
                           {(stats?.topTenants || []).map((tenant, idx) => (
                              <div key={tenant.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
                                 <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-xs font-black shadow-lg">
                                    {idx + 1}
                                 </div>
                                 <div className="flex-1 space-y-0.5">
                                    <p className="text-sm font-bold truncate leading-tight">{tenant.businessName}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{tenant.currentPlan} PLAN</p>
                                 </div>
                                 <div className="text-emerald-400">
                                    <ArrowUpRight size={16} />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="mt-8 pt-8 border-t border-white/10">
                        <Button variant="primary" className="w-full bg-white text-slate-900 hover:bg-indigo-50 border-none font-black text-xs uppercase tracking-widest py-4">
                           Generate Full Report
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </AdminPageLayout>
   );
};

export default AdminReports;

