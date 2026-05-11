import React from 'react';
import { Card } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { Zap, Activity, Database, CreditCard, Cloud } from 'lucide-react';

interface HealthProps {
  services: any;
  monitoring: any;
}

const HealthPanel: React.FC<HealthProps> = ({ services, monitoring }) => {
  const serviceIcons: any = {
    api: <Zap size={18} className="text-amber-500" />,
    database: <Database size={18} className="text-indigo-500" />,
    storage: <Cloud size={18} className="text-emerald-500" />,
    payments: <CreditCard size={18} className="text-rose-500" />
  };

  return (
    <Card className="bg-white border-slate-100 overflow-hidden elevation-1">
       <div className="p-4 md:p-8 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
          <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                 <Zap size={20} className="text-amber-500" />
                 Global Infrastructure Registry
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Availability: {monitoring.availability} • Last Sync: {new Date().toLocaleTimeString()}</p>
          </div>
          <Badge variant="neutral" className="bg-slate-900 text-white text-[9px] font-black tracking-widest px-3 py-1">PRODUCTION</Badge>
       </div>

       <div className="p-4 md:p-8 grid grid-cols-1 gap-8">
          {/* Detailed latency table */}
          <div className="space-y-4">
             {Object.entries(services).map(([name, svc]: [string, any]) => (
                <div key={name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:border-slate-100 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${svc.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                      <div className="p-2 border border-slate-100 bg-white rounded-xl">
                         {serviceIcons[name] || <Activity size={18} />}
                      </div>
                      <div>
                         <p className="text-xs font-black text-slate-900 uppercase">{name}</p>
                         <p className="text-[10px] font-bold text-slate-400">{svc.provider || svc.version || 'Operational'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-slate-700">{svc.latency || svc.connections || 'OK'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Latency / Load</p>
                   </div>
                </div>
             ))}
          </div>

          {/* Aggregate SLIs */}
          <div className="space-y-6 flex flex-col justify-center">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">P95 Entry Latency</p>
                   <p className="text-3xl font-black text-slate-900">{monitoring.p95Latency}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">P99 Tail Errors</p>
                   <p className="text-3xl font-black text-rose-600">{monitoring.p99Latency}</p>
                </div>
             </div>
             
             <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-[11px] font-black text-slate-400 uppercase">Traffic Distribution</span>
                   <span className="text-[11px] font-black text-indigo-500">84% Primary Region</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                   <div className="h-full bg-indigo-500" style={{ width: '84%' }}></div>
                   <div className="h-full bg-slate-200" style={{ width: '16%' }}></div>
                </div>
             </div>
          </div>
       </div>
    </Card>
  );
};

export default HealthPanel;
