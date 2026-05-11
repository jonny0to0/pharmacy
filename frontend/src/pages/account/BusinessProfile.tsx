import React, { useState, useEffect } from 'react';
import { Save, Loader2, Building2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import ImageUploader from '../../components/ImageCrop/ImageUploader';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormSection from '../../components/ui/FormSection';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { usePermission } from '../../hooks/usePermission';

const BusinessProfile = () => {
  const { hasPermission } = usePermission();
  const canEdit = hasPermission('SETTINGS.UPDATE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<any>({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    businessType: '',
    logoKey: null,
    bannerKey: null,
    logo: null,
    banner: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/settings/full-profile');
        if (res.data) {
          const p = res.data.profile || {};
          setFormData({
            businessName: res.data.businessName || '',
            ownerName: p.ownerName || '',
            phone: p.phone || '',
            email: p.email || '',
            businessType: res.data.businessType || 'PHARMACY',
            logoKey: p.logoKey || null,
            bannerKey: p.bannerKey || null,
            logo: p.logo || null,
            banner: p.banner || null
          });
        }
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.businessName) newErrors.businessName = 'Business name is required';
    if (!formData.ownerName) newErrors.ownerName = 'Owner name is required';
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Valid mobile number required';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid email is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev: any) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/settings/profile', formData);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">
      <Building2 className="w-12 h-12 mb-4 opacity-20" />
      Syncing Identity...
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-5xl space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Business Identity</h1>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest opacity-70">Branding & Corporate Profile</p>
      </div>

      <form onSubmit={handleSave} className="space-y-16">
        <FormSection title="Branding & Assets">
          <Card className="bg-slate-50/50 shadow-none border-slate-100">
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-1">
              <ImageUploader 
                label="Corporate Logo"
                description="1:1 Ratio, PNG/JPG"
                type="business-logo"
                value={formData.logo}
                onChange={(key) => setFormData((p: any) => ({ ...p, logoKey: key }))}
                aspectRatio={1}
                disabled={!canEdit}
              />
            </div>

            <div className="md:col-span-2">
              <ImageUploader 
                label="Profile Banner"
                description="Header showcase (21:9)"
                type="business-banner"
                value={formData.banner}
                onChange={(key) => setFormData((p: any) => ({ ...p, bannerKey: key }))}
                aspectRatio={21 / 9}
                className="w-full"
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>
      </FormSection>

        <FormSection title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <FormField label="Business Name" error={errors.businessName} required>
              <Input 
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="e.g. Medisynex Pharma"
                className="font-black text-lg"
                disabled={!canEdit}
              />
            </FormField>

            <FormField label="Owner / Authorized Person" error={errors.ownerName} required>
              <Input 
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Legal full name"
                disabled={!canEdit}
              />
            </FormField>

            <FormField label="Entity Classification">
              <Select 
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                disabled={!canEdit}
              >
                <option value="PHARMACY">Pharmacy</option>
                <option value="HOSPITAL">Hospital</option>
                <option value="WHOLESALER">Wholesaler</option>
                <option value="RETAILER">Retailer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="MEDICAL_STORE">Medical Store</option>
              </Select>
            </FormField>

            <FormField label="Primary Contact Number" error={errors.phone} required>
              <Input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile"
                disabled={!canEdit}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Official Correspondence Email" error={errors.email} required>
                <Input 
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="business@example.com"
                  disabled={!canEdit}
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        {canEdit && (
          <div className="flex justify-end pt-10 border-t border-slate-100">
            <Button 
              type="submit" 
              size="lg"
              disabled={saving}
              isLoading={saving}
              leftIcon={!saving ? <Save size={20} /> : undefined}
              className="bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 px-12"
            >
              {saving ? 'Realizing Profile...' : 'Authorize & Save changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default BusinessProfile;
