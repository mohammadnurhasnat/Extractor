const fs = require('fs');

// 1. Theme toggle and Logout button in Header.tsx
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
// Theme toggle border radius: change rounded-[8px] to rounded-[5px]
header = header.replace(/rounded-\[8px\]/g, 'rounded-[5px]');
// Logout button red
header = header.replace(/slide-btn-orange p-1\.5/g, 'slide-btn-red p-1.5');
header = header.replace(/slide-btn-teal p-1\.5/g, 'slide-btn-red p-1.5');
fs.writeFileSync('src/components/Header.tsx', header);

// LogoutConfirmModal.tsx
let logoutModal = fs.readFileSync('src/components/LogoutConfirmModal.tsx', 'utf8');
logoutModal = logoutModal.replace(/slide-btn-orange flex-1/g, 'slide-btn-red flex-1');
logoutModal = logoutModal.replace(/slide-btn-teal flex-1/g, 'slide-btn-red flex-1');
fs.writeFileSync('src/components/LogoutConfirmModal.tsx', logoutModal);

// 2. Crisp Teal in PassportDataTab.tsx (re-apply teal)
let passportData = fs.readFileSync('src/components/PassportDataTab.tsx', 'utf8');
passportData = passportData.replace(/from-amber-500\/10 via-amber-500\/5 to-orange-500\/5/g, 'from-teal-500/10 via-teal-500/5 to-emerald-500/5');
passportData = passportData.replace(/dark:from-amber-950\/30 dark:via-amber-950\/20 dark:to-orange-950\/10/g, 'dark:from-teal-950/30 dark:via-teal-950/20 dark:to-emerald-950/10');
passportData = passportData.replace(/border-amber-500 dark:border-amber-500\/60/g, 'border-teal-500 dark:border-teal-500/60');
passportData = passportData.replace(/shadow-\[0_4px_25px_rgba\(245,158,11,0\.12\)\]/g, 'shadow-[0_4px_25px_rgba(20,184,166,0.12)]');
passportData = passportData.replace(/from-amber-500 to-orange-500/g, 'from-teal-500 to-emerald-500');
passportData = passportData.replace(/dark:from-amber-600 dark:to-orange-600/g, 'dark:from-teal-600 dark:to-emerald-600');
passportData = passportData.replace(/bg-amber-500/g, 'bg-teal-500');
passportData = passportData.replace(/text-amber-650/g, 'text-teal-600');
passportData = passportData.replace(/text-amber-400/g, 'text-teal-400');
passportData = passportData.replace(/border-amber-200\/50/g, 'border-teal-200/50');
passportData = passportData.replace(/shadow-amber-500\/50/g, 'shadow-teal-500/50');
fs.writeFileSync('src/components/PassportDataTab.tsx', passportData);

// Also replace orange slide btn with teal where requested
passportData = fs.readFileSync('src/components/PassportDataTab.tsx', 'utf8');
passportData = passportData.replace(/slide-btn-orange/g, 'slide-btn-teal');
fs.writeFileSync('src/components/PassportDataTab.tsx', passportData);

// Make some buttons Modern Deep Blue in AdminDashboardModal
let admin = fs.readFileSync('src/components/AdminDashboardModal.tsx', 'utf8');
admin = admin.replace(/slide-btn-orange/g, 'slide-btn-blue');
admin = admin.replace(/slide-btn-teal/g, 'slide-btn-blue');
admin = admin.replace(/slide-btn-slate/g, 'slide-btn-blue');
admin = admin.replace(/slide-btn-purple/g, 'slide-btn-blue');
fs.writeFileSync('src/components/AdminDashboardModal.tsx', admin);

// In AddUserForm.tsx as well
let addUser = fs.readFileSync('src/components/admin/AddUserForm.tsx', 'utf8');
addUser = addUser.replace(/slide-btn-orange/g, 'slide-btn-blue');
addUser = addUser.replace(/slide-btn-teal/g, 'slide-btn-blue');
fs.writeFileSync('src/components/admin/AddUserForm.tsx', addUser);

// 3. Image to PDF Button
let pdfTab = fs.readFileSync('src/components/PassportImagePdfTab.tsx', 'utf8');
// replace class slide-btn slide-btn-teal... with a mix color background and rounded-[10px]
// The button has "slide-btn-teal" usually. Let's find it.
pdfTab = pdfTab.replace(/className="slide-btn slide-btn-teal flex items-center gap-2 px-6 py-3 font-medium rounded-xl/g, 'className="flex items-center gap-2 px-6 py-3 font-bold text-white rounded-[10px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-md transform hover:-translate-y-0.5 active:translate-y-0.5');
pdfTab = pdfTab.replace(/className="slide-btn slide-btn-orange flex items-center gap-2 px-6 py-3 font-medium rounded-xl/g, 'className="flex items-center gap-2 px-6 py-3 font-bold text-white rounded-[10px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-md transform hover:-translate-y-0.5 active:translate-y-0.5');
fs.writeFileSync('src/components/PassportImagePdfTab.tsx', pdfTab);

