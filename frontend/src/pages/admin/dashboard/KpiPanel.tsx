import React from 'react';
import { Card } from '../../../components/ui/Card';
import { TrendingUp, Users, DollarSign, Wallet } from 'lucide-react';

interface KpiProps {
  data?: any;
}

const KpiPanel: React.FC<KpiProps> = ({ data }) => {
  const kpis = [
    { 
      label: 'Platform MRR', 
      value: `₹${(data?.mrr || 0).toLocaleString()}`, 
      trend: '+12.5%', 
      icon: <DollarSign size={20} />, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50' 
    },
    { 
      label: 'Active Tenants', 
      value: (data?.totalTenants || 0).toLocaleString(), 
      trend: `+${data?.activeSubscriptions || 0}`, 
      icon: <Users size={20} />, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Churn Rate', 
      value: data?.churnRate || '2.1%', 
      trend: '-0.4%', 
      icon: <TrendingUp size={20} />, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50' 
    },
    { 
      label: 'Active Users', 
      value: (data?.totalUsers || 0).toLocaleString(), 
      trend: 'Stable', 
      icon: <Wallet size={20} />, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50' 
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, idx) => (
        <Card key={idx} className="bg-white border-slate-100 p-6 flex flex-col justify-between overflow-hidden relative group hover:border-indigo-100 transition-colors">
          <div className="flex justify-between items-start">
             <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                {kpi.icon}
             </div>
             <div className="text-right">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${kpi.trend.startsWith('+') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                   {kpi.trend}
                </span>
             </div>
          </div>
          <div className="mt-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
             <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{kpi.value}</h3>
          </div>
          <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-500 text-slate-900 pointer-events-none">
             {/* Render a large version of the icon for visual effect */}
             {idx === 0 && <DollarSign size={80} />}
             {idx === 1 && <Users size={80} />}
             {idx === 2 && <TrendingUp size={80} />}
             {idx === 3 && <Wallet size={80} />}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default KpiPanel;
