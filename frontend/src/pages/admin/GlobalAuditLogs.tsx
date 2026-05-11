import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Calendar, Terminal, Info, AlertTriangle, Bug } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AdminErrorBox from '../../components/admin/AdminErrorBox';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import { useAdminData } from '../../hooks/useAdminData';

interface AuditLog {
  id: string;
  action: string;
  module: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: string;
  ipAddress?: string;
  user?: {
    name: string;
    email: string;
    tenantId?: string;
  };
  metadata?: any;
}

const GlobalAuditLogs: React.FC = () => {
  const [filter, setFilter] = useState({ severity: '', module: '', searchTerm: '' });
  const { data: logs, loading, error, fetchData } = useAdminData<AuditLog[]>('/audit-logs');

  useEffect(() => {
    fetchData(filter);
  }, [filter, fetchData]);

  const getSeverityBadge = (severity: string) => {
    const configs: Record<string, any> = {
      INFO: { color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Info size={12} /> },
      WARNING: { color: 'bg-amber-50 text-amber-700 border-amber-100', icon: <AlertTriangle size={12} /> },
      CRITICAL: { color: 'bg-rose-50 text-rose-700 border-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.1)]', icon: <Bug size={12} /> },
    };
    const config = configs[severity] || configs.INFO;
    return (
      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color} flex items-center gap-1.5`}>
        {config.icon}
        {severity}
      </div>
    );
  };

  return (
    <AdminPageLayout
      title="Global Audit Registry"
      subtitle="Real-time immutable log of all administrative and tenant-level mutations"
      tag="Security Forensics"
      icon={<Shield className="text-indigo-600" size={24} />}
      actions={
        <Button variant="outline" className="bg-white border-slate-200 text-slate-600 font-bold" leftIcon={<Terminal size={16} />}>
           Live Stream
        </Button>
      }
    >
      {error && <AdminErrorBox message={error} onRetry={() => fetchData(filter)} />}

      {!error && (
        <Card className="border-slate-100 elevation-1 bg-white">
          <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/20">
            <div className="flex gap-4 w-full md:w-auto">
               <div className="relative w-full md:w-[300px]">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input 
                    type="text" 
                    placeholder="Scan logs..."
                    className="w-full pl-12 pr-6 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                    onChange={(e) => setFilter({...filter, searchTerm: e.target.value})}
                  />
               </div>
               <select 
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-widest bg-white outline-none focus:border-indigo-500 transition-colors"
                  onChange={(e) => setFilter({...filter, severity: e.target.value})}
               >
                  <option value="">All Severities</option>
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
               </select>
            </div>
            <div className="flex gap-3">
               <Button variant="outline" className="border-slate-100 text-slate-400" iconOnly={<Calendar size={18} />} />
               <Button variant="outline" className="border-slate-100 text-slate-400" iconOnly={<Filter size={18} />} />
            </div>
          </div>

          <div className="overflow-x-auto font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-4">Timestamp</th>
                  <th className="px-8 py-4">Actor & Context</th>
                  <th className="px-8 py-4">Event Logic</th>
                  <th className="px-8 py-4">Severity</th>
                  <th className="px-8 py-4 text-right">Node/IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Querying Immutable Ledger...</td></tr>
                ) : (logs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-4 text-slate-500 font-bold">
                      {new Date(log.createdAt).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-8 py-4">
                      <p className="font-black text-slate-900 uppercase tracking-tight">{log.user?.name || 'SYSTEM'}</p>
                      <p className="text-[9px] text-slate-400 font-bold">TENANT: {log.user?.tenantId?.slice(0,8) || 'GLOBAL'}</p>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                         <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-black text-[9px] uppercase">{log.module}</span>
                         <span className="font-bold text-slate-700">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{log.ipAddress || '0.0.0.0'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminPageLayout>
  );
};

export default GlobalAuditLogs;

