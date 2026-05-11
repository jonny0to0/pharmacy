import React, { useState, useEffect } from 'react';
import { MapPin, Globe, Save, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';
import Textarea from '../../components/ui/Textarea';
import { usePermission } from '../../hooks/usePermission';

const BusinessAddress = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingPincode, setFetchingPincode] = useState(false);
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('SETTINGS.UPDATE');
  const [formData, setFormData] = useState({
    address: '',
    state: '',
    pinCode: '',
    city: '',
    country: 'India'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/settings/full-profile');
        if (res.data) {
          const p = res.data.profile || {};
          const initialData = {
            address: p.address || '',
            state: p.state || '',
            pinCode: p.pinCode || '',
            city: '',
            country: 'India'
          };
          setFormData(initialData);

          if (p.pinCode && p.pinCode.length === 6) {
            try {
              const pinRes = await api.get(`/setup/pincode/${p.pinCode}`);
              if (pinRes.data) {
                setFormData(prev => ({
                  ...prev,
                  state: pinRes.data.state,
                  city: pinRes.data.city
                }));
              }
            } catch (err) {
              console.error('Initial pincode hydration failed');
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load address');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pinCode: val }));

    if (val.length === 6) {
      setFetchingPincode(true);
      try {
        const res = await api.get(`/setup/pincode/${val}`);
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            state: res.data.state,
            city: res.data.city
          }));
          toast.success(`Located: ${res.data.city}, ${res.data.state}`);
        }
      } catch (err) {
        console.error('Pincode fetch failed');
      } finally {
        setFetchingPincode(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/settings/profile', formData);
      toast.success('Address updated successfully');
    } catch (err) {
      toast.error('Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">
      <MapPin className="w-12 h-12 mb-4 opacity-20" />
      Locating Warehouse...
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-5xl space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Business Location</h1>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Physical Infrastructure & Logistics</p>
      </div>

      <form onSubmit={handleSave} className="space-y-16">
        <div className="bg-blue-50/50 p-10 rounded-[3rem] border border-blue-100/50 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-inner">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-500/5 shrink-0">
            <MapPin size={32} />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Geographic Hub</h3>
            <p className="text-xs text-slate-500 mt-2 font-bold leading-relaxed max-w-md">
              Synchronize your physical address for accurate GST tax calculations, automated shipping manifests, and localized inventory audits.
            </p>
          </div>
        </div>

        <FormSection title="Physical Address Mapping">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <div className="md:col-span-2">
              <FormField label="Comprehensive Street Address" required>
                <Textarea 
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="e.g. Landmark, Building Name, Street, Area"
                  disabled={!canEdit}
                />
              </FormField>
            </div>

            <FormField label="Standard PIN Code" required>
              <Input 
                value={formData.pinCode}
                onChange={handlePincodeChange}
                placeholder="6-digit PIN"
                maxLength={6}
                className="font-black text-xl tracking-[0.2em]"
                icon={fetchingPincode ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                iconPosition="right"
                disabled={!canEdit}
              />
            </FormField>

            <FormField label="State / Province">
              <Input 
                readOnly
                value={formData.state}
                className="bg-slate-50/50 font-bold text-slate-500"
                placeholder="Auto-populated"
              />
            </FormField>

            <FormField label="City / Region">
              <Input 
                readOnly
                value={formData.city}
                className="bg-slate-50/50 font-bold text-slate-500"
                placeholder="Auto-populated"
              />
            </FormField>

            <FormField label="Sovereign Nation">
              <div className="w-full px-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-400 flex items-center gap-3 text-sm">
                <Globe size={18} className="text-slate-300" /> Republic of India
              </div>
            </FormField>
          </div>
        </FormSection>

        {canEdit && (
          <div className="flex justify-end pt-10 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={saving}
              className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-200 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Realizing Location...' : 'Confirm Hub Address'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default BusinessAddress;
