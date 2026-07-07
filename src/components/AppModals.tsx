import React from 'react';
import { AnimatePresence } from 'motion/react';
import { AdminDashboardModal } from './AdminDashboardModal';
import { ProfileCustomizationModal } from './ProfileCustomizationModal';
import { BackupModal } from './BackupModal';
import { RestoreModal } from './RestoreModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { LoginModal } from './LoginModal';
import { LoginGreeting } from './LoginGreeting';
import { ToastNotification } from './ToastNotification';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { IndianReferenceHelperModal } from './IndianReferenceHelperModal';
import { User, HistoryItem, PassportData } from '../types';

interface AppModalsProps {
  isAdminOpen: boolean;
  setIsAdminOpen: (val: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (val: boolean) => void;
  isBackupOpen: boolean;
  setIsBackupOpen: (val: boolean) => void;
  isRestoreOpen: boolean;
  setIsRestoreOpen: (val: boolean) => void;
  isLogoutConfirmOpen: boolean;
  setIsLogoutConfirmOpen: (val: boolean) => void;
  currentUser: User | null;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[]) => void;
  handleLogout: () => void;
  profilePicture: string | null;
  onSaveProfilePicture: (dataUrl: string) => void;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
  itemToDelete: string | null;
  cancelDelete: (e: React.MouseEvent) => void;
  executeDelete: (e: React.MouseEvent, id?: string) => void;
  loginIdentifier: string;
  setLoginIdentifier: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  handleLogin: (e: React.FormEvent) => void;
  showLoginGreeting: boolean;
  setShowLoginGreeting: (val: boolean) => void;
  isRefHelperOpen: boolean;
  setIsRefHelperOpen: (val: boolean) => void;
  utPurpose?: string;
}

export function AppModals({
  isAdminOpen,
  setIsAdminOpen,
  isProfileOpen,
  setIsProfileOpen,
  isBackupOpen,
  setIsBackupOpen,
  isRestoreOpen,
  setIsRestoreOpen,
  isLogoutConfirmOpen,
  setIsLogoutConfirmOpen,
  currentUser,
  history,
  setHistory,
  handleLogout,
  profilePicture,
  onSaveProfilePicture,
  toast,
  setToast,
  itemToDelete,
  cancelDelete,
  executeDelete,
  loginIdentifier,
  setLoginIdentifier,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoggingIn,
  handleLogin,
  showLoginGreeting,
  setShowLoginGreeting,
  isRefHelperOpen,
  setIsRefHelperOpen,
  utPurpose,
}: AppModalsProps) {
  const helperPurpose = (() => {
    if (!utPurpose) return null;
    if (utPurpose === 'Tourism') return 'Tourism';
    if (utPurpose === 'Business') return 'Business';
    if (utPurpose === 'Medical Treatment - Patient' || utPurpose === 'Medical Treatment - Attendance') return 'Medical';
    if (utPurpose === 'Double Entry') return 'DoubleEntry';
    return null;
  })();
  return (
    <>
      {/* Admin Dashboard Modal */}
      <AdminDashboardModal 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUser={currentUser}
        setToast={setToast}
      />

      {/* Profile Customization Modal */}
      <ProfileCustomizationModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        profilePicture={profilePicture}
        onSaveProfilePicture={onSaveProfilePicture}
      />

      {/* Backup Modal */}
      <AnimatePresence>
        {isBackupOpen && (
          <BackupModal
            isOpen={isBackupOpen}
            onClose={() => setIsBackupOpen(false)}
            history={history}
            setToast={setToast}
          />
        )}
      </AnimatePresence>

      {/* Restore Modal */}
      <AnimatePresence>
        {isRestoreOpen && (
          <RestoreModal
            isOpen={isRestoreOpen}
            onClose={() => setIsRestoreOpen(false)}
            history={history}
            setHistory={setHistory}
            setToast={setToast}
          />
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <LogoutConfirmModal
            isOpen={isLogoutConfirmOpen}
            onClose={() => setIsLogoutConfirmOpen(false)}
            onConfirm={handleLogout}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        itemToDelete={itemToDelete}
        history={history}
        cancelDelete={cancelDelete}
        executeDelete={executeDelete}
      />

      {/* 🔐 LOGIN POPUP WINDOW */}
      <AnimatePresence>
        {!currentUser && (
          <LoginModal
            loginIdentifier={loginIdentifier}
            setLoginIdentifier={setLoginIdentifier}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            loginError={loginError}
            isLoggingIn={isLoggingIn}
            handleLogin={handleLogin}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Login Success Greeting */}
      {currentUser && (
        <LoginGreeting 
          userName={currentUser.name}
          isOpen={showLoginGreeting}
          onClose={() => setShowLoginGreeting(false)}
        />
      )}

      {/* Indian Reference Helper Modal */}
      {helperPurpose && (
        <IndianReferenceHelperModal
          isOpen={isRefHelperOpen}
          onClose={() => setIsRefHelperOpen(false)}
          purpose={helperPurpose}
        />
      )}
    </>
  );
}
