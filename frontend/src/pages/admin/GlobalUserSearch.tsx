import React, { useState } from 'react';
import { 
  Search, Users, Mail, Phone, Shield, 
  Building2, ExternalLink, UserCheck, UserX,
  History, Fingerprint
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: string;
  isActive: boolean;
  tenantId: string | null;
  tenant?: {
    businessName: string;
  } | null;
  userrole: { role: { name: string } }[];
  createdAt: string;
}

import { useAdminData } from '../../hooks/useAdminData';

const GlobalUserSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const { data: results = [], loading, fetchData, mutate, setData } = useAdminData<GlobalUser[]>('/admin/users/search', false);
  const { isSuperAdmin } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchData({ q: query }, true);
  };

  const toggleUserStatus = async (user: GlobalUser) => {
    const action = user.isActive ? 'Deactivate' : 'Activate';
    const result = await Swal.fire({
      title: `${action} User?`,
      text: `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`
    });

    if (result.isConfirmed) {
      const response = await mutate('patch', `/${user.id}/status`, {
        isActive: !user.isActive,
        status: !user.isActive ? 'ACTIVE' : 'DISABLED'
      });
      
      if (response.success) {
        Swal.fire('Updated!', 'User status has been updated.', 'success');
        // Refresh results locally
        setData(prev => Array.isArray(prev) ? prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive, status: !u.isActive ? 'ACTIVE' : 'DISABLED' } : u) : []);
      }
    }
  };

  if (!isSuperAdmin) {
    return <div className="p-8 text-center text-red-600 font-bold text-xl uppercase tracking-widest bg-white rounded-3xl shadow-xl mt-12 max-w-2xl mx-auto">
      <Fingerprint className="mx-auto h-16 w-16 mb-4 opacity-20" />
      Access Denied: Restricted to Overlord Admins
    </div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black text-gray-900 mb-2">Platform Identity Hub</h1>
          <p className="text-gray-500 font-medium">Search across all tenants and manage staff access profiles globally.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative group max-w-2xl mx-auto md:mx-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <Search className="absolute left-6 text-gray-400 h-6 w-6" />
                <input 
                  type="text" 
                  placeholder="Enter Name, Email, or Mobile number..."
                  className="w-full pl-16 pr-32 py-5 text-lg font-semibold focus:outline-none placeholder-gray-300"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="absolute right-3 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-6">
          {results.length > 0 ? (
            results.map((user) => (
              <div key={user.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col md:flex-row items-center gap-6 group">
                <div className="relative">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-3xl font-black text-blue-600 shadow-inner">
                    {user.name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white ${user.isActive ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'}`}></div>
                </div>
                
                <div className="flex-1 text-center md:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{user.name}</h3>
                    {user.userrole.map(r => (
                        <span key={r.role.name} className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100">
                         {r.role.name}
                        </span>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-6 text-sm text-gray-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" /> {user.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" /> {user.mobile}
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Building2 className="h-4 w-4 text-indigo-400" /> {user.tenant?.businessName || 'Platform Level'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-8">
                  <button 
                    onClick={() => toggleUserStatus(user)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                        user.isActive 
                        ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                    }`}
                  >
                    {user.isActive ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                    <span>{user.isActive ? 'Force Disable' : 'Restore'}</span>
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                    <History className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          ) : !loading && query && (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                <Users className="mx-auto h-16 w-16 text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Zero Identities Found</h3>
                <p className="text-gray-400">No users matched your criteria across the platform nodes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalUserSearch;
