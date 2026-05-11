import React from 'react';
import { Card } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Bell, Clock, Users, BookOpen, Info, XCircle, Activity, ArrowUpRight, SortAsc, SortDesc } from 'lucide-react';
import api from '../../../api/axios';
import Swal from 'sweetalert2';

interface IncidentProps {
  incidents: any[];
  efficiency: any;
  onRefresh: () => void;
}

const IncidentPanel: React.FC<IncidentProps> = ({ incidents, efficiency, onRefresh }) => {
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const sortedIncidents = React.useMemo(() => {
    const severityMap: any = { 'CRITICAL': 3, 'WARNING': 2, 'INFO': 1 };
    return [...incidents].sort((a, b) => {
      const sevA = severityMap[a.severity] || 0;
      const sevB = severityMap[b.severity] || 0;
      if (sevA !== sevB) {
        return sortOrder === 'desc' ? sevB - sevA : sevA - sevB;
      }
      return sortOrder === 'desc' 
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [incidents, sortOrder]);
  const handleAssign = async (id: string) => {
    try {
       await api.post(`/system/incidents/${id}/assign`);
       onRefresh();
    } catch (err) {
       Swal.fire('Error', 'Assignment failed', 'error');
    }
  };

  const handleResolve = async (id: string) => {
     await api.post(`/system/incidents/${id}/resolve`);
     onRefresh();
  };

  return (
    <Card className="bg-white border-slate-100 overflow-hidden elevation-1">
       {/* Header with Efficiency Analytics */}
       <div className="p-4 md:p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-slate-50/30">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full lg:w-auto">
              <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                     <Bell size={20} className="text-rose-500" />
                     Operational Incident Hub
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">Real-time Anomaly Detection & Response Management</p>
              </div>
              <Button 
                variant="outline" 
                className="h-8 px-3 border-slate-100 text-[10px] font-black uppercase text-slate-500"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                leftIcon={sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />}
              >
                Sort: {sortOrder === 'desc' ? 'Critical' : 'Recent'}
              </Button>
           </div>
          <div className="flex gap-8">
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Response (MTTA)</p>
                <div className="flex items-center gap-2">
                   <p className="text-xl font-black text-slate-900">{efficiency.avgMtta}</p>
                   <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5"><ArrowUpRight size={10} /> {efficiency.targetMtta}</span>
                </div>
             </div>
             <div className="text-center border-l border-slate-100 pl-4 md:pl-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Resolution (MTTR)</p>
                <div className="flex items-center gap-2">
                   <p className="text-xl font-black text-slate-900">{efficiency.avgMttr}</p>
                   <span className="text-[10px] font-black text-indigo-500 flex items-center gap-0.5"><Activity size={10} /> {efficiency.targetMttr}</span>
                </div>
             </div>
          </div>
       </div>

       {/* Incident Feed */}
       <div className="p-4 md:p-6 space-y-4 max-h-[600px] overflow-auto custom-scrollbar">
          {incidents.length === 0 ? (
             <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                   <Activity className="text-emerald-500" size={32} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform Operational Maturity Verified • Zero Incidents</p>
             </div>
          ) : sortedIncidents.map(incident => (
            <div key={incident.id} className={`p-5 rounded-3xl border transition-all ${
              incident.severity === 'CRITICAL' ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50/50 border-slate-100'
            } flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group`}>
               <div className="flex gap-4 items-start">
                  <div className={`mt-1 h-3 w-3 rounded-full animate-pulse ${
                    incident.severity === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <div>
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                        <Badge variant={incident.severity === 'CRITICAL' ? 'error' : 'warning'} className="text-[9px] font-black uppercase px-2 py-0.5">
                           {incident.severity}
                        </Badge>
                        <Badge variant="neutral" className="bg-white/80 text-slate-600 border-slate-200 text-[9px] font-black px-2 py-0.5">
                           {incident.status}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 ml-2">{new Date(incident.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-black text-slate-800 leading-tight">{incident.message}</p>
                    <div className="flex gap-4 mt-2">
                       <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Users size={12} /> Assigned: <span className="text-slate-600">{incident.assignedTo || 'Unassigned'}</span>
                       </p>
                       {incident.runbookUrl && (
                          <a href={incident.runbookUrl} target="_blank" className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                             <BookOpen size={12} /> SOP Ready
                          </a>
                       )}
                    </div>
                  </div>
               </div>
               
               <div className="flex gap-2 w-full md:w-auto transition-opacity">
                  {!incident.assignedTo && (
                    <Button 
                      className="flex-1 md:flex-none h-8 px-4 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase rounded-xl hover:bg-slate-50"
                      onClick={() => handleAssign(incident.id)}
                    >
                      Claim
                    </Button>
                  )}
                  <Button 
                    className="flex-1 md:flex-none h-8 px-4 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg"
                    onClick={() => handleResolve(incident.id)}
                  >
                    Resolve
                  </Button>
               </div>
            </div>
          ))}
       </div>
    </Card>
  );
};

export default IncidentPanel;
