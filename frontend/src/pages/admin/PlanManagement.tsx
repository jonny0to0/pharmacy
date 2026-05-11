import React, { useState } from 'react';
import { Layers, Plus, Check, Edit3, Save, X, Info, Copy } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { useAdminData } from '../../hooks/useAdminData';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

interface PlanFeature {
  id: string;
  featureKey: string;
  enabled: boolean;
}

interface PlanLimit {
  id: string;
  limitKey: string;
  value: number;
}

interface PlanData {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string | null;
  price: number;
  billingCycle: string;
  type: 'FREE' | 'SUBSCRIPTION' | 'LIFETIME';
  isActive: boolean;
  isCurrent: boolean;
  features: PlanFeature[];
  limits: PlanLimit[];
  _count: { subscriptions: number };
}

const PlanManagement: React.FC = () => {
  const { data: plans, loading, error, fetchData, mutate } = useAdminData<PlanData[]>('/admin/plans');
  const [duplicateLoading, setDuplicateLoading] = useState<string | null>(null);

  const handleDuplicate = async (plan: PlanData) => {
      setDuplicateLoading(plan.id);
      const res = await mutate('post', '/', {
          code: plan.code,
          name: `${plan.name} (Copy)`,
          price: plan.price,
          billingCycle: plan.billingCycle,
          type: plan.type,
          features: plan.features.reduce((acc, f) => ({ ...acc, [f.featureKey]: f.enabled }), {}),
          limits: plan.limits.reduce((acc, l) => ({ ...acc, [l.limitKey]: l.value }), {}),
          changeLog: `Duplicated from ${plan.name} v${plan.version}`
      });
      if (res.success) fetchData();
      setDuplicateLoading(null);
  };

  const currentPlans = plans?.filter(p => p.isCurrent) || [];

  return (
    <div className="p-8 space-y-8 animate-fade-up max-w-[1400px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold px-3 py-1 text-[10px] uppercase mb-3">
             Revenue Configuration
          </Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Subscription Tiers</h1>
          <p className="text-slate-500 font-medium text-sm">Define product capabilities, pricing models, and feature access gates.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white elevation-2" leftIcon={<Plus size={18} />}>
          Create New Plan
        </Button>
      </div>

      {error && <AdminErrorBox message={error} onRetry={() => fetchData()} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading && !plans ? (
            Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse h-[500px] bg-slate-50/50 border-slate-100" />
            ))
        ) : (
          currentPlans.map((plan) => (
            <Card key={plan.id} className={`relative overflow-hidden border-slate-100 elevation-1 transition-all hover:elevation-2 bg-white ${plan.type === 'SUBSCRIPTION' && plan.price > 0 ? 'ring-2 ring-indigo-500/20' : ''}`}>
               {plan.isCurrent && (
                  <div className="absolute top-0 right-0">
                     <div className="bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-xl shadow-sm">
                        Version {plan.version}
                     </div>
                  </div>
               )}
              <CardContent className="p-8">
                <div className={`w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6`}>
                  <Layers size={24} />
                </div>
                
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                   <span className="text-3xl font-black text-slate-900">
                     {plan.price === 0 ? "₹0" : `₹${plan.price.toLocaleString()}`}
                   </span>
                   <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ {plan.billingCycle.toLowerCase()}</span>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">Features</p>
                  {plan.features.filter(f => f.enabled).slice(0, 5).map((feature) => (
                    <div key={feature.id} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                         <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-sm font-semibold text-slate-600 truncate">{feature.featureKey.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {plan.features.filter(f => f.enabled).length > 5 && (
                      <p className="text-[10px] font-bold text-indigo-500 ml-8">+{plan.features.filter(f => f.enabled).length - 5} more features</p>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-50 pb-1">Limits</p>
                   {plan.limits.map((limit) => (
                       <div key={limit.id} className="flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{limit.limitKey.replace(/_limit/g, '').replace(/_/g, ' ')}</span>
                           <Badge variant="neutral" className="bg-slate-50 border-slate-100 text-slate-700 font-black">{limit.value === -1 ? '∞' : limit.value}</Badge>
                       </div>
                   ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-50 mb-8 flex justify-between items-center">
                   <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Active Tenants</div>
                   <Badge variant="neutral" className="bg-white border-slate-200 text-slate-700 font-black">{plan._count.subscriptions}</Badge>
                </div>

                <div className="flex gap-2">
                   <Button variant="outline" className="flex-1 border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-widest py-3 hover:bg-slate-50" leftIcon={<Edit3 size={14} />}>
                      Edit
                   </Button>
                   <Button 
                    variant="outline" 
                    className="border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" 
                    iconOnly={<Copy size={16} />}
                    onClick={() => handleDuplicate(plan)}
                    disabled={duplicateLoading === plan.id}
                   />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="border-slate-100 elevation-1 bg-white">
         <CardContent className="p-8">
             <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                   <Info size={24} />
                </div>
                <div>
                   <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Industrial Gating & Snapshots</h4>
                   <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      This system uses <strong>Grandfathering</strong>. When you update a plan, we create a new version. Existing subscribers remain on their purchase-time snapshots 
                      until their next renewal or manual intervention. 
                      <span className="text-indigo-600 ml-1 font-bold">Never read features directly from the plan table in production; always use the subscription snapshot.</span>
                   </p>
                </div>
             </div>
         </CardContent>
      </Card>
    </div>
  );
};

export default PlanManagement;
