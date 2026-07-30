import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, User as UserIcon, Lock, Phone, Mail, Check, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { User } from '../types';
import { safeFetchJson } from '../utils/api';

interface ProfileCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (updatedUser: User) => void;
  showToast?: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void;
}

export const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  showToast
}) => {
  useLockBodyScroll(isOpen);

  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setMobileNumber(currentUser.mobileNumber || '');
      setProfilePicture(currentUser.profilePicture || null);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const isAdmin = currentUser.email?.toLowerCase() === 'mohammadnurhasnat@gmail.com';

  // Handle image upload and resize to compact base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('অনুগ্রহ করে একটি ছবি নির্বাচন করুন (Please select a valid image file).');
      return;
    }

    // Limit file size before compression (max 10MB input)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('ছবি সর্বোচ্চ ১০ মেগাবাইটের মধ্যে হতে হবে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 300x300 for optimal fast storage
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 300;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProfilePicture(compressedDataUrl);
          setErrorMsg(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('নামের ঘরটি খালি রাখা যাবে না। (Name is required.)');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setErrorMsg('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না! (Passwords do not match.)');
        return;
      }
      if (newPassword.length < 4) {
        setErrorMsg('পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে। (Password must be at least 4 characters.)');
        return;
      }
    }

    setIsLoading(true);

    try {
      // 1. Call Backend API to update profile in PostgreSQL DB
      const payload: any = {
        userId: currentUser.id,
        name: trimmedName,
        mobileNumber: mobileNumber.trim(),
        profilePicture: profilePicture || ''
      };

      if (newPassword) {
        payload.password = newPassword.trim();
      }

      const { ok, data: resData, error } = await safeFetchJson('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!ok || !resData?.success) {
        throw new Error(resData?.error || error || 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে।');
      }

      const updatedUser: User = {
        ...currentUser,
        name: trimmedName,
        mobileNumber: mobileNumber.trim(),
        profilePicture: profilePicture || '',
        ...(newPassword ? { password: newPassword.trim() } : {})
      };

      // Dispatch event for silent background sync in open components
      window.dispatchEvent(new CustomEvent('app_action_logged'));

      // Update local state & localStorage
      localStorage.setItem('passport_extractor_user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);

      if (showToast) {
        showToast({
          message: 'আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে! (Profile updated successfully!)',
          type: 'success'
        });
      }

      onClose();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-zinc-800 flex flex-col my-auto w-full max-w-md rounded-[12px] text-black dark:text-white overflow-hidden">
        {/* Top Accent line */}
        <div className={`h-1.5 w-full ${isAdmin ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`} />

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-[10px] ${isAdmin ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'}`}>
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-zinc-100 uppercase">
                USER PROFILE SETTINGS
              </h3>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                প্রোফাইল ও একাউন্ট তথ্য এডিট করুন
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-200/60 dark:bg-zinc-800/80 hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[8px] text-rose-600 dark:text-rose-400 text-xs font-bold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Profile Photo Section - Frame radius 10px (rounded-[10px]) */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-[10px] border border-slate-200/60 dark:border-zinc-800/80">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
              PROFILE PHOTO (প্রোফাইল ছবি)
            </span>

            <div className="relative group">
              {/* Photo Frame: 10px radius (rounded-[10px]) */}
              <div className="w-24 h-24 rounded-[10px] overflow-hidden border-2 border-indigo-500/40 dark:border-indigo-400/40 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center shadow-md relative">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover rounded-[8px]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                    <UserIcon className="w-10 h-10 mb-1" />
                    <span className="text-[9px] font-bold">No Photo</span>
                  </div>
                )}

                {/* Hover overlay button to change photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[8px] cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[9px] font-bold">Change Photo</span>
                </button>
              </div>

              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{profilePicture ? 'ছবি পরিবর্তন করুন' : 'ছবি যোগ করুন'}</span>
              </button>

              {profilePicture && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-[8px] transition-colors flex items-center gap-1 cursor-pointer border border-rose-500/20"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              )}
            </div>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 text-center">
              ফটো যোগ করার পর সেভ করলে ডাটাবেজে স্থায়ীভাবে সংরক্ষিত থাকবে।
            </p>
          </div>

          {/* Input 1: Name */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Full Name (নাম) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="আপনার নাম লিখুন"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-[8px] text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                required
              />
            </div>
          </div>

          {/* Input 2: Mobile Number */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
              Phone Number (মোবাইল নাম্বার)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-[8px] text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          {/* Email Address (Read-only) */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Email Address (ইমেইল ঠিকানা - অপরিবর্তনযোগ্য)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={currentUser.email || 'N/A'}
                disabled
                className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/60 rounded-[8px] text-xs font-mono font-bold text-slate-500 dark:text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Input 3: Change Password */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 space-y-3">
            <span className="block text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              CHANGE PASSWORD (পাসওয়ার্ড পরিবর্তন)
            </span>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                New Password (নতুন পাসওয়ার্ড)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড পরিবর্তন করতে এখানে লিখুন"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-[8px] text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword.length > 0 && (
              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1">
                  Confirm New Password (পাসওয়ার্ড নিশ্চিত করুন)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-[8px] text-xs font-mono font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-[8px] transition-colors cursor-pointer"
            >
              বাতিল (Cancel)
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-[8px] shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>পরিবর্তন সেভ করুন</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
          <span>{isAdmin ? 'System Administrator' : 'User Account'}</span>
          <span>Secured Sync</span>
        </div>
      </div>
    </div>
  );
};
