import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import ImageUploader from './ImageCrop/ImageUploader';
import Modal from './Modal';
import FormField from './ui/FormField';
import FormSection from './ui/FormSection';
import Input from './ui/Input';
import Select from './ui/Select';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [hsnLoading, setHsnLoading] = useState(false);
  const [hsnWarning, setHsnWarning] = useState('');
  const [availableGstRates, setAvailableGstRates] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    category: initialData?.category || '',
    hsnCode: initialData?.hsnCode || '',
    unit: initialData?.unit || 'pcs',
    purchasePrice: initialData?.purchasePrice || '',
    sellingPrice: initialData?.sellingPrice || '',
    mrp: initialData?.mrp || '',
    gstRate: initialData?.gstRate?.toString() || '0',
    minStockLevel: initialData?.minStockLevel?.toString() || '10',
    currentStock: initialData?.currentStock?.toString() || '0',
    location: initialData?.location || '',
    imageKey: initialData?.imageKey || null,
    image: initialData?.image || null
  });

  useEffect(() => {
    const code = formData.hsnCode;
    if (code.trim().length >= 4) {
      const timer = setTimeout(async () => {
        setHsnLoading(true);
        setHsnWarning('');
        try {
          const res = await api.get(`/hsn/${code.trim()}`);
          const data = res.data;
          
          if (data && data.length > 0) {
            const rates = data.map((d: any) => d.gstRate);
            setAvailableGstRates(rates);
            
            if (rates.length === 1) {
              setFormData(prev => ({ ...prev, gstRate: rates[0].toString() }));
            } else if (!rates.includes(Number(formData.gstRate))) {
              setFormData(prev => ({ ...prev, gstRate: rates[0].toString() }));
            }
          } else {
            setAvailableGstRates([]);
            setHsnWarning('HSN not found in master database. Please verify GST rate manually.');
          }
        } catch (err) {
          setAvailableGstRates([]);
        } finally {
          setHsnLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setAvailableGstRates([]);
      setHsnWarning('');
    }
  }, [formData.hsnCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (initialData?.id) {
        await api.put(`/products/${initialData.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSuccess();
    } catch (err: any) {
      if (err.response?.data?.details) {
        const messages = err.response.data.details.map((d: any) => d.message).join(', ');
        setError(`Validation failed: ${messages}`);
      } else {
        setError(err.response?.data?.error || `Failed to ${initialData?.id ? 'update' : 'create'} product`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Product' : 'Add New Product'}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading} 
            className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="productForm" 
            disabled={loading} 
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {initialData ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      }
    >
      <form id="productForm" onSubmit={handleSubmit} className="p-8">
        <div className="space-y-10">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {/* Media Section */}
          <FormSection title="Product Image" description="Upload a high-quality photo for the catalog">
            <div className="col-span-full flex justify-center md:justify-start">
              <ImageUploader 
                type="product-image"
                value={formData.image}
                onChange={(key) => setFormData(p => ({ ...p, imageKey: key }))}
                aspectRatio={1}
                description="Standard 1:1 format (Square)"
              />
            </div>
          </FormSection>

          {/* Basic Details */}
          <FormSection title="Basic Details" description="Primary identification for this item">
            <FormField label="Product Name" required>
              <Input 
                required 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="e.g. Paracetamol 500mg" 
              />
            </FormField>
            
            <FormField label="SKU / Item Code" required helperText="Internal tracking identifier">
              <Input 
                required 
                type="text" 
                name="sku" 
                value={formData.sku} 
                onChange={handleChange} 
                placeholder="e.g. MED-001" 
              />
            </FormField>

            <FormField label="Category">
              <Input 
                type="text" 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                placeholder="e.g. Tablets" 
              />
            </FormField>

            <FormField label="Inventory Unit">
              <Select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="pcs">Pieces (pcs)</option>
                <option value="strips">Strips</option>
                <option value="bottles">Bottles</option>
                <option value="box">Box</option>
                <option value="kg">Kilograms (kg)</option>
              </Select>
            </FormField>
          </FormSection>

          {/* Pricing & Tax */}
          <FormSection title="Pricing & Tax" description="Costing and taxation configuration">
            <FormField label="Purchase Price (₹)">
              <Input 
                type="number" 
                step="0.01" 
                name="purchasePrice" 
                value={formData.purchasePrice} 
                onChange={handleChange} 
                placeholder="0.00"
              />
            </FormField>

            <FormField label="Selling Price (₹)">
              <Input 
                type="number" 
                step="0.01" 
                name="sellingPrice" 
                value={formData.sellingPrice} 
                onChange={handleChange} 
                placeholder="0.00"
              />
            </FormField>

            <FormField label="MRP (₹)" helperText="Maximum Retail Price">
              <Input 
                type="number" 
                step="0.01" 
                name="mrp" 
                value={formData.mrp} 
                onChange={handleChange} 
                placeholder="0.00"
              />
            </FormField>

            <FormField 
              label="HSN Code" 
              error={hsnWarning}
              className="md:col-span-1"
            >
              <Input 
                type="text" 
                name="hsnCode" 
                value={formData.hsnCode} 
                onChange={handleChange} 
                placeholder="8 digit code"
                icon={hsnLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                iconPosition="right"
                className={hsnWarning ? 'border-amber-300 bg-amber-50/50' : ''}
              />
            </FormField>

            <FormField 
              label="GST Rate (%)" 
              helperText={availableGstRates.length === 1 ? "Automatically matched from HSN" : ""}
            >
              <Select 
                name="gstRate" 
                value={formData.gstRate} 
                onChange={handleChange} 
                disabled={availableGstRates.length === 1}
              >
                {(availableGstRates.length > 0 ? availableGstRates : [0, 5, 12, 18, 28]).map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}% {rate === 0 && availableGstRates.length === 0 ? '(Exempt)' : ''}
                  </option>
                ))}
              </Select>
            </FormField>
          </FormSection>

          {/* Inventory */}
          <FormSection title="Stock Management" description="Inventory levels and location tracking">
            <FormField label="Opening Stock">
              <Input 
                type="number" 
                name="currentStock" 
                value={formData.currentStock} 
                onChange={handleChange} 
                placeholder="0"
              />
            </FormField>

            <FormField label="Min. Alert Level" helperText="Warn when stock falls below this">
              <Input 
                type="number" 
                name="minStockLevel" 
                value={formData.minStockLevel} 
                onChange={handleChange} 
                placeholder="10"
              />
            </FormField>

            <FormField label="Storage Location">
              <Input 
                type="text" 
                name="location" 
                value={formData.location} 
                onChange={handleChange} 
                placeholder="e.g. Rack A1, Shelf 3" 
              />
            </FormField>
          </FormSection>
        </div>
      </form>
    </Modal>
  );
};

export default ProductModal;
