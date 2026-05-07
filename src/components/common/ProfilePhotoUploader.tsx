import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  useEffect(() => {
    return () => {
      if (isCropping) {
        window.dispatchEvent(new CustomEvent('mbot-cropping-status', { detail: false }));
      }
    };
  }, [isCropping]);

  const setCroppingStatus = (status: boolean) => {
    setIsCropping(status);
    window.dispatchEvent(new CustomEvent('mbot-cropping-status', { detail: status }));
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setCroppingStatus(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const showCroppedImage = async () => {
    try {
      if (image && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
        onImageCropped(croppedImage);
        setCroppingStatus(false);
        setImage(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative border-4 border-white shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-[1.02]">
        {currentImage ? (
          <img src={currentImage} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 font-black text-4xl italic">
             {initials}
          </div>
        )}
        
        {!disabled && (
          <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer backdrop-blur-[4px]">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3 scale-90 group-hover:scale-100 transition-transform duration-500">
               <Camera className="text-white" size={24} />
            </div>
            <span className="text-white text-[9px] font-black uppercase tracking-[0.2em] translate-y-2 group-hover:translate-y-0 transition-transform duration-500">Update Portrait</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
      </div>

      {isCropping && createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-500 border border-white/10 ring-1 ring-black/5">
            <div className="relative h-[320px] bg-slate-900">
              <button 
                onClick={() => setCroppingStatus(false)}
                className="absolute top-5 right-5 z-[1001] w-9 h-9 bg-black/20 backdrop-blur-xl hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-all hover:rotate-90 border border-white/10 shadow-lg"
              >
                <X size={16} />
              </button>
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

            <div className="p-6 space-y-6 bg-white relative">
              {/* Overlay to ensure no background elements can be seen if there are gaps */}
              <div className="absolute inset-0 bg-white pointer-events-none -z-10"></div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-display italic">
                      <ZoomIn size={10} /> Magnification
                  </span>
                  <span className="text-[10px] font-black text-blue-600 tabular-nums">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:accent-blue-700"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-display italic">
                      <RotateCw size={10} /> Orientation
                  </span>
                  <span className="text-[10px] font-black text-blue-600 tabular-nums">{rotation}°</span>
                </div>
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:accent-blue-700"
                />
              </div>

              <div className="pt-3">
                <button
                  onClick={showCroppedImage}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <Check size={14} className="group-hover:scale-110 transition-transform" /> Confirm Identity Frame
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
