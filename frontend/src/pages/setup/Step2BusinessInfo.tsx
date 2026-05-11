import React from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Tag,
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

export default function Step2BusinessInfo({ data, businessType, update }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update({ [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
        <div className="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Business Identity</h3>
          <p className="text-xs text-slate-500 font-medium">Please provide accurate legal details for your {businessType?.toLowerCase() || 'enterprise'}. This information will be used for official documents.</p>
        </div>
      </div>

      <FormSection title="Core Information" description="Legal name and primary contact details.">
        <div className="md:col-span-2">
          <FormField label="Legal Business Name" required helperText="Must match your official registration documents.">
            <Input
              name="name"
              value={data.name || ''}
              onChange={handleChange}
              placeholder="e.g. Medisynex Pharma Private Limited"
              icon={<Building2 className="w-5 h-5" />}
            />
          </FormField>
        </div>

        <FormField label="Owner / Principal Name" required>
          <Input
            name="owner"
            value={data.owner || ''}
            onChange={handleChange}
            placeholder="Full Name as per ID"
            icon={<User className="w-5 h-5" />}
          />
        </FormField>

        <FormField label="Business Category" helperText="Optional classification">
          <Input
            name="category"
            value={data.category || ''}
            onChange={handleChange}
            placeholder="e.g. Retail Pharmacy"
            icon={<Tag className="w-5 h-5" />}
          />
        </FormField>
      </FormSection>

      <FormSection title="Contact Details" description="How should we reach out to you?">
        <FormField label="Mobile Number" required helperText="OTP verification may be required later.">
          <Input
            type="tel"
            name="mobile"
            value={data.mobile || ''}
            onChange={handleChange}
            placeholder="98765 43210"
            icon={<span className="font-bold text-xs text-slate-400">IN (+91)</span>}
          />
        </FormField>

        <FormField label="Email Address" required>
          <Input
            type="email"
            name="email"
            value={data.email || ''}
            onChange={handleChange}
            placeholder="contact@business.com"
            icon={<Mail className="w-5 h-5" />}
          />
        </FormField>
      </FormSection>
    </div>
  );
}
