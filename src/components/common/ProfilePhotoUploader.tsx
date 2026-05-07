import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, X, Check, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImg } from '../../lib/imageUtils';
import { cn } from '../../lib/utils';

interface ProfilePhotoUploaderProps {
  currentImage?: string;
  onImageCropped: (dataUrl: string) => void;
  initials: string;
  className?: string;
  disabled?: boolean;
}

export default function ProfilePhotoUploader({ currentImage, onImageCropped, initials, className, disabled = false }: ProfilePhotoUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const showCroppedImage = async () => {
    try {
      if (image && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
        onImageCropped(croppedImage);
        setIsCropping(false);
        setImage(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <div className="w-full h-full rounded-[2rem] overflow-hidden relative border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02]">
        {currentImage ? (
          <img src={currentImage} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-3xl italic">
            {initials}
          </div>
        )}
        
        {!disabled && (
          <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
            <Camera className="text-white mb-2" size={32} />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Update Photo</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>

      {isCropping && (
        <div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-display italic uppercase tracking-tight">Identity Framing</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Adjust your professional portrait</p>
              </div>
              <button 
                onClick={() => setIsCropping(false)}
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative h-[400px] bg-slate-50">
              <Cropper
                image={image || ''}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                cropShape="round"
                showGrid={false}
              />
            </div>

            <div className="p-8 space-y-8 bg-white">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <ZoomIn size={12} /> Magnification
                    </span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <RotateCw size={12} /> Orientation
                    </span>
                  </div>
                  <input
                    type="range"
                    value={rotation}
                    min={0}
                    max={360}
                    step={1}
                    aria-labelledby="Rotation"
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsCropping(false)}
                  className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition active:scale-95"
                >
                  Discard
                </button>
                <button
                  onClick={showCroppedImage}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Finalize Portrait
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
