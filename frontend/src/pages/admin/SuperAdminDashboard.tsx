import { 
  Activity, 
  ShieldCheck, 
  Bell, 
  RefreshCw, 
  Database, 
  Users, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  Terminal, 
  Lock,
  Zap,
  Plus,
  Smartphone,
  Server,
  AlertTriangle
} from 'lucide-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAdminData } from '../../hooks/useAdminData';

// --- SUB-COMPONENTS ---
import KpiPanel from './dashboard/KpiPanel';
import SystemHealth from './SystemHealth';
import IncidentPanel from './dashboard/IncidentPanel';
import SecurityPanel from './dashboard/SecurityPanel';
import DRPanel from './dashboard/DRPanel';
import HealthPanel from './dashboard/HealthPanel';
import AdminErrorBox from '../../components/admin/AdminErrorBox';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { 
    data: healthData, 
    loading: healthLoading, 
    error: healthError, 
    fetchData: fetchHealth 
  } = useAdminData<any>('/system/health');

  const { 
    data: reportData, 
    loading: reportLoading, 
    error: reportError, 
    fetchData: fetchReports 
  } = useAdminData<any>('/admin/reports/dashboard');

  const onRefresh = useCallback(() => {
    fetchHealth(null, true);
    fetchReports(null, true);
  }, [fetchHealth, fetchReports]);

  const handleNewProvision = () => {
    navigate('/admin/businesses'); // Redirect to businesses for new provision
  };

  const loading = healthLoading || reportLoading;
  const error = healthError || reportError;

  if (loading && !healthData) return (
    <div className="p-8 h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50">
       <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
       <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Initializing Control Plane...</p>
    </div>
  );

  if (error && !healthData) return (
    <div className="p-8 h-screen flex flex-col items-center justify-center space-y-6 bg-slate-50">
       <AdminErrorBox message={error} onRetry={onRefresh} />
    </div>
  );

  const getModeBadge = (mode: string) => {
     switch(mode) {
       case 'INCIDENT': return <Badge className="bg-rose-500 text-white border-none px-3 font-black flex items-center gap-1.5"><AlertTriangle size={12}/> INCIDENT</Badge>;
       case 'FAILOVER': return <Badge className="bg-indigo-600 text-white border-none px-3 font-black flex items-center gap-1.5"><Server size={12}/> FAILOVER</Badge>;
       case 'DEGRADED': return <Badge className="bg-amber-500 text-white border-none px-3 font-black flex items-center gap-1.5"><Activity size={12}/> DEGRADED</Badge>;
       default: return <Badge className="bg-emerald-500 text-white border-none px-3 font-black flex items-center gap-1.5"><ShieldCheck size={12}/> NORMAL</Badge>;
     }
  };

  return (
    <div className="p-4 md:p-8 pb-24 bg-slate-50 min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* 🔴 GLOBAL STATUS & MODE BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className="p-1 pr-4 rounded-full bg-white border border-slate-100 flex items-center gap-2 shadow-sm">
                <div className={`p-2.5 rounded-full ${healthData?.status === 'OPERATIONAL' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   <Activity size={18} />
                </div>
                <div>
                   <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      Platform Control Plane
                      {healthData && getModeBadge(healthData.mode)}
                   </h1>
                </div>
             </div>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
             <Button variant="outline" className="flex-1 md:flex-none rounded-xl font-black text-[10px] uppercase border-slate-200 bg-white" leftIcon={<RefreshCw size={14} />} onClick={onRefresh}>Sync Nodes</Button>
                           <Button 
                className="flex-1 md:flex-none bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-xl" 
                leftIcon={<Plus size={14} />}
                onClick={handleNewProvision}
              >
                New Provision
              </Button>

          </div>
      </div>

      {/* 🚀 KPI & QUICK INTELLIGENCE PANEL */}
      <KpiPanel data={reportData?.summary} />

      {healthData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-slate-100 p-6 flex items-center gap-4 group cursor-pointer hover:border-indigo-200 transition-all shadow-sm" onClick={() => navigate('/admin/health')}>
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-100 transition-colors">
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Breach Rate</p>
                    <h4 className="text-xl font-black text-slate-900">{healthData.intelligence?.slaBreachRate || '0.0%'}</h4>
                </div>
              </Card>

              <Card className="bg-white border-slate-100 p-6 flex items-center gap-4 group cursor-pointer hover:border-amber-200 transition-all shadow-sm" onClick={() => navigate('/admin/devices')}>
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-100 transition-colors">
                    <Smartphone size={20} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trusted Devices</p>
                    <h4 className="text-xl font-black text-slate-900">{healthData.devices?.length || 0} Registered</h4>
                </div>
              </Card>
          </div>

          {/* CENTER LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* LEFT: INCIDENT HUB & HEALTH */}
              <div className="lg:col-span-8 space-y-8">
                  <SystemHealth 
                    data={healthData} 
                    loading={healthLoading} 
                    onRefresh={onRefresh} 
                  />
                  <HealthPanel services={healthData.services} monitoring={healthData.monitoring} />
              </div>

              {/* RIGHT: SECURITY & DR */}
              <div className="lg:col-span-4 space-y-8">
                  <IncidentPanel 
                    incidents={healthData.incidents} 
                    efficiency={healthData.efficiency}
                    onRefresh={onRefresh}
                  />
                  <SecurityPanel integrity={healthData.integrity} onRefresh={onRefresh} />
                  <DRPanel recovery={healthData.recovery} onRefresh={onRefresh} />
              </div>
          </div>
        </>
      )}
    </div>
  );
}
