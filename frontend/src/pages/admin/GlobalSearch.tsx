import React, { useState, useEffect } from 'react';
import { Search, Building2, Users, CreditCard, ExternalLink, ArrowRight, Command } from 'lucide-react';
import { useAdminData } from '../../hooks/useAdminData';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';

const AdministrativeSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const { data: rawResults, loading, fetchData } = useAdminData<any>('/admin/search', false);
  
  const results = {
    tenants: Array.isArray(rawResults?.tenants) ? rawResults.tenants : [],
    users: Array.isArray(rawResults?.users) ? rawResults.users : [],
    subscriptions: Array.isArray(rawResults?.subscriptions) ? rawResults.subscriptions : []
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 2) {
        fetchData({ q: query }, true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchData]);

  return (
    <div className="p-8 space-y-8 animate-fade-up max-w-[1200px] mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Global System Search (Tenants, Users, Subscriptions...)"
          className="w-full pl-16 pr-8 py-6 rounded-[2rem] border-2 border-slate-100 bg-white text-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all shadow-xl shadow-slate-200/50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
              <Command size={12} /> Search
           </div>
        </div>
      </div>

      {query.length > 0 && (
         <div className="space-y-12">
            {/* Tenants Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={20} /></div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Tenants & Organizations</h3>
                  <Badge variant="neutral" className="bg-slate-100 text-slate-500 font-black">{results.tenants?.length || 0}</Badge>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(results.tenants || []).map((t: any) => (
                     <Card key={t.id} className="hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-pointer group bg-white border-slate-100">
                        <CardContent className="p-6 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                                 {(t.name || t.businessName || 'T').charAt(0)}
                              </div>
                              <div>
                                 <p className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.name || t.businessName}</p>
                                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID: {t.id.slice(0, 8)}</p>
                              </div>
                           </div>
                           <ArrowRight className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} />
                        </CardContent>
                     </Card>
                  ))}
                  {(!results.tenants || results.tenants.length === 0) && !loading && <p className="px-4 text-sm text-slate-400 font-medium">No organizations match this query.</p>}
               </div>
            </section>

            {/* Users Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Users size={20} /></div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Global User Registry</h3>
                  <Badge variant="neutral" className="bg-slate-100 text-slate-500 font-black">{results.users?.length || 0}</Badge>
               </div>
               <div className="space-y-3">
                  {(results.users || []).map((u: any) => (
                     <div key={u.id} className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                              {(u.name || 'U').charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-800">{u.name}</p>
                              <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 font-black text-[9px] uppercase">
                              Tenant: {u.tenantId?.slice(0, 8) || u.business?.slice(0, 8) || 'N/A'}
                           </Badge>
                           <ExternalLink size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            {/* Subscriptions Section */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <div className="flex items-center gap-3 mb-6 px-4">
                  <div className="p-2 rounded-xl bg-violet-50 text-violet-600"><CreditCard size={20} /></div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Subscriptions & Billing</h3>
                  <Badge variant="neutral" className="bg-slate-100 text-slate-500 font-black">{results.subscriptions?.length || 0}</Badge>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(results.subscriptions || []).map((s: any) => (
                     <div key={s.id} className="p-5 rounded-3xl bg-white border border-slate-100 flex flex-col gap-4 hover:shadow-xl hover:shadow-violet-500/5 transition-all">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Contract ID</p>
                              <p className="font-mono text-sm font-bold text-slate-900">{s.id}</p>
                           </div>
                           <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-black">{s.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                           <Building2 size={14} className="text-slate-300" />
                           <p className="text-sm font-bold text-slate-600">{s.business || s.tenant?.businessName}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </div>
      )}

      {!query && (
         <div className="py-20 text-center space-y-4">
            <div className="inline-flex p-6 rounded-[2.5rem] bg-slate-50 text-slate-300 mb-4 ring-8 ring-slate-50/50">
               <Command size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Administrative Intelligence</h2>
            <p className="text-slate-400 font-medium max-w-md mx-auto">
               Input an organization name, user email, or subscription ID to perform a platform-wide deep scan.
            </p>
         </div>
      )}
    </div>
  );
};

export default AdministrativeSearch;
