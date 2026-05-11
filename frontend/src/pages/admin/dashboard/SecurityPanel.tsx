import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { ShieldCheck, Key, Lock, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../../api/axios';
import Swal from 'sweetalert2';

interface SecurityProps {
  integrity: any;
  onRefresh: () => void;
}

const SecurityPanel: React.FC<SecurityProps> = ({ integrity, onRefresh }) => {
  const [verifying, setVerifying] = useState(false);

  const handleRotateKeys = async () => {
    const { value: confirmed } = await Swal.fire({
      title: 'Rotate Audit Keys?',
      text: "Historical logs remain verifiable, but future anchors will use new cryptographic material. Requires Step-up Auth.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rotate Now',
      confirmButtonColor: '#e11d48'
    });

    if (confirmed) {
      try {
        Swal.fire({ title: 'Rotating KMS Keys...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const { data } = await api.post('/system/integrity/rotate-keys');
        Swal.fire('Identity Rotated', `New Active Key: ${data.keyId}`, 'success');
        onRefresh();
      } catch (err) {
        Swal.fire('Error', 'Key rotation failed', 'error');
      }
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      Swal.fire({ title: 'Analyzing Blast Radius...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const { data: impact } = await api.get(`/system/integrity/key-impact/${id}`);
      
      const { value: reason } = await Swal.fire({
        title: 'Revoke Key Version?',
        html: `
          <div class="text-left p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-4">
            <p class="text-[10px] font-black uppercase text-rose-600 mb-2 tracking-widest">⚠️ Blast Radius Report</p>
            <div class="space-y-1 text-rose-900 font-bold text-sm">
               <p>• Anchors Affected: ${impact.anchorCount} (Daily Proofs)</p>
               <p>• Log Exposure: ~${impact.estimatedLogs.toLocaleString()} Entries</p>
               <p>• Last Deployment: ${new Date(impact.lastUsedAt).toLocaleString()}</p>
            </div>
          </div>
          <p class="text-xs text-slate-500 font-bold px-4">This key will be immediately invalidated for any future signatures. Historical verification remains intact but will be flagged as REVOKED.</p>
        `,
        input: 'text',
        inputPlaceholder: 'Reason for revocation (e.g., potential compromise)',
        showCancelButton: true,
        confirmButtonText: 'Confirm Revocation',
        confirmButtonColor: '#e11d48'
      });

      if (reason) {
          await api.post(`/system/incidents/revoke-key`, { id, reason });
          Swal.fire('Key Invalidated', 'The trust boundary has been updated.', 'success');
          onRefresh();
      }
    } catch (err) {
       Swal.fire('Error', 'Revocation analysis failed', 'error');
    }
  };

  const runDeepAudit = async () => {
    try {
       setVerifying(true);
       Swal.fire({ title: 'Traversing Audit Chain...', text: 'Verifying cryptographic hashes & HSM signatures', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
       const { data } = await api.post('/system/integrity/verify');
       Swal.fire(data.success ? 'Chain Verified' : 'Breach Detected', data.message, data.success ? 'success' : 'error');
       onRefresh();
    } catch (err) {
       Swal.fire('Error', 'Verification failed', 'error');
    } finally {
       setVerifying(false);
    }
  };

  return (
    <Card className="bg-white border-slate-100 p-6 flex flex-col space-y-6 elevation-1">
       <div className="flex justify-between items-start">
          <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Trust Domain</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">Audit Integrity</h3>
          </div>
          <Badge variant="success" className="bg-emerald-100 text-emerald-700 font-black text-[9px] px-2 py-1 flex items-center gap-1">
             <CheckCircle2 size={10} /> VERIFIED
          </Badge>
       </div>

       <div className="space-y-4">
           {/* Anchor Status */}
           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Daily Anchor Hash</p>
                 <span className="text-[10px] font-bold text-slate-400">v{integrity?.keyId || '2.1'}</span>
              </div>
              <p className="text-[11px] font-mono font-bold text-slate-600 break-all leading-relaxed">
                 {integrity?.hash || 'SHA256: 4f12...b902'}
              </p>
           </div>

           {/* Quick Actions */}
           <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-10 rounded-xl text-[10px] font-black uppercase border-slate-200 bg-white" 
                leftIcon={<Key size={14} />}
                onClick={handleRotateKeys}
              >
                 Rotate
              </Button>
              <Button 
                className="h-10 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white" 
                leftIcon={<ShieldCheck size={14} />}
                onClick={runDeepAudit}
              >
                 Deep Audit
              </Button>
           </div>
       </div>

       <div className="pt-4 border-t border-slate-50 space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
             <span className="text-slate-400">HSM Isolation Status:</span>
             <span className="text-emerald-500">Append-Only Active</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
             <span className="text-slate-400">Last Key Rotation:</span>
             <span className="text-slate-600">24d ago</span>
          </div>
       </div>
    </Card>
  );
};

export default SecurityPanel;
