import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Check, RefreshCw, ShieldAlert } from 'lucide-react';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email: string; name: string; mobileNumber: string } | null;
  profilePicture: string | null;
  onSaveProfilePicture: (dataUrl: string) => void;
}

export const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  profilePicture,
  onSaveProfilePicture
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const gradientOptions = [
    { name: 'Deep Sea Blue', colors: ['#2563eb', '#1d4ed8', '#1e3a8a'] },
    { name: 'Emerald Forest', colors: ['#10b981', '#059669', '#064e3b'] },
    { name: 'Sunset Crimson', colors: ['#ec4899', '#f43f5e', '#881337'] },
    { name: 'Cyber Orchid', colors: ['#8b5cf6', '#a855f7', '#4c1d95'] },
    { name: 'Gold Rush', colors: ['#f59e0b', '#d97706', '#78350f'] },
    { name: 'Volcanic Ash', colors: ['#4b5563', '#1f2937', '#111827'] }
  ];

  // Stop camera stream on unmount or modal close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 160, height: 160, facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Video play error:", err);
        });
      }
    } catch (err: any) {
      console.error('Failed to access camera:', err);
      setCameraError('ক্যামেরা চালু করতে সমস্যা হয়েছে। দয়া করে ক্যামেরা ব্যবহারের অনুমতি দিন। (Unable to access camera. Please allow permission.)');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 160;
        canvas.height = 160;
        
        // Square center crop logic
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 160, 160);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onSaveProfilePicture(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('দুঃখিত, ফাইলের সাইজ ২ মেগাবাইটের কম হতে হবে। (File size must be under 2MB.)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSaveProfilePicture(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateGradientAvatar = (colors: string[]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 160, 160);
      grad.addColorStop(0, colors[0]);
      if (colors[2]) {
        grad.addColorStop(0.5, colors[1]);
        grad.addColorStop(1, colors[2]);
      } else {
        grad.addColorStop(1, colors[1]);
      }
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 160, 160);
      
      // Initials
      const initials = currentUser 
        ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
        : 'EX';
        
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 55px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Shadow for professional touch
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(initials, 80, 80);
      
      const dataUrl = canvas.toDataURL('image/png');
      onSaveProfilePicture(dataUrl);
    }
  };

  if (!isOpen || !currentUser) return null;

  const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const isAdmin = currentUser.email.toLowerCase() === 'mohammadnurhasnat@gmail.com';

  if (isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md">
        <div className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-sm rounded-[5px] text-black dark:text-white">
          {/* Top Accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
            <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white uppercase">
              ADMIN PROFILE
            </h3>
            <button 
              onClick={onClose}
              className="p-1 rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                  Name (নাম)
                </label>
                <div className="px-3 py-2 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-bold text-slate-800 dark:text-zinc-200">
                  {currentUser.name}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                  Email Address (ইমেইল)
                </label>
                <div className="px-3 py-2 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                  {currentUser.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                  Phone Number (মোবাইল নাম্বার)
                </label>
                <div className="px-3 py-2 border border-slate-100 dark:border-zinc-900/60 bg-slate-50/50 dark:bg-zinc-950/50 rounded-[4px] text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                  {currentUser.mobileNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            <span>Admin Control Panel</span>
            <span>Secured Session</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-md rounded-[5px] text-black dark:text-white">
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

        {/* Header */}
        <div className="p-3.5 border-b border-slate-100 dark:border-zinc-900/80 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 relative z-10">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-xs tracking-tight text-black dark:text-white uppercase">
              PROFILE CUSTOMIZATION
            </h3>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider ${
              isAdmin 
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25' 
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25'
            }`}>
              {isAdmin ? 'System Admin' : 'Verified User'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Section 1: Dynamic Avatar Preview */}
          <div className="flex flex-col items-center justify-center py-2 bg-slate-50/50 dark:bg-zinc-900/10 border border-dashed border-slate-200/60 dark:border-zinc-800/60 rounded-[5px]">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/20 shadow-md">
              {isCameraActive ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl">
                  {initials}
                </div>
              )}
            </div>
            
            <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-2.5">
              {currentUser.name}
            </p>
            <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
              {currentUser.mobileNumber}
            </p>
          </div>

          {/* Section 2: Upload or Camera Interface */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              Method 1: Live Capture or File Upload
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              {isCameraActive ? (
                <button
                  onClick={capturePhoto}
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-[5px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ছবি তুলুন (Capture)</span>
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white border border-zinc-700/80 text-xs font-extrabold rounded-[5px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                  <span>লাইভ ক্যামেরা</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 text-xs font-extrabold rounded-[5px] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                <span>ফাইল আপলোড</span>
              </button>
            </div>

            {isCameraActive && (
              <div className="flex items-center justify-between p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-[5px] text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                <span>📷 ক্যামেরা চালু আছে...</span>
                <button 
                  onClick={stopCamera}
                  className="hover:underline cursor-pointer uppercase"
                >
                  বন্ধ করুন (Cancel)
                </button>
              </div>
            )}

            {cameraError && (
              <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-[5px] text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-start gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Section 3: Generated Gradient Avatars */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              Method 2: Choose Generated Design
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              {gradientOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => generateGradientAvatar(opt.colors)}
                  className="h-14 rounded-[5px] relative overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.97] border border-black/5 dark:border-white/5"
                  style={{
                    background: `linear-gradient(135deg, ${opt.colors[0]} 0%, ${opt.colors[opt.colors.length - 1]} 100%)`
                  }}
                  title={opt.name}
                >
                  <span className="text-white font-extrabold text-sm tracking-widest drop-shadow-sm">
                    {initials}
                  </span>
                  <span className="text-[8px] text-white/70 font-semibold truncate max-w-full px-1 mt-0.5 uppercase">
                    {opt.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer status */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-900/80 bg-white/60 dark:bg-zinc-950/60 relative z-10 flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
          <span>Real-time Customizer</span>
          <span>Click outside or X to exit</span>
        </div>
      </div>
    </div>
  );
};
