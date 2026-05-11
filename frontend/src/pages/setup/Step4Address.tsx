import React, { useState } from 'react';
import { 
  MapPin, 
  Search,
  Loader2,
  Check,
  Globe,
  Info
} from 'lucide-react';
import axios from 'axios';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';

interface Props {
  data: any;
  update: (val: any) => void;
}

export default function Step4Address({ data, update }: Props) {
  const [loading, setLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    update({ [name]: value });

    if (name === 'pincode' && value.length === 6) {
      handlePincodeLookup(value);
    }
  };

  const handlePincodeLookup = async (pin: string) => {
    setLoading(true);
    setPincodeSuccess(false);
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
      const result = response.data[0];

      if (result.Status === 'Success') {
        const postOffice = result.PostOffice[0];
        update({
          city: postOffice.District,
          state: postOffice.State,
        });
        setPincodeSuccess(true);
      }
    } catch (error) {
      console.error("Pincode lookup failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
        <div className="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Physical Location</h3>
          <p className="text-xs text-slate-500 font-medium">Define your primary operational hub. This address will be used for shipping calculation and tax localization.</p>
        </div>
      </div>

      <FormSection title="Infrastructure Address" description="Physical coordinates of your facility.">
        <div className="md:col-span-2">
          <FormField label="Address Line 1" required helperText="Building, Street, Industrial Area">
            <Input
              name="line1"
              value={data.line1 || ''}
              onChange={handleChange}
              placeholder="e.g. 123, Dynamic Industrial Park"
              icon={<MapPin className="w-5 h-5" />}
            />
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label="Address Line 2" helperText="Landmark, Floor, Wing">
            <Input
              name="line2"
              value={data.line2 || ''}
              onChange={handleChange}
              placeholder="e.g. Near Central Metro"
            />
          </FormField>
        </div>

        <FormField label="City / District" required>
          <Input
            name="city"
            value={data.city || ''}
            onChange={handleChange}
            placeholder="e.g. Mumbai"
          />
        </FormField>

        <FormField label="State / Province" required>
          <Input
            name="state"
            value={data.state || ''}
            onChange={handleChange}
            placeholder="e.g. Maharashtra"
          />
        </FormField>

        <FormField 
          label="Pincode / Postal Code" 
          required 
          helperText={pincodeSuccess ? "Location identified successfully" : "6-digit code for auto-lookup"}
        >
          <Input
            name="pincode"
            value={data.pincode || ''}
            onChange={handleChange}
            maxLength={6}
            placeholder="400001"
            icon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : pincodeSuccess ? <Check className="w-5 h-5 text-emerald-500" /> : <Search className="w-5 h-5" />}
            iconPosition="right"
            className={pincodeSuccess ? 'border-emerald-100 ring-emerald-50' : ''}
          />
        </FormField>

        <FormField label="Country">
          <Input
            value="India"
            readOnly
            disabled
            icon={<Globe className="w-5 h-5" />}
          />
        </FormField>
      </FormSection>
    </div>
  );
}
