import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import CropModal from './CropModal';
import UploadService from '../../services/UploadService';

interface ImageUploaderProps {
  value?: {
    baseKey: string;
    urls: {
      thumb: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  } | null;
  onChange: (imageKey: string | null) => void;
  type: 'business-logo' | 'user-avatar' | 'product-image' | 'business-banner' | 'category-image' | 'brand-image';
  aspectRatio?: number;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  type,
  aspectRatio = 1,
  label,
  description,
  className = '',
  disabled = false
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB allowed.');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => setSelectedImage(reader.result as string));
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImage(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create a file from the blob
      const file = new File([croppedBlob], 'upload.jpg', { type: 'image/jpeg' });
      
      const result = await UploadService.uploadFile(file, type, (progress) => {
        setUploadProgress(progress);
      });

      onChange(result.key);
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isBanner = type === 'business-banner';
  const displayUrl = value?.urls?.medium || (isBanner ? value?.urls?.xlarge : value?.urls?.medium);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>}
      
      <div className={`relative group ${isBanner ? 'w-full aspect-[21/9]' : 'w-32 h-32'}`}>
        {/* Preview Container */}
        <div className={`
          w-full h-full bg-slate-50 border-2 border-dashed rounded-3xl overflow-hidden transition-all
          ${value ? 'border-blue-100' : 'border-slate-200'}
          ${uploading ? 'opacity-50' : 'group-hover:border-blue-300'}
        `}>
          {value ? (
            <img 
              src={displayUrl} 
              alt="Uploaded" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
              {isBanner ? <ImageIcon size={48} className="opacity-20" /> : <Upload size={32} className="opacity-20" />}
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center z-10">
            <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">{uploadProgress}%</span>
          </div>
        )}

        {/* Action Buttons */}
        {!uploading && !disabled && (
          <div className="absolute -bottom-2 -right-2 flex gap-2">
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-10 h-10 bg-white hover:bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-lg border border-red-50 transition-all active:scale-95"
                title="Remove Image"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95 group-hover:scale-110"
              title={value ? "Change Image" : "Upload Image"}
            >
              <Camera size={18} />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/png, image/jpeg, image/jpg, image/webp"
        />
      </div>

      {description && <p className="text-[10px] text-slate-400 font-medium px-1 uppercase tracking-wider">{description}</p>}

      {/* Crop Modal */}
      {selectedImage && (
        <CropModal
          image={selectedImage}
          aspect={aspectRatio}
          onClose={() => setSelectedImage(null)}
          onCropComplete={handleCropComplete}
          isProcessing={uploading}
        />
      )}
    </div>
  );
}
