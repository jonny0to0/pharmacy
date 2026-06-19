import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Loader2, Phone, Mail, Calendar, CreditCard, UserCheck, ShieldAlert } from 'lucide-react';
import Modal from './Modal';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePermission } from '../hooks/usePermission';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gst_number?: string;
  address?: string;
  state?: string;
  customerType: 'regular' | 'wholesale';
  creditLimit: number;
  dob?: string | null;
  gender?: string | null;
  membershipType?: string;
  saleinvoice?: Array<{
    id: string;
    grandTotal: number;
    status: string;
    date: string;
  }>;
}

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: any) => void;
  onRegisterNew: () => void;
}

const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onRegisterNew
}) => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings state loaded on mount
  const [walkInBehavior, setWalkInBehavior] = useState('OPTION_A');
  const [allowPharmacistRegister, setAllowPharmacistRegister] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Load settings
  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const res = await api.get('/settings/full-profile');
          if (res.data.settings) {
            setWalkInBehavior(res.data.settings.walkInCustomerBehavior || 'OPTION_A');
            setAllowPharmacistRegister(!!res.data.settings.allowPharmacistCustomerCreation);
          }
        } catch (err) {
          console.error('Failed to load settings in Selection Modal', err);
        } finally {
          setLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  // Load Customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers-selection'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  // Real-time search filter
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = c.name.toLowerCase().includes(term);
    const phoneMatch = c.phone?.includes(term) || false;
    const emailMatch = c.email?.toLowerCase().includes(term) || false;
    const idMatch = c.id.toLowerCase().includes(term);
    return nameMatch || phoneMatch || emailMatch || idMatch;
  });

  // Check role-based permission
  const isPharmacist = Array.isArray(user?.roles) && user.roles.includes('PHARMACIST');
  const canRegister = (!isPharmacist || allowPharmacistRegister) && hasPermission('CUSTOMERS.CREATE');

  // Compute stats helper
  const getCustomerStats = (customer: Customer) => {
    const invoices = customer.saleinvoice || [];
    const totalCount = invoices.length;
    let lastDate = 'N/A';
    if (totalCount > 0) {
      const dates = invoices.map(i => new Date(i.date).getTime());
      const maxTime = Math.max(...dates);
      lastDate = new Date(maxTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return { totalCount, lastDate };
  };

  const handleSelectWalkIn = () => {
    onSelect(null); // Attach predefined/empty walk-in customer
    onClose();
    toast.success('Attached general Walk-in Customer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-5xl"
      title={
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full pr-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Customer Selection</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">
              Attach a customer profile to the active billing transaction
            </p>
          </div>
          <div className="flex gap-2">
            {walkInBehavior === 'OPTION_B' && (
              <button
                type="button"
                onClick={handleSelectWalkIn}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border border-slate-200/50"
              >
                <UserCheck size={16} />
                General Walk-in
              </button>
            )}
            
            <button
              type="button"
              disabled={!canRegister}
              onClick={onRegisterNew}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                canRegister
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
              }`}
              title={!canRegister ? 'Registration disabled for pharmacists' : ''}
            >
              <UserPlus size={16} />
              Register New Customer
            </button>
          </div>
        </div>
      }
    >
      <div className="p-6 md:p-8 space-y-6">
        {/* Permission Alert for Pharmacist */}
        {isPharmacist && !allowPharmacistRegister && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-semibold">
            <ShieldAlert size={18} className="text-amber-600 shrink-0" />
            <p>
              Your administrator has restricted customer registration privileges for your role. You can view and select profiles, but cannot register new ones.
            </p>
          </div>
        )}

        {/* Search Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 transition-colors group-focus-within:text-indigo-600">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search customer by Name, Contact Number, Customer ID, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-sm font-semibold transition-all outline-none text-slate-800 shadow-sm"
          />
        </div>

        {/* Customer List Container */}
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Membership</th>
                  <th className="px-6 py-4 text-center">Last Purchase</th>
                  <th className="px-6 py-4 text-center">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading || loadingSettings ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                      <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Retrieving customer database...</p>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center space-y-4">
                      <div className="text-slate-300 font-semibold text-sm">No customers matched your search parameters.</div>
                      {canRegister && (
                        <button
                          type="button"
                          onClick={onRegisterNew}
                          className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-2"
                        >
                          <UserPlus size={16} /> Add "{searchTerm}" as Customer
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => {
                    const stats = getCustomerStats(customer);
                    const isCorporate = customer.membershipType === 'Corporate';
                    const isPremium = customer.membershipType === 'Premium';

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => {
                          onSelect(customer);
                          onClose();
                          toast.success(`Attached ${customer.name}`);
                        }}
                        className="group hover:bg-indigo-50/20 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-indigo-600"
                      >
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {customer.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate group-hover:text-indigo-950 transition-colors">
                                {customer.name}
                              </p>
                              <span className="text-[9px] font-mono text-slate-400 block mt-0.5 uppercase">
                                ID: {customer.id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col gap-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                              <Phone size={12} className="text-slate-400" />
                              {customer.phone || 'No phone'}
                            </div>
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-slate-400 font-medium truncate max-w-[200px]">
                                <Mail size={12} className="text-slate-300" />
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              isCorporate
                                ? 'bg-purple-100 text-purple-700'
                                : isPremium
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {customer.membershipType || 'Regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <Calendar size={12} className="text-slate-400" />
                            {stats.lastDate}
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200/50 rounded-lg text-xs font-extrabold text-slate-700 tabular-nums">
                            {stats.totalCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerSelectionModal;
