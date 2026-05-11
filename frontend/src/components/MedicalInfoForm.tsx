import React from 'react';
import FormField from './ui/FormField';
import Textarea from './ui/Textarea';
import { ClipboardList, LifeBuoy, AlertCircle, Info, Activity, ShieldAlert } from 'lucide-react';

interface MedicalInfoFormProps {
  data: {
    medicalDescription: string;
    uses: string;
    contraindications: string;
    sideEffects: string;
    precautions: string;
    dosageInfo: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const MedicalInfoForm: React.FC<MedicalInfoFormProps> = ({ data, onChange }) => {
  
  const handleBulletInput = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLTextAreaElement;
      const { selectionStart, selectionEnd, value } = target;

      // Only add bullet if the line isn't empty or if we want to start a new bullet
      const lines = value.substring(0, selectionStart).split('\n');
      const currentLine = lines[lines.length - 1];

      if (currentLine.startsWith('- ')) {
        e.preventDefault();
        const newValue = value.substring(0, selectionStart) + '\n- ' + value.substring(selectionEnd);
        
        // Manual trigger of change since we're preventing default
        const event = {
          target: {
            name: target.name,
            value: newValue
          }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        onChange(event);

        // Reset cursor position after React render
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = selectionStart + 3;
        }, 0);
      } else if (currentLine.trim() !== '' && !currentLine.startsWith('- ')) {
        // Optional: auto-convert first line to bullet if user hits enter? 
        // Let's keep it simple: if they start with "- ", we continue it.
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="md:col-span-2">
        <FormField 
          label="Medical Description" 
          helperText="General overview of the drug's composition and class."
        >
          <div className="relative">
            <Textarea 
              name="medicalDescription"
              value={data.medicalDescription}
              onChange={onChange}
              placeholder="e.g. Amoxicillin and Clavulanate Potassium is a combination penicillin-type antibiotic..."
              className="min-h-[100px] pl-11"
            />
            <Info className="absolute top-3.5 left-4 text-slate-400" size={18} />
          </div>
        </FormField>
      </div>

      <FormField 
        label="Indications & Uses" 
        helperText="List primary conditions this medication treats."
      >
        <div className="relative">
          <Textarea 
            name="uses"
            value={data.uses}
            onChange={onChange}
            onKeyDown={handleBulletInput}
            placeholder="Start with '- ' for bullets..."
            className="min-h-[120px] pl-11"
          />
          <Activity className="absolute top-3.5 left-4 text-indigo-400" size={18} />
        </div>
      </FormField>

      <FormField 
        label="Dosage & Administration" 
        helperText="Standard dosage instructions for different age groups."
      >
        <div className="relative">
          <Textarea 
            name="dosageInfo"
            value={data.dosageInfo}
            onChange={onChange}
            onKeyDown={handleBulletInput}
            placeholder="e.g. 1 tablet twice daily after meals..."
            className="min-h-[120px] pl-11"
          />
          <ClipboardList className="absolute top-3.5 left-4 text-blue-400" size={18} />
        </div>
      </FormField>

      <FormField 
        label="Side Effects" 
        helperText="Common and rare adverse reactions."
      >
        <div className="relative">
          <Textarea 
            name="sideEffects"
            value={data.sideEffects}
            onChange={onChange}
            onKeyDown={handleBulletInput}
            placeholder="Start with '- ' to list side effects..."
            className="min-h-[120px] pl-11 border-amber-200 focus:border-amber-500 focus:ring-amber-50"
          />
          <LifeBuoy className="absolute top-3.5 left-4 text-amber-500" size={18} />
        </div>
      </FormField>

      <FormField 
        label="Contraindications" 
        helperText="Circumstances where this drug should NOT be used."
      >
        <div className="relative">
          <Textarea 
            name="contraindications"
            value={data.contraindications}
            onChange={onChange}
            onKeyDown={handleBulletInput}
            placeholder="e.g. Hypersensitivity to penicillin..."
            className="min-h-[120px] pl-11 border-rose-200 focus:border-rose-500 focus:ring-rose-50"
          />
          <ShieldAlert className="absolute top-3.5 left-4 text-rose-500" size={18} />
        </div>
      </FormField>

      <div className="md:col-span-2">
        <FormField 
          label="Precautions & Warnings" 
          helperText="Critical safety information and monitoring requirements."
        >
          <div className="relative">
            <Textarea 
              name="precautions"
              value={data.precautions}
              onChange={onChange}
              onKeyDown={handleBulletInput}
              placeholder="List critical warnings here..."
              className="min-h-[100px] pl-11 bg-slate-50 border-dashed"
            />
            <AlertCircle className="absolute top-3.5 left-4 text-slate-500" size={18} />
          </div>
        </FormField>
      </div>
    </div>
  );
};

export default MedicalInfoForm;
