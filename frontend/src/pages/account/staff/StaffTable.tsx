import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Mail, Phone, ShieldCheck, MapPin, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';
import type { StaffMember } from './staff.types';

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onDelete: (id: string, name: string) => void;
  hasPermission: (perm: string) => boolean;
}

const ROLE_CONFIG: any = {
  'SUPER_ADMIN': { label: 'Super Admin', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  'BUSINESS_ADMIN': { label: 'Admin', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  'MANAGER': { label: 'Manager', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  'PHARMACIST': { label: 'Pharmacist', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  'CASHIER': { label: 'Cashier', color: 'bg-slate-50 text-slate-600 border-slate-100' }
};

const StaffTable: React.FC<StaffTableProps> = ({ staff, onEdit, onDelete, hasPermission }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const itemsPerPage = 8;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (s.employeeId && s.employeeId.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

  // Handle empty page after delete
  useEffect(() => {
    if (currentPage > 1 && paginatedStaff.length === 0 && filteredStaff.length > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginatedStaff.length, filteredStaff.length, currentPage]);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mt-8">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-blue-500" size={20} />
          Team Directory
        </h3>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by name, ID or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-full md:w-80 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Staff Profile</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Role & Permissions</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Join Date</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedStaff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 uppercase">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{member.name}</h4>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium leading-none">
                          <Mail size={12} className="text-slate-300" /> {member.email}
                        </span>
                        {member.employeeId && (
                          <span className="text-blue-600 text-[10px] font-bold uppercase tracking-tight mt-0.5">
                            ID: {member.employeeId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${ROLE_CONFIG[member.role]?.color || 'bg-slate-50 text-slate-500'}`}>
                    {ROLE_CONFIG[member.role]?.label || member.role}
                  </div>
                  {member.designation && <p className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1"><MapPin size={10} /> {member.designation} • {member.department}</p>}
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-bold text-slate-700">{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'N/A'}</span>
                </td>
                <td className="px-6 py-5">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                    member.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      member.status === 'ACTIVE' ? 'bg-emerald-500' : 
                      member.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                    }`}></span>
                    {member.status || (member.isActive ? 'ACTIVE' : 'DISABLED')}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {member.status === 'PENDING' && (
                      <button 
                        onClick={async () => {
                          setResendingId(member.id);
                          try {
                            const { data } = await api.post(`/users/staff/${member.id}/resend-invite`);
                            if (data && data.emailSent === false && data.inviteLink) {
                              import('sweetalert2').then((Swal) => {
                                Swal.default.fire({
                                  title: 'Email Delivery Failed',
                                  html: `
                                    <p class="text-sm text-slate-500 mb-4">The invitation was regenerated, but the email could not be sent (SMTP config issue).</p>
                                    <p class="text-sm font-bold text-slate-700">Copy this activation link to configure the account:</p>
                                    <textarea readonly class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono mt-2 h-20 outline-none resize-none">${data.inviteLink}</textarea>
                                  `,
                                  icon: 'warning',
                                  confirmButtonText: 'Copy Link',
                                  confirmButtonColor: '#3085d6',
                                  preConfirm: () => {
                                    navigator.clipboard.writeText(data.inviteLink);
                                    toast.success('Link copied to clipboard!');
                                  }
                                });
                              });
                            } else {
                              toast.success(`Invitation resent to ${member.name}`);
                            }
                          } catch (err: any) {
                            toast.error(err.response?.data?.error || 'Failed to resend invitation');
                          } finally {
                            setResendingId(null);
                          }
                        }}
                        disabled={resendingId === member.id}
                        title="Resend Invitation"
                        className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-50"
                      >
                        {resendingId === member.id ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    )}
                    {hasPermission('STAFF.UPDATE') && (
                      <button 
                        onClick={() => onEdit(member)}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    {hasPermission('STAFF.DELETE') && (
                      <button 
                        onClick={() => onDelete(member.id, member.name)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                      <Search size={32} />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold uppercase text-sm tracking-tight">No Results Found</p>
                      <p className="text-slate-500 text-xs mt-1">We couldn't find any staff matching your search.</p>
                    </div>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-bold text-xs uppercase tracking-tight"
                    >
                      Clear Search
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStaff.length)} of {filteredStaff.length} Team Members
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-xs font-black uppercase bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Prev
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-xs font-black uppercase bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffTable;
