import { Activity, Database, Cpu, HardDrive, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Bell, CheckSquare, XCircle, Info, Zap, Key, BookOpen, Shield, Users, ArrowUpRight, SortAsc, SortDesc } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../api/axios';
import Swal from 'sweetalert2';

import { useAdminData } from '../../hooks/useAdminData';

interface HealthData {
  status: string;
  uptime: number;
  monitoring: {
     errorRate5m: number;
     p95Latency: string;
     p99Latency: string;
     availability: string;
     since: string;
  };
  services: {
    api: { status: string; latency: string; version: string };
    database: { status: string; latency: string; connections: number };
    storage: { status: string; provider: string; region: string };
    payments: { status: string; provider: string; latency: string };
  };
  recovery: {
     lastSuccess: string;
     status: string;
     size: string;
     provider: string;
     metrics: {
        rpo: string;
        rto: string;
        lastValidation: string;
     };
     validation: {
        sanity: string;
        consistency: string;
        checksum: string;
     };
  };
  resources: {
    heapTotal: string;
    heapUsed: string;
    rss: string;
  };
  efficiency: {
    avgMtta: string;
    targetMtta: string;
    avgMttr: string;
    targetMttr: string;
  };
  incidents?: any[];
}

interface SystemHealthProps {
  data?: HealthData;
  loading?: boolean;
  onRefresh?: () => void;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ 
  data: externalData, 
  loading: externalLoading, 
  onRefresh: externalRefresh 
}) => {
  const isInternal = !externalData;
  const { data: internalData, loading: internalLoading, fetchData: internalRefresh } = useAdminData<HealthData>(
    '/system/health', 
    isInternal // Only auto-fetch if no external data provided
  );

  const data = externalData || internalData;
  const loading = externalLoading || internalLoading;
  const fetchHealth = externalRefresh || internalRefresh;

  const [integrityStatus, setIntegrityStatus] = useState<{status: string, message: string} | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const incidents = data?.incidents || [];

  const sortedServices = useMemo(() => {
    if (!data?.services) return [];
    return Object.entries(data.services).sort(([a], [b]) => 
      sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );
  }, [data?.services, sortOrder]);

  // Mock historical data for charts
  const resourceHistory = useMemo(() => {
    const points = 20;
    const now = Date.now();
    return Array.from({ length: points }).map((_, i) => ({
      time: new Date(now - (points - i) * 10000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heap: parseFloat(data?.resources.heapUsed || '0') * (0.9 + Math.random() * 0.2),
      rss: parseFloat(data?.resources.rss || '0') * (0.95 + Math.random() * 0.1),
    }));
  }, [data?.resources]);

  useEffect(() => {
    // Only set up interval if we are the primary data source (Internal)
    if (isInternal) {
      const interval = setInterval(() => fetchHealth(null, true), 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [fetchHealth, isInternal]);

  const handleIntegrityCheck = async () => {
    try {
       Swal.fire({ title: 'Traversing Audit Chain...', text: 'Verifying cryptographic hashes and signatures', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
       const { data } = await api.post('/system/integrity/verify');
       setIntegrityStatus({ status: data.success ? 'VERIFIED' : 'BREACHED', message: data.message });
       Swal.fire(data.success ? 'Chain Verified' : 'Breach Detected', data.message, data.success ? 'success' : 'error');
    } catch (err) {
       Swal.fire('Error', 'Verification failed', 'error');
    }
  };

  const handleRestoreSimulation = async () => {
    try {
       Swal.fire({ title: 'Initializing Restore Dry-run', text: 'Mounting snapshot and verifying consistency...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
       const { data: responseData } = await api.post('/system/backup/restore-simulation');
       const result = responseData.data;
       Swal.fire('Simulation Complete', `Verdict: ${result.verdict}\nDuration: ${result.duration}`, result.verdict === 'SUCCESS' ? 'success' : 'error');
       fetchHealth();
    } catch (err) {
       Swal.fire('Error', 'Simulation failed', 'error');
    }
  };

  const handleAssign = async (id: string) => {
    try {
       await api.post(`/system/incidents/${id}/assign`);
       fetchHealth();
    } catch (err) {
       Swal.fire('Error', 'Assignment failed', 'error');
    }
  };

  const handleAddNote = async (id: string) => {
     const { value: note } = await Swal.fire({
        title: 'Operational Note',
        input: 'textarea',
        inputPlaceholder: 'Actions taken, findings, or post-mortem follow-ups...',
        showCancelButton: true,
        confirmButtonText: 'Append Note'
     });

     if (note) {
        await api.post(`/system/incidents/${id}/note`, { note });
        fetchHealth();
     }
  };

  const handleResolve = async (id: string) => {
     await api.post(`/system/incidents/${id}/resolve`);
     fetchHealth();
  };

  const handleRotateKeys = async () => {
    const { value: confirmed } = await Swal.fire({
      title: 'Rotate Audit Keys?',
      text: "This is a CRITICAL action. Historical logs will remain verifiable, but all future anchors will use the new key version.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rotate Now',
      confirmButtonColor: '#e11d48'
    });

    if (confirmed) {
      try {
        Swal.fire({ title: 'Rotating Keys...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const { data } = await api.post('/system/integrity/rotate-keys');
        Swal.fire('Keys Rotated', `New Active Key: ${data.keyId}`, 'success');
        fetchHealth();
      } catch (err) {
        Swal.fire('Error', 'Key rotation failed', 'error');
      }
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return `${d}d ${h}h`;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-up max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Badge variant="neutral" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 text-[10px] uppercase mb-3 tracking-widest">
             Reliability Engineering Hub
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Reliability & Telemetry</h1>
          <p className="text-slate-500 font-medium text-sm">Automated incident detection, cryptographic audit integrity, and SLIs.</p>
        </div>
        <div className="flex gap-4">
           <Button 
             variant="outline" 
             className="border-slate-200 text-slate-600 font-bold bg-white" 
             onClick={handleIntegrityCheck}
             leftIcon={<ShieldCheck size={16} className="text-indigo-500" />}
           >
              Verify Audit Integrity
           </Button>
            <Button 
              className="bg-rose-600 text-white font-bold" 
              onClick={handleRotateKeys}
              leftIcon={<Key size={16} />}
            >
               Rotate Audit Keys
            </Button>
            <Button 
              className="bg-indigo-600 text-white font-bold" 
              onClick={fetchHealth}
              disabled={loading}
              leftIcon={<RefreshCw className={loading ? 'animate-spin' : ''} size={16} />}
            >
              {loading ? 'Polling Nodes...' : 'Force Probe'}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-8">
            {/* Critical SLIs */}
               <Card className="bg-white border-slate-100 p-6 flex flex-col justify-between col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operator Efficiency (MTTA / MTTR)</p>
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="text-2xl font-black">{data?.efficiency?.avgMtta || '---'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg Response (SLA: {data?.efficiency?.targetMtta})</p>
                     </div>
                     <div className="h-10 w-[1px] bg-slate-100"></div>
                     <div>
                        <p className="text-2xl font-black">{data?.efficiency?.avgMttr || '---'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avg Resolute (SLO: {data?.efficiency?.targetMttr})</p>
                     </div>
                     <Activity className="text-indigo-100" size={40} />
                  </div>
               </Card>

            {/* Service Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="bg-white border-slate-100 elevation-1 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                     <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        Infrastructure Registry
                     </h3>
                     <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          className="h-7 px-2 border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500"
                          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                          leftIcon={sortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />}
                        >
                          {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                        </Button>
                        <Badge variant="neutral" className="text-[9px] uppercase font-black tracking-widest">MULTI-REGION</Badge>
                     </div>
                  </div>
                  <div className="p-6 space-y-4">
                     {data && sortedServices.map(([name, svc]: [string, any]) => (
                        <div key={name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-50">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${svc.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                              <div>
                                 <p className="text-xs font-black text-slate-900 uppercase">{name}</p>
                                 <p className="text-[10px] font-bold text-slate-400">{svc.provider || svc.version || 'Operational'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs font-black text-slate-700">{svc.latency || svc.connections || 'OK'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Load / Ping</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>

               <Card className="bg-white border-slate-100 elevation-1 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                     <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <ShieldCheck size={18} className="text-emerald-500" />
                        DR Validation (RPO/RTO)
                     </h3>
                     <Badge variant="success" className="text-[9px] uppercase font-black tracking-widest">VALIDATED</Badge>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current RPO</p>
                           <p className="font-bold text-slate-900">{data?.recovery.metrics.rpo}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target RTO</p>
                           <p className="font-bold text-slate-900">{data?.recovery.metrics.rto}</p>
                        </div>
                     </div>
                     <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layered Health</p>
                        <div className="space-y-2">
                           {data && Object.entries(data.recovery.validation).map(([k, v]) => (
                              <div key={k} className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                 <span className="text-[10px] font-black text-slate-500 uppercase">{k}</span>
                                 <span className="text-[9px] font-black text-emerald-600">{v}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="px-8 pb-8 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <Info size={14} className="text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-400 italic">Partial Restore Dry-run: Scheduled for MON 00:00</span>
                      </div>
                      <Button 
                         className="bg-slate-900 text-white text-[10px] uppercase font-black" 
                         leftIcon={<RefreshCw size={12} />}
                         onClick={handleRestoreSimulation}
                      >
                        Simulate Restore
                     </Button>
                  </div>
               </Card>
            </div>

            {/* Master Uptime & Resource Profile */}
            <Card className="bg-black text-white border-slate-800 p-8 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Activity size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                   <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Master Process Uptime</p>
                      <p className="text-6xl font-black tracking-tighter">{data ? formatUptime(data.uptime) : '00d 00h'}</p>
                   </div>
                    <div className="flex-1 h-32 mt-4 md:mt-0">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={resourceHistory}>
                             <defs>
                                <linearGradient id="colorHeap" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <Tooltip 
                                contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                             />
                             <Area type="monotone" dataKey="heap" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHeap)" />
                             <Area type="monotone" dataKey="rss" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-8 md:gap-12">
                       <div className="text-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Heap Used</p>
                          <p className="text-3xl font-black">{data?.resources.heapUsed || '0 MB'}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">RSS Pool</p>
                          <p className="text-3xl font-black">{data?.resources.rss || '0 MB'}</p>
                       </div>
                    </div>
                </div>
            </Card>
         </div>

         {/* Operational Incident Feed */}
         <div className="lg:col-span-1 space-y-8">
            <Card className="bg-white border-slate-100 elevation-1 flex flex-col h-full overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                   <h4 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                     <Bell size={16} className="text-emerald-400" />
                     Incident Management Hub
                   </h4>
                   <Badge variant="neutral" className="bg-indigo-500 text-white text-[10px] font-black">{incidents.length}</Badge>
               </div>
               <div className="p-4 space-y-4 max-h-[850px] overflow-auto custom-scrollbar">
                  {incidents.length === 0 ? (
                     <div className="py-20 text-center space-y-3">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-100" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ecosystem Healthy</p>
                     </div>
                  ) : incidents.map(incident => (
                    <div key={incident.id} className={`p-4 rounded-3xl border transition-all ${
                      incident.status === 'ACTIVE' ? 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm shadow-rose-100' :
                      incident.status === 'ACKNOWLEDGED' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                      'bg-slate-50 border-slate-100 text-slate-700'
                    } flex flex-col gap-3 relative overflow-hidden group`}>
                       <div className="flex justify-between items-start">
                          <div className="flex gap-2">
                             <Badge variant="neutral" className={`text-[8px] font-black uppercase ${
                               incident.severity === 'CRITICAL' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' :
                               incident.severity === 'WARNING' ? 'bg-amber-500 text-white' :
                               'bg-slate-600 text-white'
                             }`}>{incident.severity}</Badge>
                             <Badge variant="neutral" className="bg-white/60 text-current border-current border text-[8px] font-black">{incident.status}</Badge>
                          </div>
                          <span className="text-[9px] font-bold opacity-60 uppercase">{new Date(incident.createdAt).toLocaleTimeString()}</span>
                       </div>
                       
                       <div>
                          <p className="text-xs font-black leading-relaxed mb-1">{incident.message}</p>
                          <div className="flex flex-wrap gap-3 items-center mt-2">
                             <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">
                                Assigned: <span className="text-current">{incident.assignedTo || 'Unclaimed'}</span>
                             </p>
                             {incident.noteCount > 0 && (
                                <Badge variant="neutral" className="bg-white/40 text-current text-[8px] font-black">
                                   {incident.noteCount} Operational Notes
                                </Badge>
                             )}
                             {incident.runbookUrl && (
                                <a href={incident.runbookUrl} target="_blank" className="flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase hover:underline">
                                   <BookOpen size={10} /> View Runbook
                                </a>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex gap-2 pt-2 border-t border-current/10 opacity-40 group-hover:opacity-100 transition-opacity">
                          {!incident.assignedTo && (
                             <button onClick={() => handleAssign(incident.id)} 
                               className="flex-1 py-1.5 bg-white/40 hover:bg-white/80 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all">
                                <Users size={12} /> Claim
                             </button>
                          )}
                          <button onClick={() => handleAddNote(incident.id)} 
                             className="flex-1 py-1.5 bg-white/40 hover:bg-white/80 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all">
                             <Info size={12} /> Note
                          </button>
                          <button onClick={() => handleResolve(incident.id)}
                            className="flex-1 py-1.5 bg-white/40 hover:bg-white/80 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all">
                             <XCircle size={12} /> Resolve
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
            
            {integrityStatus && (
               <Card className={`${integrityStatus.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} p-6 animate-pulse`}>
                  <div className="flex gap-4">
                     {integrityStatus.status === 'VERIFIED' ? <ShieldCheck className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
                     <div>
                        <p className="text-xs font-black uppercase tracking-tight">{integrityStatus.status}</p>
                        <p className="text-[10px] font-bold opacity-70">{integrityStatus.message}</p>
                     </div>
                  </div>
               </Card>
            )}
         </div>
      </div>
    </div>
  );
};

export default SystemHealth;
