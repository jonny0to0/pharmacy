import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Package, Beaker, Save, Loader2, 
  AlertTriangle, Layers, Activity 
} from 'lucide-react';
import Modal from './Modal';
import PharmaProductForm from './PharmaProductForm';
import GenericProductForm from './GenericProductForm';
import MedicalInfoForm from './MedicalInfoForm';
import { useAuth } from '../context/AuthContext';
import { useFormDraft } from '../hooks/useFormDraft';
import { usePermission } from '../hooks/usePermission';
import DraftRestorationModal from './DraftRestorationModal';
import toast from 'react-hot-toast';

interface ProductManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const ProductManagementModal: React.FC<ProductManagementModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const { user } = useAuth();
  const { hasModuleAccess } = usePermission();
  const businessType = user?.businessType || 'PHARMACY';
  const isPharma = businessType === 'PHARMACY' || businessType === 'WHOLESALER' || businessType === 'DISTRIBUTOR';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [hsnLoading, setHsnLoading] = useState(false);
  const [hsnWarning, setHsnWarning] = useState('');
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'BATCHES' | 'MEDICAL'>('GENERAL');
  const [enableMedicalInfo, setEnableMedicalInfo] = useState(false);

  // Unified State
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    category: initialData?.category || '',
    hsnCode: initialData?.hsnCode || '',
    unit: initialData?.unit || (isPharma ? 'Tablet' : 'pcs'),
    manufacturer: initialData?.manufacturer || '',
    gstRate: initialData?.gstRate?.toString() || '12',
    minStockLevel: initialData?.minStockLevel?.toString() || '10',
    currentStock: initialData?.currentStock?.toString() || '0',
    location: initialData?.location || '',
    purchasePrice: initialData?.purchasePrice || '',
    sellingPrice: initialData?.sellingPrice || '',
    mrp: initialData?.mrp || '',
    medicalDescription: initialData?.medicalDescription || '',
    uses: initialData?.uses || '',
    contraindications: initialData?.contraindications || '',
    sideEffects: initialData?.sideEffects || '',
    precautions: initialData?.precautions || '',
    dosageInfo: initialData?.dosageInfo || '',
  });

  const [batches, setBatches] = useState<any[]>([
    { batchNo: '', mfgDate: '', expiryDate: '', quantity: '', purchasePrice: '', mrp: '', sellingPrice: '', supplierId: '' }
  ]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        sku: initialData?.sku || '',
        barcode: initialData?.barcode || '',
        category: initialData?.category || initialData?.categoryName || '',
        hsnCode: initialData?.hsnCode || '',
        unit: initialData?.unit || (isPharma ? 'Tablet' : 'pcs'),
        manufacturer: initialData?.manufacturer || '',
        gstRate: initialData?.gstRate?.toString() || '12',
        minStockLevel: initialData?.minStockLevel?.toString() || '10',
        currentStock: initialData?.currentStock?.toString() || '0',
        location: initialData?.location || '',
        purchasePrice: initialData?.purchasePrice || '',
        sellingPrice: initialData?.sellingPrice || '',
        mrp: initialData?.mrp || '',
        medicalDescription: initialData?.medicalDescription || '',
        uses: initialData?.uses || '',
        contraindications: initialData?.contraindications || '',
        sideEffects: initialData?.sideEffects || '',
        precautions: initialData?.precautions || '',
        dosageInfo: initialData?.dosageInfo || '',
      });
      
      if (initialData?.batches && initialData.batches.length > 0) {
        setBatches(initialData.batches.map((b: any) => ({
          batchNo: b.batchNumber || b.batchNo || '',
          mfgDate: b.mfgDate ? new Date(b.mfgDate).toISOString().split('T')[0] : '',
          expiryDate: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : '',
          quantity: b.quantity || '',
          purchasePrice: b.purchasePrice || '',
          mrp: b.mrp || '',
          sellingPrice: b.sellingPrice || '',
          supplierId: b.supplierId || ''
        })));
      } else {
        setBatches([{ batchNo: '', mfgDate: '', expiryDate: '', quantity: '', purchasePrice: '', mrp: '', sellingPrice: '', supplierId: '' }]);
      }
      setActiveTab('GENERAL');
      setError('');
    }
  }, [isOpen, initialData, isPharma]);

  // Hook for draft preservation
  const { hasDraft, draftData, saveDraft, clearDraft, restoreDraft } = useFormDraft(
    initialData?.id ? `edit_product_${initialData.id}` : 'add_product',
    { formData, batches },
    { 
      autoRestore: false, // Critical form => prompt instead of auto-restore
      onRestore: (data) => {
        setFormData(data.formData);
        setBatches(data.batches);
        toast.success('Product draft restored');
      }
    }
  );

  // Auto-save draft when data changes
  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        saveDraft({ formData, batches });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, batches, saveDraft, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isPharma) fetchSuppliers();
      fetchSettings();
    }
  }, [isOpen, isPharma]);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/full-profile');
      setEnableMedicalInfo(!!res.data.settings?.enableMedicalInfo);
    } catch (err) {
      console.error('Failed to fetch module settings');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBatchChange = (index: number, field: string, value: string) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    setBatches(newBatches);
  };

  const addBatch = () => {
    setBatches([...batches, { batchNo: '', mfgDate: '', expiryDate: '', quantity: '', purchasePrice: '', mrp: '', sellingPrice: '', supplierId: '' }]);
  };

  const removeBatch = (index: number) => {
    if (batches.length > 1) {
      setBatches(batches.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (initialData?.id) {
        // Edit mode - update product master details
        await api.put(`/products/${initialData.id}`, formData);
      } else {
        // Create mode
        if (isPharma) {
          const payload = {
            product: formData,
            batches: batches.filter(b => b.batchNo.trim() !== '')
          };
          await api.post('/products/create-with-batch', payload);
        } else {
          await api.post('/products', formData);
        }
      }
      clearDraft(); // Important: clear draft after successful submission
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <DraftRestorationModal 
        isOpen={hasDraft}
        formName={initialData ? `editing ${initialData.name}` : 'new product'}
        onRestore={() => restoreDraft()}
        onDiscard={clearDraft}
        timestamp={ (draftData as any)?.timestamp }
      />
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={isPharma ? "max-w-6xl" : "max-w-4xl"}
      title={
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPharma ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
            {isPharma ? <Beaker size={24} /> : <Package size={24} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? 'Edit Product' : (isPharma ? 'Onboard Pharmacy SKU' : 'Add New Product')}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {isPharma ? 'Ensure compliance with batch tracking and regulatory standards.' : 'Register new inventory item in the system.'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-3 w-full px-2">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading} 
            className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="productManagementForm" 
            disabled={loading} 
            className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:shadow-none ${isPharma ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {initialData ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      }
    >
      <form id="productManagementForm" onSubmit={handleSubmit} className="p-8">
        <div className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('GENERAL')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'GENERAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Package size={14} /> General Info
            </button>
            {isPharma && !initialData && hasModuleAccess('INVENTORY') && (
              <button
                type="button"
                onClick={() => setActiveTab('BATCHES')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'BATCHES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Layers size={14} /> Stock & Batches
              </button>
            )}
            {enableMedicalInfo && (
              <button
                type="button"
                onClick={() => setActiveTab('MEDICAL')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'MEDICAL' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Activity size={14} /> Medical Details
              </button>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'GENERAL' && (
              isPharma ? (
                <PharmaProductForm 
                  productData={formData}
                  onProductChange={handleInputChange}
                  batches={[]} // Pass empty since batches are in separate tab now
                  onBatchChange={() => {}}
                  onAddBatch={() => {}}
                  onRemoveBatch={() => {}}
                  suppliers={suppliers}
                  hsnLoading={hsnLoading}
                  hsnWarning={hsnWarning}
                  hideBatches={true} // New prop for PharmaProductForm
                />
              ) : (
                <GenericProductForm 
                  formData={formData}
                  onChange={handleInputChange}
                  hsnLoading={hsnLoading}
                  hsnWarning={hsnWarning}
                />
              )
            )}

            {activeTab === 'BATCHES' && isPharma && !initialData && hasModuleAccess('INVENTORY') && (
              <PharmaProductForm 
                productData={formData}
                onProductChange={handleInputChange}
                batches={batches}
                onBatchChange={handleBatchChange}
                onAddBatch={addBatch}
                onRemoveBatch={removeBatch}
                suppliers={suppliers}
                hsnLoading={hsnLoading}
                hsnWarning={hsnWarning}
                onlyBatches={true} // New prop for PharmaProductForm
              />
            )}

            {activeTab === 'MEDICAL' && enableMedicalInfo && (
              <MedicalInfoForm 
                data={formData}
                onChange={handleInputChange}
              />
            )}
          </div>
        </div>
      </form>
    </Modal>
    </>
  );
};

export default ProductManagementModal;
