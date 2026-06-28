import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Crop, Download, Zap, RefreshCw, Wand2, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { removeBackground } from '@imgly/background-removal';

export function PhotoStudioTab() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // Enhancement states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemoved, setBgRemoved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        resetAdjustments();
      });
      reader.readAsDataURL(file);
    }
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBgRemoved(false);
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleRemoveBg = async () => {
    if (!imageSrc) return;
    setIsRemovingBg(true);
    try {
      // Create a blob from imageSrc
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      const imageBlob = await removeBackground(blob);
      const url = URL.createObjectURL(imageBlob);
      setImageSrc(url);
      setBgRemoved(true);
    } catch (error) {
      console.error("Failed to remove background:", error);
      alert("Background removal failed. Check console for details.");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const drawEnhancedImageToCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;
    
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Standard 2x2 inch at 300DPI is 600x600 pixels
        const TARGET_SIZE = 600;
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;

        // Apply white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply filters
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        // Draw cropped area
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          TARGET_SIZE,
          TARGET_SIZE
        );
        
        resolve(canvas);
      };
    });
  };

  const handleDownload = async () => {
    const canvas = await drawEnhancedImageToCanvas();
    if (canvas) {
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'passport-photo-2x2.jpg';
      a.click();
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Crop className="w-5 h-5 text-purple-500" />
            2x2" Photo Maker
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
            Upload, crop, enhance, and remove background to create a standard 2x2 inch passport photo.
          </p>
        </div>
      </div>

      {!imageSrc ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl p-12 text-center hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group"
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="text-slate-800 dark:text-zinc-200 font-bold mb-2">Upload Portrait Photo</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">JPG, PNG, HEIC up to 10MB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="relative w-full bg-slate-100 dark:bg-black/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 shadow-inner h-[400px] sm:h-[500px]">
              <div className="absolute inset-0 z-0">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1} // 1:1 aspect ratio for 2x2 inch
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={true}
                  style={{
                    containerStyle: {
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Zoom slider */}
            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 min-w-[60px]">Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-5">
              <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Enhancements
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Brightness</label>
                    <span className="text-xs font-medium text-slate-500">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Contrast</label>
                    <span className="text-xs font-medium text-slate-500">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">Color / Saturation</label>
                    <span className="text-xs font-medium text-slate-500">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
              
              <button 
                onClick={resetAdjustments}
                className="mt-2 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 flex items-center justify-center gap-1.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg bg-slate-50 dark:bg-zinc-900 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Adjustments
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4">
               <h3 className="font-bold text-slate-800 dark:text-zinc-200 text-sm uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-emerald-500" />
                AI Tools (WASM)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Background removal runs entirely in your browser using WASM. No images are uploaded to external servers. It applies a clean white background.
              </p>
              <button 
                onClick={handleRemoveBg}
                disabled={isRemovingBg || bgRemoved}
                className={`relative overflow-hidden w-full py-3 rounded-xl font-bold text-xs shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 ${
                  bgRemoved 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' 
                    : isRemovingBg 
                      ? 'bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-zinc-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                }`}
              >
                {isRemovingBg ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Processing AI Model (~40MB)...
                  </>
                ) : bgRemoved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Background Removed
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Remove Background (Auto)
                  </>
                )}
              </button>
            </div>

            <button 
              onClick={handleDownload}
              className="mt-auto w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md shadow-purple-500/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download 2x2" Photo
            </button>
            
            <button 
              onClick={() => {
                setImageSrc(null);
                resetAdjustments();
              }}
              className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center"
            >
              Upload Different Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
