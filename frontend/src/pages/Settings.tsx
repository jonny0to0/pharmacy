import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { 
  Building2, Globe, Phone, Mail, MapPin, FileText, 
  Shield, Palette, Bell, LayoutGrid, Activity, 
  Loader2, Save 
} from 'lucide-react';
import { useFormDraft } from '../hooks/useFormDraft';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import FormSection from '../components/ui/FormSection';
import { usePermission } from '../hooks/usePermission';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

const GST_RATES = ['5', '12', '18', '28', '0'];

const TABS = [
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'tax', label: 'Tax & GST', icon: Shield },
  { id: 'invoice', label: 'Invoice Settings', icon: FileText },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'modules', label: 'System Modules', icon: LayoutGrid },
];

const Settings = () => {
  const { hasPermission, checkPermissionAndRun } = usePermission();
  const [activeTab, setActiveTab] = useState('business');
  const [saving, setSaving] = useState(false);

  // Business Profile state
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Pharmacy');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Tax state
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [isComposition, setIsComposition] = useState(false);
  const [compositionRate, setCompositionRate] = useState('1');
  const [defaultGstRate, setDefaultGstRate] = useState('12');

  // Invoice state
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceStartNo, setInvoiceStartNo] = useState('1');
  const [termsConditions, setTermsConditions] = useState('Thank you for your business. Goods once sold will not be returned.');
  const [showShippingAddress, setShowShippingAddress] = useState(true);
  const [defaultDueDays, setDefaultDueDays] = useState('30');

  // Notifications state
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);

  // Modules state
  const [enableMedicalInfo, setEnableMedicalInfo] = useState(false);
  const [walkInBehavior, setWalkInBehavior] = useState('OPTION_A');
  const [allowPharmacistRegister, setAllowPharmacistRegister] = useState(false);

  const settingsData = {
    businessName, businessType, mobile, email, website, address, state, pincode,
    gstin, pan, isComposition, compositionRate, defaultGstRate,
    invoicePrefix, invoiceStartNo, termsConditions, showShippingAddress, defaultDueDays,
    lowStockAlert, paymentReminders, dailySummary, enableMedicalInfo,
    walkInBehavior, allowPharmacistRegister
  };

  // Draft Preservation Hook
  const { saveDraft, clearDraft } = useFormDraft(
    'system_settings',
    settingsData,
    {
      autoRestore: true, // Auto-restore for settings as it's not "critical" data like a sale
      onRestore: (data) => {
        setBusinessName(data.businessName);
        setBusinessType(data.businessType);
        setMobile(data.mobile);
        setEmail(data.email);
        setWebsite(data.website);
        setAddress(data.address);
        setState(data.state);
        setPincode(data.pincode);
        setGstin(data.gstin);
        setPan(data.pan);
        setIsComposition(data.isComposition);
        setCompositionRate(data.compositionRate);
        setDefaultGstRate(data.defaultGstRate);
        setInvoicePrefix(data.invoicePrefix);
        setInvoiceStartNo(data.invoiceStartNo);
        setTermsConditions(data.termsConditions);
        setShowShippingAddress(data.showShippingAddress);
        setDefaultDueDays(data.defaultDueDays);
        setLowStockAlert(data.lowStockAlert);
        setPaymentReminders(data.paymentReminders);
        setDailySummary(data.dailySummary);
        setEnableMedicalInfo(data.enableMedicalInfo);
        setWalkInBehavior(data.walkInBehavior || 'OPTION_A');
        setAllowPharmacistRegister(!!data.allowPharmacistRegister);
        toast.success('Unsaved settings restored', { id: 'settings-draft' });
      }
    }
  );

  // Auto-save draft when data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft(settingsData);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [settingsData, saveDraft]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/settings/profile');
        if (response.data) {
          const p = response.data;
          setBusinessName(p.businessName || '');
          setBusinessType(p.businessType || 'Pharmacy');
          setGstin(p.gstin || '');
          setPan(p.pan || '');
          setAddress(p.address || '');
          setState(p.state || '');
          setPincode(p.pinCode || '');
          setIsComposition(Boolean(p.isComposition));
          setInvoicePrefix(p.invoicePrefix || 'INV');
          
          if (p.tenant?.settings) {
            setEnableMedicalInfo(!!p.tenant.settings.enableMedicalInfo);
            setWalkInBehavior(p.tenant.settings.walkInCustomerBehavior || 'OPTION_A');
            setAllowPharmacistRegister(!!p.tenant.settings.allowPharmacistCustomerCreation);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    checkPermissionAndRun('SETTINGS_BUSINESS.UPDATE', async () => {
      setSaving(true);
      try {
        await api.post('/settings/profile', {
          businessName, businessType, gstin, pan, address, state, pinCode: pincode,
          invoicePrefix, isGstRegistered: !isComposition
        });

        // Save Modules
        await api.post('/settings/modules', {
          enableMedicalInfo,
          walkInCustomerBehavior: walkInBehavior,
          allowPharmacistCustomerCreation: allowPharmacistRegister
        });

        toast.success('Settings saved successfully!');
        clearDraft(); // Clear draft on success
      } catch (err) {
        toast.error('Failed to save settings');
      } finally {
        setSaving(false);
      }
    });
  };

  const renderBusinessTab = () => (
    <div className="space-y-6">
      <FormField label="Business Name" required>
        <Input 
          type="text" 
          placeholder="e.g. Sharma Medical Store"
          value={businessName} 
          onChange={e => setBusinessName(e.target.value)}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField label="Business Type">
          <Select value={businessType} onChange={e => setBusinessType(e.target.value)}>
            {['Pharmacy', 'Retailer', 'Wholesaler', 'Distributor', 'Medical Store', 'Hospital'].map(t =>
              <option key={t} value={t}>{t}</option>
            )}
          </Select>
        </FormField>
        <FormField label="Mobile Number">
          <Input 
            type="tel" 
            placeholder="10-digit mobile"
            value={mobile} 
            onChange={e => setMobile(e.target.value)}
            icon={<Phone className="w-4 h-4 text-slate-400" />}
            iconPosition="left"
          />
        </FormField>
        <FormField label="Email Address">
          <Input 
            type="email" 
            placeholder="business@example.com"
            value={email} 
            onChange={e => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-400" />}
            iconPosition="left"
          />
        </FormField>
        <FormField label="Website">
          <Input 
            type="url" 
            placeholder="https://yourstore.com"
            value={website} 
            onChange={e => setWebsite(e.target.value)}
            icon={<Globe className="w-4 h-4 text-slate-400" />}
            iconPosition="left"
          />
        </FormField>
      </div>
      <FormField label="Business Address">
        <textarea 
          rows={3} 
          placeholder="Shop/Office address"
          value={address} 
          onChange={e => setAddress(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 text-sm font-medium resize-none transition-all placeholder:text-slate-400" 
        />
      </FormField>
      <div className="grid grid-cols-2 gap-6">
        <FormField label="State">
          <Select value={state} onChange={e => setState(e.target.value)}>
            <option value="">Select State</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="PIN Code">
          <Input 
            type="text" 
            placeholder="6-digit PIN" 
            maxLength={6}
            value={pincode} 
            onChange={e => setPincode(e.target.value)}
          />
        </FormField>
      </div>
    </div>
  );

  const renderTaxTab = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-sm text-indigo-700 flex gap-3">
        <Shield className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-bold mb-1">Taxation Compliance</p>
          <p className="font-medium opacity-80">Your GSTIN is used to auto-calculate intra-state and inter-state tax liabilities. Ensure accuracy for legal filings.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField label="GSTIN">
          <Input 
            type="text" 
            placeholder="15-character GSTIN" 
            maxLength={15}
            value={gstin} 
            onChange={e => setGstin(e.target.value.toUpperCase())}
            className="font-mono"
          />
        </FormField>
        <FormField label="PAN Number">
          <Input 
            type="text" 
            placeholder="10-character PAN" 
            maxLength={10}
            value={pan} 
            onChange={e => setPan(e.target.value.toUpperCase())}
            className="font-mono"
          />
        </FormField>
      </div>
      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-900">Composition Scheme</p>
          <p className="text-xs font-medium text-slate-500 mt-1">Enable if you are registered under the GST Composition Scheme.</p>
        </div>
        <button type="button" onClick={() => setIsComposition(!isComposition)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${isComposition ? 'bg-indigo-600' : 'bg-slate-300'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isComposition ? 'left-6' : 'left-1'}`}></div>
        </button>
      </div>
      {isComposition && (
        <FormField label="Composition Rate (%)">
          <Select value={compositionRate} onChange={e => setCompositionRate(e.target.value)}>
            <option value="1">1% (Traders)</option>
            <option value="2">2% (Manufacturers)</option>
            <option value="5">5% (Restaurants)</option>
            <option value="6">6% (Service Providers)</option>
          </Select>
        </FormField>
      )}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Default GST Rate</label>
        <div className="flex gap-2 flex-wrap">
          {GST_RATES.map(r => (
            <button key={r} type="button" onClick={() => setDefaultGstRate(r)}
              className={`px-5 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${defaultGstRate === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {r === '0' ? 'Exempt' : `${r}%`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInvoiceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <FormField label="Invoice Prefix" helperText={`Sequence: ${invoicePrefix}-2025-${String(invoiceStartNo).padStart(4, '0')}`}>
          <Input 
            type="text" 
            placeholder="INV" 
            value={invoicePrefix}
            onChange={e => setInvoicePrefix(e.target.value.toUpperCase())}
            className="font-mono"
          />
        </FormField>
        <FormField label="Starting Number">
          <Input 
            type="number" 
            min="1" 
            value={invoiceStartNo}
            onChange={e => setInvoiceStartNo(e.target.value)}
          />
        </FormField>
      </div>
      <FormField label="Default Terms (Net Days)">
        <Select value={defaultDueDays} onChange={e => setDefaultDueDays(e.target.value)}>
          {['0', '7', '14', '15', '30', '45', '60', '90'].map(d => (
            <option key={d} value={d}>{d === '0' ? 'Due on delivery' : `Net ${d} days`}</option>
          ))}
        </Select>
      </FormField>
      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-900">Show Shipping Address</p>
          <p className="text-xs font-medium text-slate-500 mt-1">Include logical shipping destination below billing details.</p>
        </div>
        <button type="button" onClick={() => setShowShippingAddress(!showShippingAddress)}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${showShippingAddress ? 'bg-indigo-600' : 'bg-slate-300'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${showShippingAddress ? 'left-6' : 'left-1'}`}></div>
        </button>
      </div>
      <FormField label="Terms & Conditions">
        <textarea 
          rows={3} 
          value={termsConditions}
          onChange={e => setTermsConditions(e.target.value)}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 text-sm font-medium resize-none transition-all placeholder:text-slate-400" 
        />
      </FormField>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-4">
      {[
        { key: 'low-stock', label: 'Inventory Alerts', desc: 'Critical notifications when stock falls below thresholds.', value: lowStockAlert, set: setLowStockAlert },
        { key: 'payment', label: 'Payment Realization', desc: 'Automated reminders for customer receivables.', value: paymentReminders, set: setPaymentReminders },
        { key: 'daily', label: 'Daily Operations Log', desc: 'Comprehensive summary of sales and procurement transactions.', value: dailySummary, set: setDailySummary },
      ].map(item => (
        <div key={item.key} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
          <div className="flex-1">
            <p className="font-bold text-sm text-slate-900">{item.label}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{item.desc}</p>
          </div>
          <button type="button" onClick={() => item.set(!item.value)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${item.value ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${item.value ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>
      ))}
    </div>
  );

  const renderModulesTab = () => (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-sm text-rose-700 flex gap-3">
        <LayoutGrid className="w-5 h-5 shrink-0" />
        <div>
          <p className="font-bold mb-1">Functional Extensions</p>
          <p className="font-medium opacity-80">Enable or disable advanced modules to customize your pharmacy operations. Disabling a module hides its interface but preserves existing data.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <Activity size={24} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base text-slate-900">Drug Medical Information</p>
          <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Pharmacy Grade Intelligence</p>
          <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">Adds a dedicated section for medical descriptions, side effects, contraindications, and warnings. Highly recommended for hospitals and clinical pharmacies.</p>
        </div>
        <button type="button" onClick={() => setEnableMedicalInfo(!enableMedicalInfo)}
          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${enableMedicalInfo ? 'bg-rose-600' : 'bg-slate-300'}`}>
          <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${enableMedicalInfo ? 'left-8' : 'left-1'}`}></div>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
        <div className="flex-1">
          <p className="font-bold text-base text-slate-900">Walk-in Customer Flow</p>
          <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Point of Sale Mechanics</p>
          <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
            Configure POS behavior when selecting Walk-in Customers: Option A displays the search modal, Option B immediately attaches a generic customer profile.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Select value={walkInBehavior} onChange={e => setWalkInBehavior(e.target.value)}>
            <option value="OPTION_A">Option A: Open Customer Selection Modal</option>
            <option value="OPTION_B">Option B: Auto-attach predefined system customer</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
        <div className="flex-1">
          <p className="font-bold text-base text-slate-900">Pharmacist Customer Registration</p>
          <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Role Access Configurations</p>
          <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
            Permit employees under the Pharmacist profile to register new customers on the fly during point of sale transaction creation.
          </p>
        </div>
        <button type="button" onClick={() => setAllowPharmacistRegister(!allowPharmacistRegister)}
          className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${allowPharmacistRegister ? 'bg-indigo-600' : 'bg-slate-300'}`}>
          <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${allowPharmacistRegister ? 'left-8' : 'left-1'}`}></div>
        </button>
      </div>
    </div>
  );

  const tabContent: Record<string, React.ReactNode> = {
    business: renderBusinessTab(),
    tax: renderTaxTab(),
    invoice: renderInvoiceTab(),
    notifications: renderNotificationsTab(),
    modules: renderModulesTab(),
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Configure business intelligence, tax parameters, and interface habits.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 shrink-0 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <nav className="space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Icon size={18} /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Workspace */}
        <div className="flex-1 w-full max-w-3xl">
          <form onSubmit={handleSave}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                 {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {tabContent[activeTab]}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={saving || !hasPermission('SETTINGS_BUSINESS.UPDATE')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:shadow-none"
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /> Persisting...</>
                ) : (
                  <><Save size={18} /> Update Configurations</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
