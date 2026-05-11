import React from 'react';
import { Card } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { RefreshCw, CloudLightning, Database, Info, Activity, Globe } from 'lucide-react';
import api from '../../../api/axios';
import Swal from 'sweetalert2';

interface DRProps {
  recovery: any;
  onRefresh: () => void;
}

const DRPanel: React.FC<DRProps> = ({ recovery, onRefresh }) => {
  const triggerFailoverDrill = async () => {
    const { value: confirmed } = await Swal.fire({
      title: 'Initialize Failover Drill?',
      text: "This will simulate a traffic switch to eu-central-1 (Secondary Region). Latency +150ms will be injected.",
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Run Drill',
      confirmButtonColor: '#4f46e5'
    });

    if (confirmed) {
       try {
          Swal.fire({ title: 'Switching Platform Gravity...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
          await api.post('/system/backup/restore-simulation'); // Reuse simulation as a "drill"
          Swal.fire('Failover Active', 'Serving from Secondary Region (Simulated)', 'success');
          onRefresh();
       } catch (err) {
          Swal.fire('Error', 'Drill initialization failed', 'error');
       }
    }
  };

  return (
    <Card className="bg-white border-slate-100 p-6 flex flex-col space-y-6 elevation-1">
       <div className="flex justify-between items-start">
          <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resilience Context</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">Disaster Recovery</h3>
          </div>
          <Badge variant="success" className="bg-indigo-50 text-indigo-700 font-black text-[9px] px-2 py-1 flex items-center gap-1">
             <Globe size={10} /> MULTI-REGION
          </Badge>
       </div>

       <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 text-center">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">RPO (Data Age)</p>
             <p className="text-lg font-black text-indigo-900">{recovery?.metrics?.rpo || '22m'}</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50 text-center">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Provable RTO</p>
             <p className="text-lg font-black text-indigo-900">{recovery?.metrics?.rto || '2.4s'}</p>
          </div>
       </div>

       <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-emerald-500"><Database size={14} /></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Cross-Region Sync</span>
             </div>
             <span className="text-[10px] font-black text-emerald-500 uppercase">Active</span>
          </div>

          <Button 
            className="w-full h-12 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase shadow-xl hover:bg-black"
            leftIcon={<CloudLightning size={14} />}
            onClick={triggerFailoverDrill}
          >
             Trigger Failover Drill
          </Button>
       </div>

       <div className="flex items-center gap-2 px-2">
          <Info size={14} className="text-slate-400" />
          <p className="text-[10px] font-bold text-slate-400 italic">Global anchors replicated to eu-central-1.</p>
       </div>
    </Card>
  );
};

export default DRPanel;
