import React from 'react';
import { CreditCard, DollarSign, Download, Filter, Search, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';

const BillingCenter: React.FC = () => {
  const transactions = [
    { id: 'TXN_44921', business: 'Apex Biotech', plan: 'Enterprise', amount: '₹12,500', date: '12 Oct 2023', status: 'SUCCESS', method: 'Stripe' },
    { id: 'TXN_44920', business: 'Global Pharma', plan: 'Pro', amount: '₹2,499', date: '11 Oct 2023', status: 'FAILED', method: 'Razorpay' },
    { id: 'TXN_44919', business: 'City Medical', plan: 'Pro', amount: '₹2,499', date: '10 Oct 2023', status: 'SUCCESS', method: 'Stripe' },
    { id: 'TXN_44918', business: 'MediLife', plan: 'Pro', amount: '₹2,499', date: '08 Oct 2023', status: 'SUCCESS', method: 'UPI' },
    { id: 'TXN_44917', business: 'Rural Health', plan: 'Pro', amount: '₹2,499', date: '05 Oct 2023', status: 'PENDING', method: 'Bank Transfer' },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-up max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <Badge variant="neutral" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 text-[10px] uppercase mb-3">
              Financial Ecosystem
           </Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing Central</h1>
          <p className="text-slate-500 font-medium text-sm">Centralized transaction monitoring, revenue reconciliation, and payout management.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
           <Button variant="outline" className="border-slate-200 text-slate-600 bg-white" leftIcon={<Download size={16} />}>
              Download Ledger
           </Button>
           <Button className="bg-emerald-600 hover:bg-emerald-700 text-white elevation-2" leftIcon={<DollarSign size={18} />}>
              Manual Transaction
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-100 elevation-1 bg-white p-6">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                 <DollarSign size={20} />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                 <ArrowUpRight size={14} /> +12.5%
              </div>
           </div>
           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Monthly Recurring Revenue</p>
           <p className="text-2xl font-black text-slate-900">₹4,12,050</p>
        </Card>

        <Card className="border-slate-100 elevation-1 bg-white p-6">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-2xl bg-slate-50 text-slate-600">
                 <Clock size={20} />
              </div>
           </div>
           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Average Payout Cycle</p>
           <p className="text-2xl font-black text-slate-900">2.4 Days</p>
        </Card>

        <Card className="border-slate-100 elevation-1 bg-white p-6">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                 <ArrowDownRight size={20} />
              </div>
              <div className="flex items-center gap-1 text-rose-600 font-black text-xs">
                 <ArrowUpRight size={14} /> +0.2%
              </div>
           </div>
           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Failed Transaction Volume</p>
           <p className="text-2xl font-black text-slate-900">₹14,920</p>
        </Card>

        <Card className="border-slate-100 elevation-1 bg-white p-6">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                 <CreditCard size={20} />
              </div>
           </div>
           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Active Payout Accounts</p>
           <p className="text-2xl font-black text-slate-900">1.2k</p>
        </Card>
      </div>

      <Card className="border-slate-100 elevation-1 bg-white">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-50/10">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search TXN ID, business, or amount..."
              className="w-full pl-12 pr-6 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white font-medium text-sm"
            />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="border-slate-200 py-2.5 h-auto text-slate-500 font-bold text-xs uppercase" leftIcon={<Filter size={14} />}>
                Deep Filtering
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.1em] border-b border-slate-100">
                <th className="px-8 py-4">Transaction ID</th>
                <th className="px-8 py-4">Tenant / Organization</th>
                <th className="px-8 py-4">Billing Logic</th>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Settlement Status</th>
                <th className="px-8 py-4 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-8 py-4 font-mono text-xs text-slate-500 font-bold">{txn.id}</td>
                  <td className="px-8 py-4">
                    <p className="font-extrabold text-slate-800 text-sm">{txn.business}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{txn.date}</p>
                  </td>
                  <td className="px-8 py-4">
                     <Badge variant="neutral" className="bg-indigo-50 text-indigo-700 font-black text-[9px] px-2 py-0.5">
                        {txn.plan}
                     </Badge>
                  </td>
                  <td className="px-8 py-4">
                     <span className="font-black text-slate-900">{txn.amount}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                      txn.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      txn.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                       <div className={`w-1 h-1 rounded-full ${txn.status === 'SUCCESS' ? 'bg-emerald-500' : txn.status === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                       {txn.status}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{txn.method}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BillingCenter;
