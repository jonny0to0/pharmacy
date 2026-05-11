import React from 'react';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  Receipt, 
  Edit3,
  Rocket,
  Loader2,
  CheckCircle2,
  Users
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

interface Props {
  formData: any;
  setStep: (step: number) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export default function Review({ formData, setStep, onSubmit, isSubmitting }: Props) {

  const Section = ({ title, icon: Icon, stepId, children }: any) => (
    <Card className="hover:shadow-md transition-all group border-0">
      <CardContent className="p-6 border border-slate-100 rounded-2xl h-full">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Step {stepId} Summary</p>
            </div>
          </div>
          <Button 
            variant="outline"
            size="icon"
            className="border-transparent shadow-none"
            onClick={() => setStep(stepId)}
            title="Edit Section"
          >
            <Edit3 size={16} />
          </Button>
        </div>
        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  const DataItem = ({ label, value }: any) => (
    <div className="flex justify-between items-center gap-4 py-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-900 text-right truncate">{value || '---'}</span>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuration Review</h2>
        <p className="text-sm text-slate-500 font-medium">Verify your enterprise parameters before workspace graduation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Section title="Business Identity" icon={Building2} stepId={2}>
          <DataItem label="Legal Name" value={formData.businessInfo.name} />
          <DataItem label="Principal" value={formData.businessInfo.owner} />
          <DataItem label="Contact Email" value={formData.businessInfo.email} />
          <DataItem label="Mobile" value={formData.businessInfo.mobile} />
        </Section>

        <Section title="Compliance Profile" icon={ShieldCheck} stepId={3}>
          <DataItem label="GSTIN" value={formData.compliance.gst} />
          <DataItem label="PAN" value={formData.compliance.pan} />
          <DataItem label="Drug License" value={formData.compliance.drugLicense} />
          <DataItem label="Industry" value={formData.businessType} />
        </Section>

        <Section title="Operational Node" icon={MapPin} stepId={4}>
          <DataItem label="Address Line 1" value={formData.address.line1} />
          <DataItem label="City" value={formData.address.city} />
          <DataItem label="State" value={formData.address.state} />
          <DataItem label="Pincode" value={formData.address.pincode} />
        </Section>

        <Section title="Financial & Team" icon={Receipt} stepId={5}>
          <DataItem label="Base Currency" value={formData.billing.currency} />
          <DataItem label="Payment Gateways" value={formData.billing.paymentMethods?.join(', ')} />
          <DataItem label="Admin Link" value={formData.users.adminUsername} />
          <DataItem label="Staff Enrolled" value={`${formData.users.staff?.length || 0} Members`} />
        </Section>
      </div>

      <div className="max-w-md mx-auto pt-4">
        <Button
          size="lg"
          fullWidth
          onClick={onSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          leftIcon={!isSubmitting ? <Rocket size={18} /> : undefined}
          className="text-sm shadow-lg shadow-indigo-200"
        >
          {isSubmitting ? 'Deploying Workspace...' : 'Launch Enterprise'}
        </Button>
        <p className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-8 leading-relaxed">
          By launching, you finalize the multi-tenant shard allocation for your organization.
        </p>
      </div>
    </div>
  );
}
