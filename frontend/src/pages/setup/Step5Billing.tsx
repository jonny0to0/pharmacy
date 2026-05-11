import React from 'react';
import { 
  IndianRupee, 
  Hash, 
  CreditCard,
  CheckCircle2,
  TrendingUp,
  Percent,
  Info
} from 'lucide-react';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

interface Props {
  data: any;
  update: (val: any) => void;
}

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'Cash' },
  { id: 'UPI', label: 'UPI' },
  { id: 'Card', label: 'Card' },
  { id: 'Credit', label: 'Credit' },
];

export default function Step5Billing({ data, update }: Props) {
  const togglePayment = (id: string) => {
    const current = data.paymentMethods || [];
    if (current.includes(id)) {
      update({ paymentMethods: current.filter((m: string) => m !== id) });
    } else {
      update({ paymentMethods: [...current, id] });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
        <div className="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Financial Configuration</h3>
          <p className="text-xs text-slate-500 font-medium">Standardize your billing preferences. These settings will apply to all invoices and financial reporting.</p>
        </div>
      </div>

      <FormSection title="Currency & Invoicing" description="Global settings for transaction tracking.">
        <FormField label="Baseline Currency" required>
          <Select 
            value={data.currency}
            onChange={(e) => update({ currency: e.target.value })}
          >
            <option value="INR">Indian Rupee (INR)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </Select>
        </FormField>

        <FormField label="Invoice Prefix" helperText="Unique identifier for your invoice sequence.">
          <Input
            type="text"
            value={data.invoicePrefix}
            onChange={(e) => update({ invoicePrefix: e.target.value.toUpperCase() })}
            placeholder="INV-"
            icon={<Hash className="w-5 h-5" />}
          />
        </FormField>
      </FormSection>

      <div className="space-y-6">
        <label className="block text-sm font-medium text-slate-900">Accepted Payment Channels</label>
        <div className="flex flex-wrap gap-3">
          {PAYMENT_METHODS.map((m) => {
            const isActive = data.paymentMethods?.includes(m.id);
            return (
              <Button
                key={m.id}
                variant={isActive ? 'primary' : 'outline'}
                onClick={() => togglePayment(m.id)}
                className={`transition-all font-semibold text-sm ${!isActive ? 'hover:border-indigo-300 hover:text-indigo-600' : ''}`}
              >
                {m.label}
              </Button>
            );
          })}
        </div>
      </div>

      <FormSection title="Operational Rules" description="Toggle smart features for your workspace.">
        <div 
          onClick={() => update({ creditLimit: !data.creditLimit })}
          className={`
            p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4
            ${data.creditLimit ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200'}
          `}
        >
          <div className={`p-2.5 rounded-xl ${data.creditLimit ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
            <TrendingUp size={20} />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-slate-900">Enable Credit Limit</h4>
            <p className="text-xs text-slate-500 font-medium">Auto-block sales to high-debt customers.</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${data.creditLimit ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
            {data.creditLimit && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>

        <div 
          onClick={() => update({ autoGst: !data.autoGst })}
          className={`
            p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4
            ${data.autoGst ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200'}
          `}
        >
          <div className={`p-2.5 rounded-xl ${data.autoGst ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
            <Percent size={20} />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-slate-900">Auto GST Engine</h4>
            <p className="text-xs text-slate-500 font-medium">Automatic tax calculation based on HSN/SAC.</p>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${data.autoGst ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
            {data.autoGst && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>
      </FormSection>
    </div>
  );
}
