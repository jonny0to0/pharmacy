import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { dashboardConfig } from "../configs/dashboardConfig";
import { DashboardWidget } from "../components/DashboardWidget";
import { 
  TrendingUp, Download, PlusCircle, 
  ArrowUpRight, Users, Briefcase, Calendar, Clock, ChevronRight,
  TrendingDown, ShoppingBag, ClipboardList, Zap, Activity
} from "lucide-react";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useAdminData } from "../hooks/useAdminData";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import AdminErrorBox from "../components/admin/AdminErrorBox";
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = useMemo(() => Array.isArray(user?.roles) && user.roles.includes('SUPER_ADMIN'), [user]);
  
  // If Super Admin accidentally hits this route, redirect to correct panel
  useEffect(() => {
    if (isSuperAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isSuperAdmin, navigate]);

  const dashboardUrl = '/reports/dashboard';
  
  const { 
    data, 
    loading, 
    error, 
    fetchData: refreshDashboard 
  } = useAdminData<any>(dashboardUrl);

  const handleExport = async () => {
    try {
      const res = await api.get("/reports/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      const isPlatform = Array.isArray(user?.roles) && user.roles.includes('SUPER_ADMIN');
      a.download = `${(isPlatform ? 'platform' : (user?.businessType || 'business')).toLowerCase()}_report.pdf`;
      a.click();
    } catch (err) {
      toast.error("Failed to export report");
    }
  };

  const businessType = useMemo(() => user?.businessType || 'PHARMACY', [user?.businessType]);
  const config = useMemo(() => dashboardConfig[businessType] || dashboardConfig['PHARMACY'], [businessType]);

  if (loading) {
     return (
        <div className="flex items-center justify-center min-h-[60vh]">
           <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Insights</p>
           </div>
        </div>
     );
  }

  if (error) {
    return <AdminErrorBox message={error} onRetry={() => refreshDashboard(null, true)} />;
  }

  if (!data) return null;

  return (
    <div className="px-4 py-6 md:p-8 space-y-8 animate-fade-up max-w-[1600px] mx-auto">
      
      {/* Dynamic Hero Header */}
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 md:p-10 elevation-1 mesh-bg-subtle">
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold px-3 py-1 text-[10px]">
                     {isSuperAdmin ? 'Platform Management' : businessType.replace('_', ' ')}
                  </Badge>
                  <div className="h-4 w-[1px] bg-slate-200"></div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                     <Calendar size={14} className="text-slate-300" />
                     {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
               </div>
               <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {isSuperAdmin ? "Ecosystem Overview" : `Welcome back, ${user?.name?.split(' ')[0]}`}
               </h1>
               <p className="text-slate-500 max-w-2xl font-medium text-base leading-relaxed">
                  {isSuperAdmin 
                    ? "Global performance metrics, revenue growth, and platform health at a glance." 
                    : "Your business metrics are up to date. Here is a summary of your performance for the last 7 days."}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full lg:w-auto mt-2 lg:mt-0">
               <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 bg-white" leftIcon={<Download size={18} />}>
                  Export Report
               </Button>
               {isSuperAdmin ? (
                  <Button onClick={() => navigate('/admin/businesses')} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white elevation-2" leftIcon={<PlusCircle size={18} />}>
                     Register Business
                  </Button>
               ) : (
                  <Button onClick={() => navigate('/sales')} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white elevation-2" leftIcon={<PlusCircle size={18} />}>
                     New Transaction
                  </Button>
               )}
            </div>
         </div>
      </div>

      <div className="space-y-8">
          {/* 4-Column KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <DashboardWidget type="TotalSales" data={{ value: data?.summary?.totalSales }} trend={{ value: '14.8%', up: true }} />
            <DashboardWidget type="NetProfit" data={{ value: data?.summary?.netProfit }} trend={{ value: '9.2%', up: true }} />
            <DashboardWidget type="TotalPurchases" data={{ value: data?.summary?.totalPurchases }} trend={{ value: '3.1%', up: false }} />
            <DashboardWidget type="TotalTransactions" data={{ value: data?.summary?.totalTransactions }} trend={{ value: '2.5%', up: true }} />
          </div>

          {/* Main Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Charts Section */}
            <div className="lg:col-span-2 space-y-8 min-w-0">
                <Card className="border-slate-100 elevation-1 bg-white overflow-hidden">
                  <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Revenue Analytics</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.05em]">Sales growth over the last 7 days</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</span>
                            </div>
                            <Badge variant="success" className="font-bold">Active</Badge>
                        </div>
                      </div>
                      
                      <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.salesTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.06}/>
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                  dataKey="date" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '700'}} 
                                  dy={15}
                              />
                              <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '700'}}
                                  tickFormatter={(val) => `₹${val/1000}k`}
                              />
                              <Tooltip 
                                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                  contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #f1f5f9', 
                                    borderRadius: '12px', 
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                    padding: '12px' 
                                  }}
                                  itemStyle={{ color: '#1e293b', fontWeight: '800', fontSize: '13px' }}
                                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
                              />
                              <Area 
                                  type="monotone" 
                                  dataKey="amount" 
                                  stroke="#6366f1" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorSales)" 
                                  animationDuration={1500}
                              />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                  </CardContent>
                </Card>

                {/* Secondary KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {config.components.slice(1, 3).map((comp: string) => (
                    <DashboardWidget key={comp} type={comp} data={data} />
                  ))}
                </div>
            </div>

            {/* Sidebar Rankings / Status */}
            <div className="space-y-8 min-w-0">
                <Card className="border-slate-100 elevation-1 bg-white h-full">
                  <div className="p-8 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                          Performance Leaderboard
                        </h3>
                        <TrendingUp size={18} className="text-indigo-600" />
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        {data ? (
                          (data.recentSales?.slice(0, 5) || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-50 elevation-hover transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs font-extrabold text-indigo-600">
                                  0{idx + 1}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.customer?.name || 'Walk-in'}</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest"># {item.invoiceNumber}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-extrabold text-slate-900">₹ {(item.grandTotal?.toLocaleString() || '0')}</p>
                                  <p className="text-[9px] text-emerald-600 font-bold uppercase">+2.4%</p>
                                </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-400 font-bold italic text-sm">No data available</div>
                        )}
                      </div>

                      <Button variant="outline" className="mt-8 w-full border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-widest bg-white" rightIcon={<ChevronRight size={14} />}>
                        View Full Report
                      </Button>
                  </div>
                </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="border-slate-100 elevation-1 bg-white">
                <CardContent className="p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">Recent Activity</h3>
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                      </div>
                   </div>
                   
                   <div className="space-y-1">
                      {data?.recentSales?.map((sale: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <ShoppingBag size={18} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="text-sm font-bold text-slate-800 truncate">{sale.customer?.name || 'Anonymous'}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Invoice #{sale.invoiceNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-extrabold text-slate-800">₹{sale.grandTotal.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             <Card className="border-slate-100 elevation-1 bg-white">
                <CardContent className="p-8">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">Business Status</h3>
                      <Badge variant="neutral" className="bg-slate-100 text-slate-600 font-bold">Standard</Badge>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Clock size={16} className="text-slate-400" />
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory Health</p>
                            </div>
                            <p className="text-xs font-black text-indigo-600">88% Optimal</p>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[88%] rounded-full"></div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Activity size={16} className="text-slate-400" />
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer Satisfaction</p>
                            </div>
                            <p className="text-xs font-black text-emerald-600">96% Positive</p>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[96%] rounded-full"></div>
                         </div>
                      </div>

                      <div className="mt-8 p-5 rounded-3xl bg-indigo-600 text-white elevation-hover cursor-pointer group">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                  <PlusCircle size={20} />
                               </div>
                               <div>
                                  <p className="text-sm font-bold">Smart Insights 2.0</p>
                                  <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Upgrade Pending</p>
                               </div>
                            </div>
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                         </div>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
    </div>
  );
}
