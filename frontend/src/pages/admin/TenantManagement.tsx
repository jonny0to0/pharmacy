import React, { useState } from 'react';
import { 
  Building2, Users, CheckCircle2, AlertCircle, Search, 
  ExternalLink, Ban, RefreshCcw, MoreVertical, 
  ShieldCheck, LayoutDashboard, Database, PlusCircle
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import Badge from '../../components/ui/Badge';
import { useAdminData } from '../../hooks/useAdminData';
import Button from '../../components/ui/Button';

interface Tenant {
  id: string;
  businessName: string;
  businessType: string;
  isSetupCompleted: boolean;
  currentPlan: string;
  planExpiry: string | null;
  createdAt: string;
  subscription: {
    status: string;
    endDate: string;
    planName: string;
  } | null;
  _count: {
    user: number;
    saleinvoice?: number;
    product?: number;
  };
  profile?: {
    ownerName: string;
    phone: string;
    email: string;
  } | null;
}

const TenantManagement: React.FC = () => {
  const { data: tenants, loading, fetchData: fetchTenants } = useAdminData<Tenant[]>('/admin/businesses');
  const [searchTerm, setSearchTerm] = useState('');
  const { isSuperAdmin } = useAuth();

  const getStatusBadge = (tenant: Tenant) => {
    const status = tenant.subscription?.status || 'INACTIVE';
    
    const colors: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      TRIALING: 'bg-blue-50 text-blue-700 border-blue-100',
      PAST_DUE: 'bg-amber-50 text-amber-700 border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
      RESTRICTED: 'bg-orange-50 text-orange-700 border-orange-200',
      SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
      ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-200',
      INACTIVE: 'bg-slate-50 text-slate-400 border-slate-100'
    };

    return (
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[status] || colors.INACTIVE} flex items-center gap-1.5`}>
        <div className={`w-1 h-1 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></div>
        {status.replace('_', ' ')}
      </div>
    );
  };

  const handleGraceRecovery = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Administrative Grace Recovery?',
      text: `Instantly restore ${name} to ACTIVE status (Bypasses billing check).`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Execute Restore',
      confirmButtonColor: '#10b981'
    });

    if (result.isConfirmed) {
      try {
        await api.post(`/admin/godmode/tenant/${id}/restore`, { reason: 'Administrative Grace Override' });
        Swal.fire('Restored!', 'Tenant status has been forcefully recovered.', 'success');
        fetchTenants();
      } catch (error) {
        Swal.fire('Unauthorized', 'Recovery failed. Security clearance required.', 'error');
      }
    }
  };

  const executeHardenenAction = async (tenantId: string, actionName: string, executeFn: (token: string, reason: string) => Promise<void>) => {
    // 1. Password Challenge
    const { value: password } = await Swal.fire({
      title: `Security Challenge: ${actionName.replace('_', ' ')}`,
      input: 'password',
      inputLabel: 'Enter your administrative password',
      inputPlaceholder: 'Confirm identity',
      showCancelButton: true,
      inputValidator: (v) => !v && 'Password is required'
    });

    if (!password) return;

    try {
      // 2. Initiate Action-Bound OTP
      await api.post('/admin/security/challenge/initiate', { 
        password, 
        purpose: actionName, 
        targetId: tenantId 
      });
      
      // 3. OTP Challenge
      const { value: code } = await Swal.fire({
        title: 'Verifying Authorization',
        text: `A security code for "${actionName}" has been sent to your email.`,
        input: 'text',
        inputLabel: 'Enter 6-digit OTP',
        showCancelButton: true,
        inputValidator: (v) => !v && 'OTP is required'
      });

      if (!code) return;

      // 4. Verify Action-Bound OTP
      const { data } = await api.post('/admin/security/challenge/verify', { 
        code, 
        purpose: actionName, 
        targetId: tenantId 
      });
      
      // 5. Execution Reason
      const { value: reason } = await Swal.fire({
        title: 'Mandatory Justification',
        input: 'textarea',
        inputLabel: 'Reason for this critical override',
        inputPlaceholder: 'e.g., Authorized by legal for audit #102',
        inputValidator: (v) => (!v || v.length < 10) && 'Minimum 10 characters required'
      });

      if (reason) {
        await executeFn(data.challengeToken, reason);
      }
    } catch (err: any) {
      Swal.fire('Security Lockout', err.response?.data?.error || 'Verification failed', 'error');
    }
  };

  const handleResetSetup = (id: string, name: string) => {
    executeHardenenAction(id, 'TENANT_RESET', async (token, reason) => {
       await api.post(`/admin/godmode/tenant/${id}/reset`, { reason, challengeToken: token });
       Swal.fire('Complete', 'Business onboarding has been reset.', 'success');
       fetchTenants();
    });
  };

  const handleSuspend = (id: string, name: string) => {
    executeHardenenAction(id, 'TENANT_SUSPEND', async (token, auditReason) => {
       const { value: lockReason } = await Swal.fire({
          title: 'Access Suspension',
          text: `Why is ${name} being suspended? This reason will be visible to the tenant.`,
          input: 'select',
          inputOptions: {
             'NON_PAYMENT': 'Payment Default',
             'TERMS_VIOLATION': 'Acceptable Use Policy Violation',
             'SECURITY_BREACH': 'Compromised Account / Security Risk',
             'MAINTENANCE': 'Scheduled Administrative Maintenance',
             'OTHER': 'Other (Specified in Audit)'
          },
          inputPlaceholder: 'Select primary reason',
          inputValidator: (v) => !v && 'Selection is required'
       });

       if (lockReason) {
          await api.post(`/admin/godmode/tenant/${id}/suspend`, { 
            reason: auditReason, 
            lockReason,
            challengeToken: token 
          });
          Swal.fire('Suspended', 'Tenant access has been restricted.', 'success');
          fetchTenants();
       }
    });
  };

  const handleImpersonate = async (id: string, name: string) => {
    const { value: reason } = await Swal.fire({
      title: `Secure Impersonation: ${name}`,
      input: 'text',
      inputLabel: 'Troubleshooting Justification',
      inputPlaceholder: 'e.g., Investigating inventory sync delay',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      inputValidator: (value) => !value && 'A reason is mandatory for support sessions'
    });

    if (reason) {
      try {
        const { data } = await api.post('/admin/impersonate', { 
           tenantId: id, 
           reason,
           scope: 'LIMITED_SUPPORT' // Evidence of scope restriction
        });
        
        // Handle token swap and redirect
        localStorage.setItem('impersonation_token', data.token);
        window.location.href = '/dashboard';
      } catch (err) {
        Swal.fire('Access Denied', 'Impersonation limit reached or unauthorized.', 'error');
      }
    }
  };

  const safeTenants = Array.isArray(tenants) ? tenants : [];

  const filteredTenants = safeTenants.filter(t => 
    t.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-rose-600 font-black uppercase tracking-widest">Access Denied: Administrative Clearance Required</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-fade-up max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold px-3 py-1 text-[10px] uppercase mb-3">
              Organization Management
           </Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ecosystem Tenants</h1>
          <p className="text-slate-500 font-medium text-sm">Monitor business health, manage subscriptions, and provide platform-level support.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
               <Building2 size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Total Active</p>
              <p className="text-xl font-black text-slate-900">{safeTenants.filter(t => t.subscription?.status === 'ACTIVE').length}</p>
            </div>
          </div>
          <div className="flex-1 md:flex-none bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
               <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Past Due</p>
              <p className="text-xl font-black text-slate-900">{safeTenants.filter(t => t.subscription?.status === 'PAST_DUE').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden elevation-1">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Filter by name, ID, or owner..."
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <Button variant="outline" className="flex-1 md:flex-none border-slate-200 text-slate-600 bg-white" leftIcon={<Database size={16} />}>
                Export Report
             </Button>
             <Button className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white elevation-2" leftIcon={<PlusCircle size={18} />}>
                Onboard Tenant
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-black tracking-[0.1em] border-b border-slate-100">
                <th className="px-8 py-5">Organization & Plan</th>
                <th className="px-8 py-5">LifeCycle Status</th>
                <th className="px-8 py-5">Usage</th>
                <th className="px-8 py-5">Last Billing</th>
                <th className="px-8 py-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Synchronizing Platform Data...</td></tr>
              ) : filteredTenants.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400">Zero matches found in registry.</td></tr>
              ) : filteredTenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-[1rem] bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                        {tenant.businessName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-base leading-none mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{tenant.businessName}</p>
                        <div className="flex items-center gap-2">
                           <Badge variant="neutral" className="bg-slate-100 text-slate-500 font-black text-[9px] px-2 py-0.5">
                              {tenant.currentPlan}
                           </Badge>
                           <span className="text-[10px] text-slate-300 font-bold font-mono">ID: {tenant.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {getStatusBadge(tenant)}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Users size={14} className="text-slate-300" />
                          {tenant._count.user} Users
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <LayoutDashboard size={12} className="text-slate-300" />
                          {tenant._count.saleinvoice || 0} Txns
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-slate-700">
                          {new Date(tenant.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                       </p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registry Date</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleImpersonate(tenant.id, tenant.businessName)}
                        title="Impersonate (Support Mode)"
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg hover:shadow-indigo-100 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                      >
                        <ShieldCheck className="h-5 w-5" />
                      </button>
                      <button 
                         onClick={() => handleResetSetup(tenant.id, tenant.businessName)}
                         title="Reset Onboarding"
                         className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-white hover:shadow-lg hover:shadow-amber-100 rounded-xl transition-all border border-transparent hover:border-amber-100"
                      >
                        <RefreshCcw className="h-5 w-5" />
                      </button>
                      <button 
                         onClick={() => handleSuspend(tenant.id, tenant.businessName)}
                         title="Suspend Access"
                         className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-lg hover:shadow-rose-100 rounded-xl transition-all border border-transparent hover:border-rose-100"
                      >
                        <Ban className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;
