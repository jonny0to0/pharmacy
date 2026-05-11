import React from 'react';
import { 
  Landmark, 
  FileText, 
  CreditCard, 
  UtensilsCrossed,
  Info
} from 'lucide-react';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';

interface Props {
  data: any;
  businessType: string;
  update: (val: any) => void;
}

export default function Step3Compliance({ data, businessType, update }: Props) {
  const isPharma = businessType === 'PHARMACY' || businessType === 'HOSPITAL';
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({ [e.target.name]: e.target.value.toUpperCase() });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50 flex items-start gap-4">
        <div className="bg-white p-2.5 rounded-xl text-amber-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Compliance & Taxation</h3>
          <p className="text-xs text-slate-500 font-medium">Please provide your government-issued registration details. This ensures your invoices are legally compliant.</p>
        </div>
      </div>

      <FormSection title="Taxation Details" description="Primary tax identification for GST/VAT compliance.">
        <div className="md:col-span-2">
          <FormField label="GST Identification Number (GSTIN)" required helperText="15-character government format (e.g., 27AAAAA0000A1Z5)">
            <Input
              name="gst"
              value={data.gst || ''}
              onChange={handleChange}
              placeholder="Enter GSTIN"
              className="font-mono tracking-wider"
              icon={<Landmark className="w-5 h-5" />}
            />
          </FormField>
        </div>

        <FormField label="Permanent Account Number (PAN)" required helperText="10-character alphanumeric PAN">
          <Input
            name="pan"
            value={data.pan || ''}
            onChange={handleChange}
            placeholder="ABCDE1234F"
            className="font-mono tracking-wider"
            icon={<CreditCard className="w-5 h-5" />}
          />
        </FormField>
      </FormSection>

      <FormSection title="Industry Licensing" description="Licenses specific to your business category.">
        <div className="md:col-span-2">
          <FormField 
            label="Drug License Number" 
            required={isPharma} 
            helperText={isPharma ? "Mandatory for Pharmacy/Hospital nodes. (Form 20, 21)" : "Optional for other business types"}
          >
            <Input
              name="drugLicense"
              value={data.drugLicense || ''}
              onChange={handleChange}
              placeholder="e.g. DL-20/21-12345"
              icon={<FileText className="w-5 h-5" />}
            />
          </FormField>
        </div>

        <FormField label="FSSAI License Number" helperText="14-digit food safety registration">
          <Input
            name="fssai"
            value={data.fssai || ''}
            onChange={handleChange}
            placeholder="e.g. 10012000000123"
            icon={<UtensilsCrossed className="w-5 h-5" />}
          />
        </FormField>
      </FormSection>
    </div>
  );
}
