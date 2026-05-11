import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  ChevronRight, Filter, Search, Printer, TrendingUp, Clock, 
  ArrowDownRight, FileText, Download, Package, Percent, FileSpreadsheet 
} from 'lucide-react';
import { useFormDraft } from '../hooks/useFormDraft';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

type ReportType = 'SALES' | 'PURCHASE' | 'CLOSING' | 'STOCK' | 'PL' | 'GST';

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('SALES');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First of current month
    end: new Date().toISOString().split('T')[0]
  });

  // Draft Preservation Hook
  const { saveDraft } = useFormDraft(
    'reports_filters',
    { reportType, dateRange },
    {
      autoRestore: true,
      onRestore: (data) => {
        setReportType(data.reportType);
        setDateRange(data.dateRange);
        toast.success('Filters restored');
      }
    }
  );

  // Auto-save draft when data changes
  React.useEffect(() => {
    saveDraft({ reportType, dateRange });
  }, [reportType, dateRange, saveDraft]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', reportType, dateRange],
    queryFn: async () => {
      const endpoint = {
        SALES: '/reports/sales-summary',
        PURCHASE: '/reports/purchase-summary',
        CLOSING: '/reports/daily-closing',
        STOCK: '/reports/inventory-status',
        PL: '/reports/profit-loss',
        GST: '/reports/gst-summary'
      }[reportType];
      
      const res = await api.get(endpoint, {
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      return res.data.data;
    }
  });

  const renderReportContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Processing Business Analytics...</p>
      </div>
    );

    switch (reportType) {
      case 'SALES':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Gross Revenue</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{reportData?.summary?.grandTotal?.toLocaleString() || 0}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 mt-1">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-bold">Total Sales Value</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Transaction Count</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">{reportData?.summary?.id || 0}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Invoices Generated</p>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Tax Collected</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-2">₹{reportData?.summary?.totalTax?.toLocaleString() || 0}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Combined GST</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
               <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Invoice No</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {reportData?.sales?.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700 text-sm">#{sale.invoiceNumber}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{new Date(sale.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-slate-700 font-medium text-sm">{sale.customer?.name || 'Walk-in Customer'}</td>
                          <td className="px-6 py-4 font-bold text-slate-900 text-sm">₹{sale.grandTotal.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <Badge variant={sale.status === 'PAID' ? 'success' : 'warning'}>{sale.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        );
      
      case 'CLOSING':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="max-w-xl mx-auto text-center py-12 px-6 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                   <Clock className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                   <h2 className="text-white text-3xl font-bold tracking-tight">Daily Cash Closing</h2>
                   <p className="text-slate-400 text-sm mt-2 font-medium">Reporting for {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
                   
                   <div className="mt-10 grid grid-cols-2 gap-4">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                         <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Net Collection</p>
                         <h4 className="text-2xl font-bold text-white mt-2">₹{reportData?.totalSales?.toLocaleString()}</h4>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                         <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Transactions</p>
                         <h4 className="text-2xl font-bold text-white mt-2">{reportData?.transactionCount}</h4>
                      </div>
                   </div>

                   <div className="mt-8 space-y-4">
                      {reportData?.paymentBreakdown?.map((p: any) => (
                        <div key={p.mode} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-slate-300 font-bold text-sm tracking-wide">{p.mode}</span>
                           <span className="text-white font-bold tabular-nums">₹{p.amount.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl -ml-16 -mb-16"></div>
             </div>
          </div>
        );

      case 'PL':
        return (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
                      <TrendingUp size={32} />
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales (A)</p>
                   <h2 className="text-4xl font-bold text-slate-900 mt-2">₹{reportData?.sales?.toLocaleString()}</h2>
                </div>
                <div className="p-10 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6">
                      <ArrowDownRight size={32} />
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Purchases (B)</p>
                   <h2 className="text-4xl font-bold text-slate-900 mt-2">₹{reportData?.purchases?.toLocaleString()}</h2>
                </div>
             </div>

             <div className={`p-12 rounded-[3rem] text-center border-4 ${reportData?.grossProfit >= 0 ? 'bg-emerald-900 border-emerald-800' : 'bg-rose-900 border-rose-800'} shadow-2xl`}>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Estimated Gross Profit (A - B)</p>
                <h1 className="text-6xl font-bold text-white mt-4 tracking-tighter">₹{reportData?.grossProfit?.toLocaleString()}</h1>
                <p className="text-white/60 text-sm mt-4 font-medium italic">Based on recorded PROCUREMENT vs REVENUE metrics.</p>
             </div>
          </div>
        );

      case 'STOCK':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg">
                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Total Valuation</p>
                   <h3 className="text-2xl font-bold mt-1">₹{reportData?.summary?.totalValuation?.toLocaleString()}</h3>
                </div>
                <div className="p-6 bg-rose-600 rounded-3xl text-white shadow-lg">
                   <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Low Stock Items</p>
                   <h3 className="text-2xl font-bold mt-1">{reportData?.summary?.lowStockCount} SKUs</h3>
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[500px]">
                     <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Product Name</th>
                          <th className="px-6 py-4">SKU</th>
                          <th className="px-6 py-4">Current Stock</th>
                          <th className="px-6 py-4">Asset Value</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {reportData?.products?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                             <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.name}</td>
                             <td className="px-6 py-4 text-slate-400 font-mono text-xs">{p.sku}</td>
                             <td className="px-6 py-4">
                                <span className={`font-bold tabular-nums ${p.currentStock <= p.minStockLevel ? 'text-rose-600' : 'text-slate-900'}`}>
                                   {p.currentStock}
                                </span>
                             </td>
                             <td className="px-6 py-4 font-bold text-slate-900">₹{(p.currentStock * p.purchasePrice).toLocaleString()}</td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
             </div>
          </div>
        );

      default:
        return (
          <div className="py-24 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <FileText size={40} />
             </div>
             <h3 className="text-slate-800 font-bold text-xl">Operational Report Needed</h3>
             <p className="text-slate-400 text-sm mt-2">Select a report module from the top navigation to begin.</p>
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Business Reports Hub</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Advanced financial and operational analytics for decision support.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Printer size={18} />} onClick={() => window.print()}>Print View</Button>
          <Button leftIcon={<Download size={18} />}>Export Report</Button>
        </div>
      </div>

      {/* Date Filters & Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 items-end">
         <div className="lg:col-span-2 flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar whitespace-nowrap">
            {[
              { id: 'SALES', label: 'Sales', icon: <TrendingUp size={14} /> },
              { id: 'CLOSING', label: 'Closing', icon: <Clock size={14} /> },
              { id: 'STOCK', label: 'Inventory', icon: <Package size={14} /> },
              { id: 'PL', label: 'P&L', icon: <Percent size={14} /> },
              { id: 'GST', label: 'Taxation', icon: <FileSpreadsheet size={14} /> }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setReportType(r.id as ReportType)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${reportType === r.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {r.icon}
                {r.label}
              </button>
            ))}
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">From Date</label>
               <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="h-11 shadow-sm w-full" />
            </div>
            <div className="w-full sm:flex-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">To Date</label>
               <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="h-11 shadow-sm w-full" />
            </div>
         </div>

         <Button variant="secondary" className="h-11 w-full mt-2 lg:mt-0" leftIcon={<Filter size={18} />}>Apply Filters</Button>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;
