import React, { useState, useEffect } from 'react';
import { Users, X, ShieldCheck, History, UserPlus, BarChart3, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { UsersTable } from './admin/UsersTable';
import { AuditLogsTable } from './admin/AuditLogsTable';
import { AddUserForm } from './admin/AddUserForm';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { SystemSettingsTab } from './admin/SystemSettingsTab';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  setToast: (toast: any) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose, currentUser, setToast }) => {
  useLockBodyScroll(isOpen);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'analytics' | 'settings'>('analytics');
  
  // Users State
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState<string | null>(null);
  const [isAdminAddingUser, setIsAdminAddingUser] = useState(false);
  
  // Add User State
  const [newUserName, setNewUserName] = useState('');
  const [newUserMobileNumber, setNewUserMobileNumber] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  // User Detail / Edit State
  const [selectedUserForModal, setSelectedUserForModal] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingSelectedUser, setIsEditingSelectedUser] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserMobileNumber, setEditUserMobileNumber] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserDailyLimit, setEditUserDailyLimit] = useState(5);
  const [isUpdatingUserDetail, setIsUpdatingUserDetail] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      if (activeTab === 'users') {
        fetchAdminUsers(false);
      } else if (activeTab === 'audit') {
        fetchAuditLogs(false);
      } else if (activeTab === 'analytics') {
        fetchAdminUsers(false);
        fetchAuditLogs(false);
      }

      // Silent event listener: Syncs data quietly in background when any user/admin takes action
      const handleSilentSync = () => {
        if (activeTab === 'users' || activeTab === 'analytics') {
          fetchAdminUsers(true);
        }
        if (activeTab === 'audit' || activeTab === 'analytics') {
          fetchAuditLogs(true);
        }
      };

      window.addEventListener('app_action_logged', handleSilentSync);

      // Connect Real-Time SSE Event Listener directly to backend DB changes
      let eventSource: EventSource | null = null;
      try {
        eventSource = new EventSource('/api/admin/events');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'DB_CHANGE' || data.type === 'DATA_UPDATED') {
              handleSilentSync();
            }
          } catch (e) {
            console.error('Realtime SSE event parse error:', e);
          }
        };
      } catch (err) {
        console.warn('SSE EventSource setup error:', err);
      }

      return () => {
        window.removeEventListener('app_action_logged', handleSilentSync);
        if (eventSource) {
          eventSource.close();
        }
      };
    }
  }, [isOpen, activeTab, currentUser]);

  const fetchAdminUsers = async (silent = false) => {
    if (!silent) setIsLoadingUsers(true);
    setAdminUsersError(null);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(result.users);
      } else {
        setAdminUsersError(result.error || 'Failed to fetch registered users.');
      }
    } catch (err) {
      setAdminUsersError('Network error while fetching registered users.');
    } finally {
      if (!silent) setIsLoadingUsers(false);
    }
  };

  const fetchAuditLogs = async (silent = false) => {
    if (!silent) setIsLoadingLogs(true);
    try {
      const response = await fetch('/api/admin/audit-logs', {
        headers: { 
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAuditLogs(result.logs);
      } else {
        if (!silent) setToast({ message: result.error || 'Failed to fetch audit logs.', type: 'error' });
      }
    } catch (err) {
      if (!silent) setToast({ message: 'Network error fetching logs.', type: 'error' });
    } finally {
      if (!silent) setIsLoadingLogs(false);
    }
  };

  const handleUpdateUserLimit = async (userId: string, newLimit: number) => {
    try {
      const response = await fetch('/api/admin/update-user-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({ userId, newLimit })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, dailyLimit: newLimit } : u));
        setToast({ message: 'User limit updated successfully!', type: 'success' });
      } else {
        setToast({ message: result.error || 'Failed to update user limit.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleToggleSuspendUser = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/toggle-suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({ userId, isSuspended: !currentStatus })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
        setToast({ 
          message: !currentStatus 
            ? 'User suspended successfully!' 
            : 'User unsuspended successfully!', 
          type: 'success' 
        });
      } else {
        setToast({ message: result.error || 'Failed to toggle suspension.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.filter(u => u.id !== userId));
        setToast({ message: 'User deleted successfully!', type: 'success' });
      } else {
        setToast({ message: result.error || 'Failed to delete user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserMobileNumber || !newUserPassword) {
      setToast({ message: 'Name, Mobile Number, and Passcode are required.', type: 'error' });
      return;
    }

    setIsSavingUser(true);
    try {
      const response = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          name: newUserName,
          mobileNumber: newUserMobileNumber,
          email: newUserEmail,
          password: newUserPassword
        })
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setToast({ message: 'New user added successfully!', type: 'success' });
        setNewUserName('');
        setNewUserMobileNumber('');
        setNewUserEmail('');
        setNewUserPassword('');
        setIsAdminAddingUser(false);
        fetchAdminUsers();
      } else {
        setToast({ message: result.error || 'Failed to add user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleOpenUserDetailModal = (user: any) => {
    setSelectedUserForModal(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email || '');
    setEditUserMobileNumber(user.mobileNumber);
    setEditUserPassword(user.password);
    setEditUserDailyLimit(user.dailyLimit ?? 5);
    setIsEditingSelectedUser(false);
    setShowDeleteConfirm(false);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForModal) return;
    
    setIsUpdatingUserDetail(true);
    try {
      const response = await fetch('/api/admin/edit-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          userId: selectedUserForModal.id,
          name: editUserName,
          email: editUserEmail,
          mobileNumber: editUserMobileNumber,
          password: editUserPassword,
          dailyLimit: editUserDailyLimit
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setToast({ message: 'User updated successfully!', type: 'success' });
        setSelectedUserForModal({
          ...selectedUserForModal,
          name: editUserName,
          email: editUserEmail,
          mobileNumber: editUserMobileNumber,
          password: editUserPassword,
          dailyLimit: editUserDailyLimit
        });
        setIsEditingSelectedUser(false);
        fetchAdminUsers();
      } else {
        setToast({ message: result.error || 'Failed to update user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setIsUpdatingUserDetail(false);
    }
  };

  const handleDeleteFromPopup = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUserForModal) return;
    const userId = selectedUserForModal.id;
    
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.filter(u => u.id !== userId));
        setToast({ message: 'User deleted successfully!', type: 'success' });
        setSelectedUserForModal(null);
        setShowDeleteConfirm(false);
      } else {
        setToast({ message: result.error || 'Failed to delete user.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleToggleSuspendFromPopup = async () => {
    if (!selectedUserForModal) return;
    const userId = selectedUserForModal.id;
    const currentStatus = !!selectedUserForModal.isSuspended;
    try {
      const response = await fetch('/api/admin/toggle-suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-email': currentUser?.email || ''
        },
        body: JSON.stringify({ userId, isSuspended: !currentStatus })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdminUsersList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !currentStatus } : u));
        setSelectedUserForModal(prev => prev ? { ...prev, isSuspended: !currentStatus } : null);
        setToast({ message: 'Status updated successfully!', type: 'success' });
      } else {
        setToast({ message: result.error || 'Failed to toggle suspension.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Network error. Please try again.', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.35 }}
          className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.25)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-3xl rounded-[5px] text-black dark:text-white"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
          
          {/* Header */}
          <div className="p-3 border-b border-slate-100 dark:border-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/60 dark:bg-zinc-950/60 relative z-10">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-[3px] text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm tracking-tight text-black dark:text-white uppercase whitespace-nowrap">
                  Admin Dashboard
                </h3>
              </div>
              
              <div className="flex gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded overflow-x-auto max-w-full scrollbar-none flex-nowrap shrink-0">
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-2.5 py-1 text-xs font-bold rounded whitespace-nowrap flex items-center gap-1 shrink-0 transition-colors ${activeTab === 'analytics' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-2.5 py-1 text-xs font-bold rounded whitespace-nowrap flex items-center gap-1 shrink-0 transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-2.5 py-1 text-xs font-bold rounded whitespace-nowrap flex items-center gap-1 shrink-0 transition-colors ${activeTab === 'audit' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Logs</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-2.5 py-1 text-xs font-bold rounded whitespace-nowrap flex items-center gap-1 shrink-0 transition-colors ${activeTab === 'settings' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>System Settings</span>
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:relative md:top-auto md:right-auto p-1.5 rounded-[3px] hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-400 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 h-[60vh] overflow-y-auto relative z-10">
            {activeTab === 'analytics' ? (
              <AnalyticsTab
                users={adminUsersList}
                logs={auditLogs}
                onRefresh={() => {
                  fetchAdminUsers();
                  fetchAuditLogs();
                }}
                isLoading={isLoadingUsers || isLoadingLogs}
              />
            ) : activeTab === 'users' ? (
              isAdminAddingUser ? (
                <AddUserForm
                  newUserName={newUserName}
                  setNewUserName={setNewUserName}
                  newUserMobileNumber={newUserMobileNumber}
                  setNewUserMobileNumber={setNewUserMobileNumber}
                  newUserEmail={newUserEmail}
                  setNewUserEmail={setNewUserEmail}
                  newUserPassword={newUserPassword}
                  setNewUserPassword={setNewUserPassword}
                  isSavingUser={isSavingUser}
                  onCancel={() => setIsAdminAddingUser(false)}
                  onSubmit={handleAddUserSubmit}
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest">
                      Existing Users
                    </h3>
                    <button onClick={() => setIsAdminAddingUser(true)} className="slide-btn slide-btn-blue px-3 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center justify-center gap-1.5">
                      <span className="relative z-10 flex items-center gap-1.5">
                        <UserPlus className="w-3 h-3" />
                        <span>Add New User</span>
                      </span>
                    </button>
                  </div>
                  <UsersTable
                    users={adminUsersList}
                    isLoading={isLoadingUsers}
                    error={adminUsersError}
                    onUpdateLimit={handleUpdateUserLimit}
                    onToggleSuspend={handleToggleSuspendUser}
                    onDelete={handleDeleteUser}
                    onSelectUser={handleOpenUserDetailModal}
                  />
                </div>
              )
            ) : activeTab === 'audit' ? (
              <AuditLogsTable
                logs={auditLogs}
                isLoading={isLoadingLogs}
                onRefresh={fetchAuditLogs}
              />
            ) : (
              <SystemSettingsTab
                currentUser={currentUser}
                onToast={(toastObj) => setToast(toastObj)}
                usersCount={adminUsersList.length}
                logsCount={auditLogs.length}
              />
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedUserForModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-zinc-950 shadow-[0_32px_64px_rgba(30,41,59,0.3)] border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden w-full max-w-md rounded-[5px]"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-3.5 border-b border-slate-100 dark:border-zinc-900 flex justify-between bg-white/60 dark:bg-zinc-950/60">
                <h3 className="font-extrabold text-xs uppercase">{isEditingSelectedUser ? 'Edit User' : 'User Information'}</h3>
                <button onClick={() => setSelectedUserForModal(null)} className="p-1"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 max-h-[70vh] overflow-y-auto">
                {isEditingSelectedUser ? (
                  <form onSubmit={handleEditUserSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                        <input type="text" required value={editUserName} onChange={e => setEditUserName(e.target.value)} className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile</label>
                        <input type="text" required value={editUserMobileNumber} onChange={e => setEditUserMobileNumber(e.target.value)} className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                        <input type="email" value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Passcode</label>
                        <input type="text" required value={editUserPassword} onChange={e => setEditUserPassword(e.target.value)} className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Daily Limit</label>
                        <input type="number" required value={editUserDailyLimit} onChange={e => setEditUserDailyLimit(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-[5px] text-xs bg-white dark:bg-black/40 border-slate-200 dark:border-zinc-800 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <button type="button" onClick={() => setIsEditingSelectedUser(false)} className="px-4 py-2 text-xs font-bold">Cancel</button>
                      <button type="submit" disabled={isUpdatingUserDetail} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-[5px]">Save</button>
                    </div>
                  </form>
                ) : showDeleteConfirm ? (
                  <div className="space-y-4 py-4 text-center">
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      Are you sure you want to delete this user?
                    </p>
                    <p className="text-xs text-rose-500 font-extrabold bg-rose-500/10 py-1.5 px-4 rounded-full inline-block">
                      {selectedUserForModal.name}
                    </p>
                    <div className="flex gap-3 justify-center pt-4">
                      <button
                        onClick={confirmDeleteUser}
                        className="px-6 py-2 rounded-xl font-extrabold text-xs uppercase bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-6 py-2 rounded-xl font-extrabold text-xs uppercase bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="font-bold">{selectedUserForModal.name}</h4>
                    <p className="text-xs font-mono">{selectedUserForModal.id}</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div><span className="block font-bold text-[10px] uppercase text-slate-400">Mobile</span>{selectedUserForModal.mobileNumber}</div>
                      <div><span className="block font-bold text-[10px] uppercase text-slate-400">Email</span>{selectedUserForModal.email || 'None'}</div>
                      <div><span className="block font-bold text-[10px] uppercase text-slate-400">Passcode</span>{selectedUserForModal.password}</div>
                      <div><span className="block font-bold text-[10px] uppercase text-slate-400">Daily Limit</span>{selectedUserForModal.dailyLimit ?? 5}</div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-zinc-900">
                      <button 
                        onClick={handleDeleteFromPopup} 
                        className="flex-1 py-2.5 rounded-xl font-extrabold text-xs bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm transition-colors"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={handleToggleSuspendFromPopup} 
                        className="flex-1 py-2.5 rounded-xl font-extrabold text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-300 border border-red-200 dark:border-red-900 transition-colors"
                      >
                        {selectedUserForModal.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                      <button 
                        onClick={() => setIsEditingSelectedUser(true)} 
                        className="flex-1 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
