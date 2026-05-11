import React from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

interface StaffStatsProps {
  stats: {
    total: number;
    active: number;
    onLeave: number;
    lateToday: number;
  };
}

const StaffStats: React.FC<StaffStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        label="Total Employees" 
        value={stats.total} 
        icon={<Users size={24} />} 
        color="bg-blue-500" 
      />
      <StatCard 
        label="Active Now" 
        value={stats.active} 
        icon={<UserCheck size={24} />} 
        color="bg-emerald-500" 
      />
      <StatCard 
        label="On Leave" 
        value={stats.onLeave} 
        icon={<UserX size={24} />} 
        color="bg-amber-500" 
      />
      <StatCard 
        label="Late Today" 
        value={stats.lateToday} 
        icon={<Clock size={24} />} 
        color="bg-rose-500" 
      />
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`${color} p-4 rounded-2xl text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-black text-slate-800 mt-1 uppercase tracking-tight">{value}</h3>
      </div>
    </div>
  </div>
);

export default StaffStats;
