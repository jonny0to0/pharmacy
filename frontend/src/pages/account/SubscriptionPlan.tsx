import React, { useState, useEffect } from 'react';
import { Zap, Check, CreditCard, Clock, Calendar, ChevronRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { usePermission } from '../../hooks/usePermission';

const SubscriptionPlan = () => {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('SETTINGS.UPDATE');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/current');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      await api.post('/subscriptions/change', {
        planName: plan,
        billingCycle: 'MONTHLY',
        amount: plan === 'PRO' ? 499 : 0
      });
      toast.success(`Successfully switched to ${plan} plan`);
      fetchSubscription();
    } catch (err) {
      toast.error('Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-[0.3em] animate-pulse">
      <Zap className="w-12 h-12 mb-4 opacity-20" />
      Syncing Licenses...
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 rounded-3xl mx-auto flex items-center justify-center text-rose-500 shadow-inner">
        <Zap size={40} className="rotate-12 opacity-50" />
      </div>
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Subscription metadata offline.</p>
      <button onClick={fetchSubscription} className="text-blue-600 font-black uppercase tracking-widest text-[10px] hover:underline">Re-authenticate</button>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-7xl space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
            Licensing Suite
            <span className="px-6 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-xl shadow-blue-200">
              {data.currentPlan} STATUS
            </span>
          </h1>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Enterprise Tiers & Operational Scalability</p>
        </div>
        
        <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authorization Renewal</p>
            <p className="text-xl font-black text-slate-800 tracking-tight">
              {data.planExpiry ? new Date(data.planExpiry).toLocaleDateString() : 'Indefinite Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Free Plan */}
        <div className={`p-12 rounded-[4rem] border-2 transition-all duration-500 group relative overflow-hidden ${
          data.currentPlan === 'FREE' 
          ? 'border-slate-900 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] scale-105 z-10' 
          : 'border-slate-100 bg-slate-50/20 hover:bg-white hover:border-slate-200 shadow-sm hover:shadow-2xl'
        }`}>
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-12 -mt-12">
            <ShieldCheck size={200} />
          </div>

          <div className="space-y-10 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Starter Protocol</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase mt-2 tracking-widest opacity-60">Base Infrastructure</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-slate-800 tracking-tighter">₹0</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Perpetual Access</p>
              </div>
            </div>
            
            <ul className="space-y-4">
              {[
                'Under 500 Inventory Nodes',
                'Basic Point of Sale System',
                'Manual Persistence Sync (CSV)',
                'Single Administrator Instance',
                'Standard Analytics Reports'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-600">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button 
              disabled={data.currentPlan === 'FREE' || upgrading || !canEdit}
              onClick={() => handleUpgrade('FREE')}
              className={`w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                !canEdit ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' :
                data.currentPlan === 'FREE' 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 cursor-default ring-8 ring-slate-100' 
                : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-900 shadow-sm active:scale-95'
              }`}
            >
              {data.currentPlan === 'FREE' ? 'Active Deployment' : 'Switch to Starter Tier'}
            </button>
          </div>
        </div>

        {/* Pro Plan */}
        <div className={`p-12 rounded-[4rem] border-2 relative overflow-hidden transition-all duration-700 group ${
          data.currentPlan === 'PRO' 
          ? 'border-blue-600 bg-white shadow-[0_50px_120px_rgba(37,99,235,0.15)] scale-105 z-10' 
          : 'border-slate-100 bg-slate-50/20 hover:bg-white hover:border-blue-100 shadow-sm hover:shadow-2xl'
        }`}>
          {data.currentPlan !== 'PRO' && (
            <div className="absolute top-8 right-8 px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full tracking-widest animate-pulse shadow-xl shadow-blue-200 z-20">
              High Performance
            </div>
          )}
          
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000">
            <Sparkles size={300} className="text-blue-600" />
          </div>

          <div className="space-y-10 relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl text-white flex items-center justify-center shadow-2xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                  <Zap size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Pro Pharma</h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase mt-2 tracking-widest">Growth Accelerator</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-blue-600 tracking-tighter">₹499</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Monthly License</p>
              </div>
            </div>
            
            <ul className="space-y-4">
              {[
                'Unlimited Inventory Infrastructure',
                'Advanced Expiry Guard Logic',
                'Autonomous Daily Persistence',
                'Multi-Member Staff Management',
                'P&L Analytics Dashboard',
                'High-Priority Direct Channels'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    <Check size={14} strokeWidth={4} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button 
              disabled={data.currentPlan === 'PRO' || upgrading || !canEdit}
              onClick={() => handleUpgrade('PRO')}
              className={`w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl ${
                !canEdit ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' :
                data.currentPlan === 'PRO' 
                ? 'bg-blue-600 text-white shadow-blue-300 ring-8 ring-blue-50 cursor-default' 
                : 'bg-slate-900 text-white hover:bg-black shadow-slate-200 active:scale-95'
              }`}
            >
              {upgrading ? <Loader2 size={18} className="animate-spin mx-auto" /> : (data.currentPlan === 'PRO' ? 'Active Deployment' : 'Authorize Upgrade Tier')}
            </button>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
              <CreditCard size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight lowercase first-letter:uppercase">Transaction history logs</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">Audited Financial journals</p>
            </div>
          </div>
          <button className="px-8 py-3 bg-slate-50 hover:bg-slate-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all active:scale-95">Download PDF Manifest</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <th className="px-10 py-6">Timestamp</th>
                <th className="px-10 py-6">Protocol Tier</th>
                <th className="px-10 py-6 text-center">Amount</th>
                <th className="px-10 py-6 text-center">Auth Status</th>
                <th className="px-10 py-6 text-right">Receipt Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.subscriptions?.length > 0 ? data.subscriptions.map((sub: any) => (
                <tr key={sub.id} className="text-sm font-bold text-slate-700 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">{new Date(sub.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-10 py-6">
                    <span className="font-black text-slate-900 uppercase tracking-tight">{sub.planName} Tier</span>
                  </td>
                  <td className="px-10 py-6 text-center tabular-nums">₹{sub.amount}</td>
                  <td className="px-10 py-6 text-center">
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-xl border border-emerald-100 tracking-widest">{sub.status}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button className="w-10 h-10 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl transition-all shadow-inner group-hover:scale-110 flex items-center justify-center mx-auto mr-0 shadow-lg shadow-blue-50/50 border border-slate-50">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-[0.4em] opacity-40">Zero transaction packets recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlan;
