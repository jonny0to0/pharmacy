import React from 'react';
import FormField from './ui/FormField';
import Input from './ui/Input';
import Select from './ui/Select';
import FormSection from './ui/FormSection';
import { Beaker, Calendar, Plus, Trash2, Tag, Layers, MapPin, Factory } from 'lucide-react';

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

interface PharmaProductFormProps {
  productData: any;
  onProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  batches: BatchData[];
  onBatchChange: (index: number, field: keyof BatchData, value: string) => void;
  onAddBatch: () => void;
  onRemoveBatch: (index: number) => void;
  suppliers: any[];
  hsnLoading?: boolean;
  hsnWarning?: string;
  hideBatches?: boolean;
  onlyBatches?: boolean;
}

const PharmaProductForm: React.FC<PharmaProductFormProps> = ({
  productData,
  onProductChange,
  batches,
  onBatchChange,
  onAddBatch,
  onRemoveBatch,
  suppliers,
  hsnLoading,
  hsnWarning,
  hideBatches,
  onlyBatches
}) => {
  const calculateMargin = (batch: BatchData) => {
    const buy = parseFloat(batch.purchasePrice) || 0;
    const sell = parseFloat(batch.sellingPrice) || 0;
    if (buy === 0) return '0';
    return (((sell - buy) / buy) * 100).toFixed(2);
  };

  return (
    <div className="space-y-12">
      {/* Product Information */}
      {!onlyBatches && (
        <FormSection title="Product Definition" description="Core identification and classification">
        <div className="md:col-span-2">
          <FormField label="Product Name" required>
            <Input 
              required 
              type="text" 
              name="name" 
              value={productData.name} 
              onChange={onProductChange} 
              placeholder="e.g. Augmentin 625 Duo" 
              icon={<Beaker size={18} className="text-indigo-500" />}
            />
          </FormField>
        </div>
        
        <FormField label="Category">
          <Input 
            type="text" 
            name="category" 
            value={productData.category} 
            onChange={onProductChange} 
            placeholder="e.g. Antibiotics" 
            icon={<Layers size={18} className="text-slate-400" />}
          />
        </FormField>

        <FormField label="Manufacturer" required>
          <Input 
            required 
            type="text" 
            name="manufacturer" 
            value={productData.manufacturer} 
            onChange={onProductChange} 
            placeholder="e.g. GSK / Cipla" 
            icon={<Factory size={18} className="text-slate-400" />}
          />
        </FormField>

        <FormField label="HSN Code" required error={hsnWarning}>
          <Input 
            required 
            type="text" 
            name="hsnCode" 
            value={productData.hsnCode} 
            onChange={onProductChange} 
            placeholder="e.g. 3004"
            className={hsnWarning ? 'border-amber-300 bg-amber-50/50' : ''}
          />
        </FormField>

        <FormField label="GST Rate (%)">
          <Select name="gstRate" value={productData.gstRate} onChange={onProductChange}>
            {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
          </Select>
        </FormField>

        <FormField label="Unit of Measure">
          <Select name="unit" value={productData.unit} onChange={onProductChange}>
            {['Tablet', 'Strip', 'Bottle', 'Syrup', 'Injection', 'Capsule'].map(u => <option key={u} value={u}>{u}</option>)}
          </Select>
        </FormField>

        <FormField label="Internal SKU">
          <Input 
            type="text" 
            name="sku" 
            value={productData.sku} 
            onChange={onProductChange} 
            placeholder="e.g. MED-001" 
            icon={<Tag size={18} className="text-slate-400" />}
          />
        </FormField>

        <FormField label="Storage Location">
          <Input 
            type="text" 
            name="location" 
            value={productData.location} 
            onChange={onProductChange} 
            placeholder="e.g. Rack A1, Shelf 2" 
            icon={<MapPin size={18} className="text-slate-400" />}
          />
        </FormField>
      </FormSection>
      )}

      {/* Batch Management */}
      {!hideBatches && (
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
            onClick={onAddBatch} 
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
                  onClick={() => onRemoveBatch(index)} 
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
                    onChange={(e) => onBatchChange(index, 'batchNo', e.target.value)} 
                    placeholder="PCM001" 
                    className="font-bold"
                  />
                </FormField>

                <FormField label="Quantity" required>
                  <Input 
                    required 
                    type="number" 
                    value={batch.quantity} 
                    onChange={(e) => onBatchChange(index, 'quantity', e.target.value)} 
                    placeholder="100" 
                  />
                </FormField>

                <FormField label="Mfg Date" required>
                  <Input 
                    required 
                    type="date" 
                    value={batch.mfgDate} 
                    onChange={(e) => onBatchChange(index, 'mfgDate', e.target.value)} 
                  />
                </FormField>

                <FormField label="Expiry Date" required>
                  <Input 
                    required 
                    type="date" 
                    value={batch.expiryDate} 
                    onChange={(e) => onBatchChange(index, 'expiryDate', e.target.value)} 
                    className={batch.expiryDate && new Date(batch.expiryDate) <= new Date() ? 'border-red-300 bg-red-50/50' : ''}
                  />
                </FormField>

                <FormField label="Purchase Price (₹)">
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={batch.purchasePrice} 
                    onChange={(e) => onBatchChange(index, 'purchasePrice', e.target.value)} 
                    placeholder="0.00"
                  />
                </FormField>

                <FormField label="MRP (₹)" required>
                  <Input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={batch.mrp} 
                    onChange={(e) => onBatchChange(index, 'mrp', e.target.value)} 
                    placeholder="0.00"
                  />
                </FormField>

                <FormField label="Selling Price (₹)" required>
                  <Input 
                    required 
                    type="number" 
                    step="0.01" 
                    value={batch.sellingPrice} 
                    onChange={(e) => onBatchChange(index, 'sellingPrice', e.target.value)} 
                    placeholder="0.00"
                    className="border-blue-200"
                  />
                </FormField>

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <FormField label="Supplier">
                      <Select 
                        value={batch.supplierId} 
                        onChange={(e) => onBatchChange(index, 'supplierId', e.target.value)}
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
      )}
    </div>
  );
};

export default PharmaProductForm;
