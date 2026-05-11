import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from 'lucide-react';
import { getCroppedImg } from '../../utils/imageUtils';
import Modal from '../Modal';

interface CropModalProps {
  image: string;
  aspect: number;
  onCropComplete: (croppedImage: Blob) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export default function CropModal({ image, aspect, onCropComplete, onClose, isProcessing }: CropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onZoomChange = (zoomValue: number) => {
    setZoom(zoomValue);
  };

  const onCropCompleteCallback = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Crop & Scale</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Adjust your image display</p>
        </div>
      }
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRotation((r) => r - 90)}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95 cursor-pointer"
              title="Rotate Left"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setRotation((r) => r + 90)}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-all active:scale-95 cursor-pointer"
              title="Rotate Right"
            >
              <RotateCcw className="w-5 h-5 scale-x-[-1]" />
            </button>
            <div className="px-4 py-3 bg-slate-50 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest">
              {rotation}°
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isProcessing ? 'Processing...' : 'Apply Crop'}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[60vh] min-h-[400px]">
        {/* Cropper Area */}
        <div className="flex-1 relative bg-slate-50 overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        {/* Controls */}
        <div className="px-8 py-6">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-slate-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
            <ZoomIn className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
