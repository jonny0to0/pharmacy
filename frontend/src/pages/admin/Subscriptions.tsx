import React from 'react';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';
import { 
  CreditCard, 
  ShieldCheck, 
  ShieldAlert, 
  MoreVertical, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  DollarSign,
  Pause,
  Play,
  XCircle,
  Clock
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface SubscriptionData {
  id: string;
  businessName: string;
  planName: string; // Now includes version from backend, e.g., "PRO (v2)"
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'INACTIVE' | 'PENDING' | 'TRIAL' | 'PAST_DUE';
  usersCount: string; // Now a formatted string from backend, e.g., "5 / 10"
  expiryDate: string | null;
  isLifetime: boolean;
  amount: number;
  mrr: number;
  billingCycle: string;
}

const Subscriptions: React.FC = () => {
  const { data: subscriptions, loading, error, fetchData, mutate } = useAdminData<SubscriptionData[]>('/admin/subscriptions');

  const handleAction = async (id: string, action: string) => {
    const res = await mutate('post', `/subscriptions/${id}/action`, { action });
    if (res.success) fetchData();
  };

  const getStatusBadge = (status: SubscriptionData['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
            <ShieldCheck size={12} strokeWidth={3} />
            Active
          </div>
        );
      case 'TRIAL':
        return (
          <div className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase tracking-wider">
            <Activity size={12} strokeWidth={3} />
            Trial
          </div>
        );
      case 'PAST_DUE':
        return (
          <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase tracking-wider">
            <Clock size={12} strokeWidth={3} />
            Past Due
          </div>
        );
      case 'SUSPENDED':
        return (
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <Pause size={12} strokeWidth={3} />
            Suspended
          </div>
        );
      case 'CANCELLED':
      case 'EXPIRED':
        return (
          <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase tracking-wider">
            <XCircle size={12} strokeWidth={3} />
            {status}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            {status}
          </div>
        );
    }
  };

  // KPI Calculations
  const stats = {
    mrr: subscriptions?.reduce((acc, curr) => acc + (curr.status === 'ACTIVE' ? curr.mrr : 0), 0) || 0,
    active: subscriptions?.filter(s => s.status === 'ACTIVE').length || 0,
    trial: subscriptions?.filter(s => s.status === 'TRIAL').length || 0,
    pending: subscriptions?.filter(s => s.status === 'PAST_DUE').length || 0,
  };

  return (
    <AdminPageLayout
      title="Subscriptions"
      subtitle="Industrial Billing Control Center: Snapshots & Grandfathering Protection Active"
      tag="Revenue v2.5"
      icon={<CreditCard className="text-indigo-600" size={24} />}
      actions={
        <Button variant="outline" onClick={() => fetchData()} disabled={loading} className="gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      }
    >
      {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}
      
      {!error && (
        <div className="space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Active MRR', value: `₹${stats.mrr.toLocaleString()}`, icon: <TrendingUp size={16}/>, color: 'indigo' },
              { label: 'Active Tenants', value: stats.active, icon: <ShieldCheck size={16}/>, color: 'emerald' },
              { label: 'Active Trials', value: stats.trial, icon: <Activity size={16}/>, color: 'blue' },
              { label: 'Past Due', value: stats.pending, icon: <ShieldAlert size={16}/>, color: 'amber' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600`}>
                  {kpi.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
                  <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Business & ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Plan (Version)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Limit Utilization</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading && !subscriptions ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-8">
                          <div className="h-4 bg-slate-100 rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : subscriptions?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No subscriptions found.
                      </td>
                    </tr>
                  ) : subscriptions?.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 leading-tight">{sub.businessName}</p>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                          SUB_{sub.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] px-2 py-0.5 mb-1">
                          {sub.planName}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                          <DollarSign size={10} />
                          {sub.amount.toLocaleString()} / {sub.billingCycle}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
                              <Users size={12} className="text-slate-400"/>
                              {sub.usersCount} <span className="text-[10px] text-slate-400 font-medium">Users</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                               MRR: ₹{sub.mrr.toLocaleString()}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Calendar size={12} className="text-slate-400" />
                          {sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'LIFETIME'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {sub.status === 'ACTIVE' && (
                            <Button 
                              variant="outline" 
                              className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-amber-600 border-amber-100 hover:bg-amber-50"
                              onClick={() => handleAction(sub.id, 'SUSPEND')}
                            >
                              Suspend
                            </Button>
                          )}
                          {(sub.status === 'SUSPENDED' || sub.status === 'INACTIVE' || sub.status === 'TRIAL') && (
                            <Button 
                              variant="primary" 
                              className="h-8 px-3 text-[9px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleAction(sub.id, 'ACTIVATE')}
                            >
                              Activate
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            iconOnly={<MoreVertical size={14} />} 
                            className="h-8 w-8" 
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default Subscriptions;
