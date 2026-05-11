import React, { useState, useEffect } from 'react';
import { 
  Database, FileSpreadsheet, FileText, Download, Trash2, 
  AlertTriangle, RefreshCcw, Loader2, CheckCircle2, ChevronRight, 
  CloudUpload, History 
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { usePermission } from '../../hooks/usePermission';

const DataBackup = () => {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('SETTINGS.UPDATE');
  const [exporting, setExporting] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupJobId, setBackupJobId] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<any>(null);

  const handleExport = (type: string) => {
    setExporting(type);
    setTimeout(() => {
      setExporting(null);
      toast.success(`${type} generated and download started`);
    }, 2500);
  };

  const initiateBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.post('/system/backup/initiate');
      setBackupJobId(res.data.jobId);
      setBackupStatus(res.data);
      toast.success('Backup sequence initialized');
    } catch (err) {
      toast.error('Failed to start backup');
      setIsBackingUp(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (backupJobId && isBackingUp) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/system/backup/status/${backupJobId}`);
          setBackupStatus(res.data);
          if (res.data.status === 'COMPLETED') {
            clearInterval(interval);
            setIsBackingUp(false);
            setBackupJobId(null);
            toast.success('System backup successfully persisted');
          } else if (res.data.status === 'FAILED') {
            clearInterval(interval);
            setIsBackingUp(false);
            toast.error('Backup operation failed');
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [backupJobId, isBackingUp]);

  return (
    <div className="p-4 md:p-10 max-w-7xl space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Data & Persistence</h1>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Infrastructure Redundancy & Ledger Audits</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Cloud Backup Card */}
        <div className={`relative overflow-hidden bg-slate-900 rounded-[3.5rem] p-12 text-white transition-all duration-700 shadow-2xl ${isBackingUp ? 'ring-[16px] ring-blue-600/10 scale-[1.02]' : 'hover:scale-[1.01]'}`}>
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000">
            <CloudUpload size={400} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] text-blue-400 flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform">
                  <Database size={40} />
                </div>
                <div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/80">Snapshot Protocol</span>
                   <h3 className="text-3xl font-black tracking-tighter">System Persistence</h3>
                </div>
              </div>
              <p className="text-base text-slate-400 font-bold leading-relaxed max-w-md opacity-80">
                Atomic state snapshots are committed every 24 hours. Manual deployment triggers an encrypted ledger export to secure cloud clusters.
              </p>
            </div>

            {isBackingUp ? (
              <div className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    {backupStatus?.message || 'Processing Buffer...'}
                  </span>
                  <span className="text-lg tracking-widest">{backupStatus?.progress || 0}%</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-700 ease-out shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                    style={{ width: `${backupStatus?.progress || 0}%` }} 
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.1em] italic">
                   <Loader2 size={14} className="animate-spin text-blue-400" /> Verifying cryptograph integrity nodes...
                </div>
              </div>
            ) : (
              <button 
                onClick={initiateBackup}
                disabled={!canEdit}
                className={`w-full py-6 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 group ${canEdit ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}
              >
                <RefreshCcw size={20} className={canEdit ? "group-hover:rotate-180 transition-transform duration-700" : ""} />
                Initialize Snapshot Protocol
              </button>
            )}
          </div>
        </div>

        {/* Export Data Section */}
        <div className="space-y-10">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <h3 className="text-2xl font-black text-slate-800 tracking-tight lowercase first-letter:uppercase">Information export nodes</h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <button 
                onClick={() => handleExport('Inventory & Sales')}
                className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1 transition-all group flex flex-col items-center text-center gap-6 active:scale-95"
             >
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <FileSpreadsheet size={36} />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Master Ledger</p>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 italic">Audit Logic • XLSX</p>
                </div>
                <div className="mt-2 px-6 py-3 bg-slate-50 rounded-2xl text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {exporting === 'Inventory & Sales' ? <Loader2 size={16} className="animate-spin" /> : <>Compile Data <Download size={16} /></>}
                </div>
             </button>

             <button 
                onClick={() => handleExport('Customer Registry')}
                className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200 hover:-translate-y-1 transition-all group flex flex-col items-center text-center gap-6 active:scale-95"
             >
                <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <FileText size={36} />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Patient Indices</p>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest opacity-60 italic">Privacy Guarded • PDF</p>
                </div>
                <div className="mt-2 px-6 py-3 bg-slate-50 rounded-2xl text-purple-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:bg-purple-600 group-hover:text-white transition-all">
                  {exporting === 'Customer Registry' ? <Loader2 size={16} className="animate-spin" /> : <>Sync Records <Download size={16} /></>}
                </div>
             </button>
           </div>

           <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors shadow-inner">
                  <History size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deployment Logs</p>
                  <p className="text-sm font-bold text-white tracking-tight mt-0.5">Last persistence sync: 14h 22m ago</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
           </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border-4 border-rose-50 rounded-[4rem] p-4 shadow-sm">
        <div className="bg-rose-50 border border-rose-100 rounded-[3.5rem] p-12 space-y-12">
          <div className="flex flex-col md:flex-row items-center gap-8 px-4">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-200">
              <AlertTriangle size={40} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black text-rose-950 tracking-tighter">Terminal Authorization Required</h3>
              <p className="text-xs text-rose-600 font-black uppercase tracking-widest mt-1 opacity-70 italic">Critical System Termination Procedures</p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center justify-between gap-12 p-10 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-white">
            <div className="space-y-4 max-w-2xl text-center xl:text-left">
              <h4 className="text-2xl font-black text-slate-800 tracking-tight">Erase Entire Business Infrastructure</h4>
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                Executing this command will <span className="text-rose-600 font-black uppercase tracking-widest underline decoration-2 underline-offset-4">permanently purge</span> all pharmacy ledgers, patient histories, inventory nodes, and staff credentials. This operation is binary and non-restorable.
              </p>
            </div>
            {canEdit && (
              <button className="whitespace-nowrap px-14 py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 active:scale-95 shadow-2xl shadow-rose-200 group">
                <Trash2 size={24} className="group-hover:rotate-12 transition-transform" /> Execute Total Purge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataBackup;
