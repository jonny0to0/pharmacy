import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertTriangle, CheckCircle2, Plus, Trash2, Calendar, ShieldAlert, Beaker } from 'lucide-react';
import api from '../api/axios';
import Modal from './Modal';
import FormField from './ui/FormField';
import FormSection from './ui/FormSection';
import Input from './ui/Input';
import Select from './ui/Select';

interface BatchData {
  id?: string;
  batchNo: string;
  mfgDate: string;
  expiryDate: string;
  quantity: string;
  purchasePrice: string;
  mrp: string;
  sellingPrice: string;
  supplierId: string;
}

interface PharmacyProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const PharmacyProductModal: React.FC<PharmacyProductModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hsnLoading, setHsnLoading] = useState(false);
  const [hsnWarning, setHsnWarning] = useState('');
  const [availableGstRates, setAvailableGstRates] = useState<number[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [productData, setProductData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    category: initialData?.category || '',
    hsnCode: initialData?.hsnCode || '',
    unit: initialData?.unit || 'Tablet',
    manufacturer: initialData?.manufacturer || '',
    gstRate: initialData?.gstRate?.toString() || '12',
    minStockLevel: initialData?.minStockLevel?.toString() || '10',
    location: initialData?.location || ''
  });

  const [batches, setBatches] = useState<BatchData[]>([
    {
      batchNo: '',
      mfgDate: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      mrp: '',
      sellingPrice: '',
      supplierId: ''
    }
  ]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers');
    }
  };

  useEffect(() => {
    const code = productData.hsnCode;
    if (code.trim().length >= 4) {
      const timer = setTimeout(async () => {
        setHsnLoading(true);
        try {
          const res = await api.get(`/hsn/${code.trim()}`);
          if (res.data && res.data.length > 0) {
            const rates = res.data.map((d: any) => d.gstRate);
            setAvailableGstRates(rates);
            if (rates.length === 1) {
              setProductData(prev => ({ ...prev, gstRate: rates[0].toString() }));
            }
          } else {
            setAvailableGstRates([]);
            setHsnWarning('HSN not found. Verify GST manually.');
          }
        } catch (err) {
          setAvailableGstRates([]);
        } finally {
          setHsnLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [productData.hsnCode]);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleBatchChange = (index: number, field: keyof BatchData, value: string) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    setBatches(newBatches);
  };

  const addBatch = () => {
    setBatches([...batches, {
      batchNo: '',
      mfgDate: '',
      expiryDate: '',
      quantity: '',
      purchasePrice: '',
      mrp: '',
      sellingPrice: '',
      supplierId: ''
    }]);
  };

  const removeBatch = (index: number) => {
    if (batches.length > 1) {
      setBatches(batches.filter((_, i) => i !== index));
    }
  };

  const calculateMargin = (batch: BatchData) => {
    const buy = parseFloat(batch.purchasePrice) || 0;
    const sell = parseFloat(batch.sellingPrice) || 0;
    if (buy === 0) return '0';
    return (((sell - buy) / buy) * 100).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    for (const batch of batches) {
      if (parseFloat(batch.sellingPrice) > parseFloat(batch.mrp)) {
        setError(`Batch ${batch.batchNo}: Selling Price cannot exceed MRP`);
        setLoading(false);
        return;
      }
      if (batch.mfgDate && batch.expiryDate && new Date(batch.mfgDate) >= new Date(batch.expiryDate)) {
        setError(`Batch ${batch.batchNo}: Manufacture Date must be before Expiry Date`);
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        product: productData,
        batches: batches.filter(b => b.batchNo.trim() !== '')
      };
      
      console.log("Payload:", payload);
      
      await api.post('/products/create-with-batch', payload);
      onSuccess();
    } catch (err: any) {
      console.error("API Error:", err.response?.data || err.message);
      
      const serverMessage = err.response?.data?.message;
      const serverError = err.response?.data?.error;
      const validationError = err.response?.data?.details?.[0]?.message;
      
      const displayError = serverError || serverMessage || validationError || 'Failed to create product';
      setError(typeof displayError === 'string' ? displayError : JSON.stringify(displayError));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-6xl"
      title={
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Beaker size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? 'Modify Product Specifications' : 'Onboard Pharmacy SKU'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Ensure compliance with batch tracking and regulatory standards.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-between items-center w-full px-2">
          <div className="flex items-center gap-8">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Batches</span>
                <span className="text-lg font-bold text-slate-900 leading-none mt-1">{batches.length}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Quantity</span>
                <span className="text-lg font-bold text-slate-900 leading-none mt-1">
                  {batches.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0)}
                </span>
             </div>
          </div>
          <div className="flex gap-3">
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
              form="pharmacyProductForm" 
              disabled={loading} 
              className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {initialData ? 'Update Specs' : 'Save Product'}
            </button>
          </div>
        </div>
      }
    >
      <form id="pharmacyProductForm" onSubmit={handleSubmit} className="p-8">
        <div className="space-y-12">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}
          
          <FormSection 
            title="Product Definition" 
            description="Core identification and classification"
          >
            <div className="md:col-span-2">
              <FormField label="Product Name" required>
                <Input 
                  required 
                  type="text" 
                  name="name" 
                  value={productData.name} 
                  onChange={handleProductChange} 
                  placeholder="e.g. Augmentin 625 Duo" 
                />
              </FormField>
            </div>
            
            <FormField label="Category">
              <Input 
                type="text" 
                name="category" 
                value={productData.category} 
                onChange={handleProductChange} 
                placeholder="e.g. Antibiotics" 
              />
            </FormField>

            <FormField label="Manufacturer" required>
              <Input 
                required 
                type="text" 
                name="manufacturer" 
                value={productData.manufacturer} 
                onChange={handleProductChange} 
                placeholder="e.g. GSK / Cipla" 
              />
            </FormField>

            <FormField label="HSN Code" required error={hsnWarning}>
              <Input 
                required 
                type="text" 
                name="hsnCode" 
                value={productData.hsnCode} 
                onChange={handleProductChange} 
                placeholder="e.g. 3004"
                icon={hsnLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                iconPosition="right"
                className={hsnWarning ? 'border-amber-300 bg-amber-50/50' : ''}
              />
            </FormField>

            <FormField label="GST Rate (%)">
              <Select name="gstRate" value={productData.gstRate} onChange={handleProductChange}>
                {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
              </Select>
            </FormField>

            <FormField label="Unit of Measure">
              <Select name="unit" value={productData.unit} onChange={handleProductChange}>
                {['Tablet', 'Strip', 'Bottle', 'Syrup', 'Injection', 'Capsule'].map(u => <option key={u} value={u}>{u}</option>)}
              </Select>
            </FormField>

            <FormField label="Internal SKU">
              <Input 
                type="text" 
                name="sku" 
                value={productData.sku} 
                onChange={handleProductChange} 
                placeholder="e.g. MED-001" 
              />
            </FormField>

            <FormField label="Storage Location">
              <Input 
                type="text" 
                name="location" 
                value={productData.location} 
                onChange={handleProductChange} 
                placeholder="e.g. Rack A1, Shelf 2" 
              />
            </FormField>
          </FormSection>

          {/* Section 2: Batch Management */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Batch & Inventory Tracking
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Specify procurement and expiration parameters.</p>
              </div>
              <button 
                type="button" 
                onClick={addBatch} 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all text-xs font-bold border border-indigo-100"
              >
                <Plus size={16} /> Add New Batch
              </button>
            </div>

            <div className="space-y-4">
              {batches.map((batch, index) => (
                <div key={index} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-200 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
                  {batches.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeBatch(index)} 
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove Batch"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5">
                    <FormField label="Batch Number" required>
                      <Input 
                        required 
                        value={batch.batchNo} 
                        onChange={(e) => handleBatchChange(index, 'batchNo', e.target.value)} 
                        placeholder="PCM001" 
                        className="font-bold"
                      />
                    </FormField>

                    <FormField label="Quantity" required>
                      <Input 
                        required 
                        type="number" 
                        value={batch.quantity} 
                        onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)} 
                        placeholder="100" 
                      />
                    </FormField>

                    <FormField label="Mfg Date" required>
                      <Input 
                        required 
                        type="date" 
                        value={batch.mfgDate} 
                        onChange={(e) => handleBatchChange(index, 'mfgDate', e.target.value)} 
                      />
                    </FormField>

                    <FormField label="Expiry Date" required>
                      <Input 
                        required 
                        type="date" 
                        value={batch.expiryDate} 
                        onChange={(e) => handleBatchChange(index, 'expiryDate', e.target.value)} 
                        className={batch.expiryDate && new Date(batch.expiryDate) <= new Date() ? 'border-red-300 bg-red-50/50' : ''}
                      />
                    </FormField>

                    <FormField label="Purchase Price (₹)">
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={batch.purchasePrice} 
                        onChange={(e) => handleBatchChange(index, 'purchasePrice', e.target.value)} 
                        placeholder="0.00"
                      />
                    </FormField>

                    <FormField label="MRP (₹)" required>
                      <Input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={batch.mrp} 
                        onChange={(e) => handleBatchChange(index, 'mrp', e.target.value)} 
                        placeholder="0.00"
                      />
                    </FormField>

                    <FormField label="Selling Price (₹)" required>
                      <Input 
                        required 
                        type="number" 
                        step="0.01" 
                        value={batch.sellingPrice} 
                        onChange={(e) => handleBatchChange(index, 'sellingPrice', e.target.value)} 
                        placeholder="0.00"
                        className="border-blue-200"
                      />
                    </FormField>

                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <FormField label="Supplier">
                          <Select 
                            value={batch.supplierId} 
                            onChange={(e) => handleBatchChange(index, 'supplierId', e.target.value)}
                          >
                            <option value="">Select Supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </Select>
                        </FormField>
                      </div>
                      <div className="w-full bg-emerald-50 border border-emerald-100 h-[46px] rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Net Margin</span>
                        <span className={`text-sm font-bold mt-0.5 ${parseFloat(calculateMargin(batch)) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {calculateMargin(batch)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default PharmacyProductModal;
