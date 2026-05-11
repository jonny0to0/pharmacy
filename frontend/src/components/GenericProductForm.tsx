import React from 'react';
import FormField from './ui/FormField';
import Input from './ui/Input';
import Select from './ui/Select';
import FormSection from './ui/FormSection';
import { Package, Tag, Layers, MapPin } from 'lucide-react';

interface GenericProductFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  hsnLoading?: boolean;
  hsnWarning?: string;
  availableGstRates?: number[];
}

const GenericProductForm: React.FC<GenericProductFormProps> = ({ 
  formData, 
  onChange, 
  hsnLoading, 
  hsnWarning, 
  availableGstRates = [0, 5, 12, 18, 28]
}) => {
  return (
    <div className="space-y-10">
      {/* Basic Details */}
      <FormSection title="Basic Details" description="Primary identification for this item">
        <div className="md:col-span-2">
          <FormField label="Product Name" required>
            <Input 
              required 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={onChange} 
              placeholder="e.g. Paracetamol 500mg" 
              icon={<Package size={18} className="text-slate-400" />}
            />
          </FormField>
        </div>
        
        <FormField label="SKU / Item Code" required helperText="Internal tracking identifier">
          <Input 
            required 
            type="text" 
            name="sku" 
            value={formData.sku} 
            onChange={onChange} 
            placeholder="e.g. MED-001" 
            icon={<Tag size={18} className="text-slate-400" />}
          />
        </FormField>

        <FormField label="Category">
          <Input 
            type="text" 
            name="category" 
            value={formData.category} 
            onChange={onChange} 
            placeholder="e.g. Tablets" 
            icon={<Layers size={18} className="text-slate-400" />}
          />
        </FormField>

        <FormField label="Inventory Unit">
          <Select name="unit" value={formData.unit} onChange={onChange}>
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
            onChange={onChange} 
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Selling Price (₹)">
          <Input 
            type="number" 
            step="0.01" 
            name="sellingPrice" 
            value={formData.sellingPrice} 
            onChange={onChange} 
            placeholder="0.00"
          />
        </FormField>

        <FormField label="MRP (₹)" helperText="Maximum Retail Price">
          <Input 
            type="number" 
            step="0.01" 
            name="mrp" 
            value={formData.mrp} 
            onChange={onChange} 
            placeholder="0.00"
          />
        </FormField>

        <FormField 
          label="HSN Code" 
          error={hsnWarning}
        >
          <Input 
            type="text" 
            name="hsnCode" 
            value={formData.hsnCode} 
            onChange={onChange} 
            placeholder="8 digit code"
            className={hsnWarning ? 'border-amber-300 bg-amber-50/50' : ''}
          />
        </FormField>

        <FormField label="GST Rate (%)">
          <Select 
            name="gstRate" 
            value={formData.gstRate} 
            onChange={onChange}
          >
            {availableGstRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate}% {rate === 0 ? '(Exempt)' : ''}
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
            onChange={onChange} 
            placeholder="0"
          />
        </FormField>

        <FormField label="Min. Alert Level" helperText="Warn when stock falls below this">
          <Input 
            type="number" 
            name="minStockLevel" 
            value={formData.minStockLevel} 
            onChange={onChange} 
            placeholder="10"
          />
        </FormField>

        <FormField label="Storage Location">
          <Input 
            type="text" 
            name="location" 
            value={formData.location} 
            onChange={onChange} 
            placeholder="e.g. Rack A1, Shelf 3" 
            icon={<MapPin size={18} className="text-slate-400" />}
          />
        </FormField>
      </FormSection>
    </div>
  );
};

export default GenericProductForm;
