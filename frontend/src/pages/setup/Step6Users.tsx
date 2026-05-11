import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  UserPlus, 
  Shield, 
  Trash2,
  Plus,
  Briefcase,
  Info
} from 'lucide-react';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import FormSection from '../../components/ui/FormSection';
import Button from '../../components/ui/Button';

interface Props {
  data: any;
  update: (val: any) => void;
}

export default function Step6Users({ data, update }: Props) {
  const [newStaff, setNewStaff] = useState({ name: '', role: 'CASHIER' });

  const addStaff = () => {
    if (!newStaff.name.trim()) return;
    update({ staff: [...(data.staff || []), { ...newStaff, id: Date.now() }] });
    setNewStaff({ name: '', role: 'CASHIER' });
  };

  const removeStaff = (id: number) => {
    update({ staff: data.staff.filter((s: any) => s.id !== id) });
  };

  const roles = [
    { value: 'MANAGER', label: 'Manager', icon: '👨‍💼', desc: 'Full Control', gradient: 'from-slate-700 to-slate-900' },
    { value: 'CASHIER', label: 'Cashier', icon: '💰', desc: 'Billing Only', gradient: 'from-emerald-500 to-teal-600' },
    { value: 'PHARMACIST', label: 'Pharmacist', icon: '💊', desc: 'Stock & Meds', gradient: 'from-indigo-500 to-blue-600' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
      <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
        <div className="bg-white p-2.5 rounded-xl text-indigo-600 shadow-sm shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-0.5">Personnel & Security</h3>
          <p className="text-xs text-slate-500 font-medium">Configure your primary administrative account and enroll initial staff into your enterprise workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <FormSection title="Administrator Access" description="Super-user credentials for full workspace control.">
          <div className="md:col-span-2">
            <FormField label="Admin Username" required helperText="Unique identifier for root access.">
              <Input
                name="adminUsername"
                value={data.adminUsername || ''}
                onChange={(e) => update({ adminUsername: e.target.value })}
                placeholder="e.g. admin_root"
                icon={<User size={18} />}
              />
            </FormField>
          </div>

          <FormField label="Access Password" required>
            <Input
              type="password"
              name="password"
              value={data.password || ''}
              onChange={(e) => update({ password: e.target.value })}
              placeholder="••••••••"
              icon={<Lock size={18} />}
            />
          </FormField>

          <FormField label="Confirm Password" required>
            <Input
              type="password"
              name="confirmPassword"
              value={data.confirmPassword || ''}
              onChange={(e) => update({ confirmPassword: e.target.value })}
              placeholder="••••••••"
              icon={<Shield size={18} />}
              error={data.password && data.confirmPassword && data.password !== data.confirmPassword}
            />
          </FormField>
        </FormSection>

        <div className="space-y-8">
          <FormSection title="Enroll Personnel" description="Add initial staff members and assign their roles.">
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <Button
                    key={r.value}
                    variant={newStaff.role === r.value ? 'primary' : 'outline'}
                    onClick={() => setNewStaff({...newStaff, role: r.value})}
                    className={`text-xs font-bold ${newStaff.role === r.value ? 'bg-slate-900 border-slate-900 text-white shadow-md hover:bg-slate-800' : ''}`}
                    leftIcon={<span className="text-base">{r.icon}</span>}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="Staff Full Name"
                  />
                </div>
                <Button
                  size="icon"
                  className="px-4"
                  onClick={addStaff}
                >
                  <Plus size={24} />
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {data.staff?.map((s: any) => (
                <div key={s.id} className="flex items-center gap-4 bg-white border border-slate-100 p-4 rounded-2xl group hover:border-indigo-100 hover:shadow-sm transition-all animate-in slide-in-from-bottom-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all border border-slate-100">
                    <Briefcase size={18} />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-bold text-slate-900">{s.name}</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.role}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => removeStaff(s.id)}
                    className="p-2 border-transparent hover:border-red-600 shadow-none bg-transparent hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              {(!data.staff || data.staff.length === 0) && (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No staff enrolled yet</p>
                </div>
              )}
            </div>
          </FormSection>
        </div>
      </div>
    </div>
  );
}
