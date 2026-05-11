import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Monitor, Trash2, Clock, Globe, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { useAdminData } from '../../hooks/useAdminData';

const DeviceManagement: React.FC = () => {
    const { data: devices = [], loading, fetchData: fetchDevices, mutate } = useAdminData<any[]>('/system/security/devices');
    const navigate = useNavigate();

    const handleRevoke = async (id: string, name: string) => {
        const { value: confirmed } = await Swal.fire({
            title: 'Revoke Hardware Trust?',
            text: `This will immediately invalidate the 7-day trust window for "${name || 'Unknown Device'}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Revoke Trust',
            confirmButtonColor: '#e11d48'
        });

        if (confirmed) {
            const result = await mutate('delete', `/${id}`);
            if (result.success) {
                Swal.fire('Device Revoked', 'Hardware trust invalidated.', 'success');
                fetchDevices(null, true);
            }
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    className="p-2 rounded-xl hover:bg-slate-100" 
                    onClick={() => navigate('/admin/dashboard')}
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hardware Trust Registry</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage recognized devices & 7-day trust windows</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Info Card */}
                <div className="md:col-span-4">
                    <Card className="bg-indigo-900 text-white p-6 rounded-3xl space-y-6 shadow-2xl">
                        <div className="p-3 bg-white/10 rounded-2xl w-fit">
                           <Shield size={24} className="text-indigo-200" />
                        </div>
                        <div className="space-y-2">
                           <h3 className="font-black text-lg">Secure Identity Boundary</h3>
                           <p className="text-indigo-200 text-xs leading-relaxed font-bold">
                              Devices registered here bypass multi-factor step-up challenges during region changes for 7 days.
                           </p>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                           <ShieldAlert size={16} className="text-indigo-400" />
                           <p className="text-[10px] font-black uppercase text-indigo-300">Strict Impossible Travel Active</p>
                        </div>
                    </Card>
                </div>

                {/* Device List */}
                <div className="md:col-span-8 space-y-4">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Syncing hardware registry...</div>
                    ) : devices.length === 0 ? (
                        <div className="p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
                           <Smartphone size={48} className="mx-auto text-slate-200 mb-4" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No recognized hardware identified.</p>
                        </div>
                    ) : devices.map(device => (
                        <Card key={device.id} className="p-5 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-600 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                    {device.deviceName?.toLowerCase().includes('windows') || device.deviceName?.toLowerCase().includes('mac') ? (
                                        <Monitor size={20} />
                                    ) : (
                                        <Smartphone size={20} />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-black text-slate-900">{device.deviceName || 'Recognized Hardware'}</h4>
                                        <Badge variant="success" className="text-[9px] px-1.5 font-bold uppercase">ACTIVE</Badge>
                                    </div>
                                    <div className="flex gap-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Clock size={12} /> Last used: <span className="text-slate-600">{new Date(device.lastUsed).toLocaleDateString()}</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Globe size={12} /> Token expires in 7 days
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                onClick={() => handleRevoke(device.id, device.deviceName)}
                                title="Revoke Trust"
                            >
                                <Trash2 size={18} />
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeviceManagement;
