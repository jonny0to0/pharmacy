import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { Plus, Search, Users, AlertCircle, MapPin, Building2, Phone, Edit3, Trash2, ArrowUpRight, Wallet, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import CustomerModal, { type CustomerInput } from '../components/CustomerModal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import alerts from '../utils/alerts';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gst_number: string | null;
  address: string | null;
  state: string | null;
  customerType: 'regular' | 'wholesale';
  creditLimit: number;
  outstandingBalance: number;
  invoices?: Array<{ grandTotal: number }>;
}

const Customers = () => {
  const { user } = useAuth();
  const businessType = user?.businessType || 'PHARMACY';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerInput | null>(null);

  const navigate = (path: string) => window.location.href = path; // Simple navigation for now
  
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (customer: CustomerInput) => {
      if (customer.id) {
        await api.put(`/customers/${customer.id}`, customer);
      } else {
        await api.post('/customers', customer);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      alerts.success(editingCustomer ? 'Customer Updated' : 'Customer Added', `Customer profile has been successfully ${editingCustomer ? 'updated' : 'created'}.`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      alerts.success('Customer Deleted', 'The customer profile has been permanently removed.');
    }
  });

  const handleSave = async (customer: CustomerInput) => {
    await saveMutation.mutateAsync(customer);
  };

  const handleDelete = async (id: string) => {
    const result = await alerts.confirm('Delete Customer', 'Executing hard-delete: This will permanently remove the customer profile. Continue?', 'Delete');
    if (result.isConfirmed) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      gst_number: customer.gst_number || '',
      address: customer.address || '',
      state: customer.state || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit,
    });
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const pageTitle = businessType === 'WHOLESALER' ? 'Sub-Distributor Network' : 'Customer Central';
  const registerLabel = businessType === 'WHOLESALER' ? 'Register Sub-Distributor' : 'Register Customer';

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage {pageTitle.toLowerCase()} and tracks outstanding receivables.</p>
        </div>
        <Button
          onClick={openAddModal}
          leftIcon={<Plus size={18} />}
        >
          {registerLabel}
        </Button>
      </div>

      {/* Analytics Brief */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Active Profiles</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-slate-900">{customers.length}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-indigo-50 text-indigo-600">Verified</span>
            </div>
            <Users className="absolute bottom-4 right-4 text-indigo-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-all border-0">
          <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
            <p className="text-xs font-semibold text-slate-500">Total Receivables</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-bold text-rose-600">₹{totalOutstanding.toLocaleString()}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-600">Pending</span>
            </div>
            <Wallet className="absolute bottom-4 right-4 text-rose-50 opacity-10 group-hover:scale-110 transition-transform duration-500" size={80} />
          </CardContent>
        </Card>

        <Card className="hidden lg:block relative overflow-hidden group border-0 bg-transparent">
           <CardContent className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl h-full">
             <div className="relative z-10 flex flex-col h-full justify-between">
                <p className="text-xs font-semibold text-slate-400">Persistence Matrix</p>
                <div className="mt-2">
                   <p className="text-white text-lg font-bold tracking-tight leading-tight">Secure Customer <br/>Data Lifecycle</p>
                </div>
             </div>
             <ShieldCheck className="absolute -bottom-2 -right-2 w-24 h-24 text-slate-800 opacity-20" />
           </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search by Name, Phone, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="text-slate-400" />}
              className="py-2.5 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredCustomers.length} Entities Found</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Customer Segment</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-center">Location</th>
                <th className="px-6 py-4 text-right">Exposure</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-slate-400 font-medium text-sm">Querying distributed records...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-800">Protocol Failure</p>
                    <p className="text-xs font-semibold text-rose-500 mt-1">Failed to resolve customer nodes</p>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No customers found</h3>
                    <p className="text-sm text-slate-400 mt-1">No profiles matching specified parameters.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${customer.customerType === 'wholesale' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                          <Users size={24} />
                        </div>
                        <div>
                          <p onClick={() => openEditModal(customer)} className="text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors flex items-center gap-2">
                            {customer.name}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${customer.customerType === 'wholesale' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                                {customer.customerType}
                            </span>
                          </p>
                          {customer.gst_number && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight flex items-center gap-1.5">
                                <Building2 size={12} className="text-indigo-500" /> GST: <span className="text-slate-900 font-mono">{customer.gst_number}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Phone size={14} className="text-indigo-500" /> {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="text-[10px] font-medium text-slate-400 flex items-center gap-2">
                            <Mail size={12} /> {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <MapPin size={12} className="text-slate-300" /> {customer.state || 'Local'}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 truncate max-w-[150px]">{customer.address || 'Unspecified Domain'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`text-lg font-bold tabular-nums ${customer.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          ₹{customer.outstandingBalance.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                             Total Sales: ₹{(customer.invoices?.reduce((sum, inv) => sum + inv.grandTotal, 0) || 0).toLocaleString()}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2 transition-opacity">
                         <Button 
                            variant="outline"
                            size="icon"
                            onClick={() => openEditModal(customer)}
                            title="Edit Customer"
                         >
                           <Edit3 size={16} />
                         </Button>
                         <Button 
                            variant="primary"
                            size="icon"
                            className="bg-slate-900 hover:bg-slate-800 border-transparent shadow-md"
                            title="View Transactions"
                            onClick={() => alert(`Showing ledger for ${customer.name}. Total Transactions: ${customer.invoices?.length || 0}`)}
                         >
                           <ArrowUpRight size={16} />
                         </Button>
                        <Button 
                           variant="danger"
                           size="icon"
                           onClick={() => handleDelete(customer.id)}
                           title="Delete Profile"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingCustomer={editingCustomer}
      />
    </div>
  );
};

export default Customers;
