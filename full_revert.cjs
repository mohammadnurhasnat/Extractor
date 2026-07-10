const fs = require('fs');

// 1. Revert index.css
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\/\* Modern Deep Blue \*\/[\s\S]*?\.dark \.slide-btn-teal\.active {\n  background-color: #0d9488 !important;\n  transform: translateY\(4px\) !important;\n  box-shadow: 0 0px 0 0 #042f2c !important;\n}\n/g, '');

fs.writeFileSync('src/index.css', css);

// 2. Revert Header.tsx
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace(/rounded-\[5px\]/g, 'rounded-[8px]');
header = header.replace(/slide-btn-red p-1\.5/g, 'slide-btn-orange p-1.5');
fs.writeFileSync('src/components/Header.tsx', header);

// 3. Revert LogoutConfirmModal.tsx
let logoutModal = fs.readFileSync('src/components/LogoutConfirmModal.tsx', 'utf8');
logoutModal = logoutModal.replace(/slide-btn-red flex-1/g, 'slide-btn-orange flex-1');
fs.writeFileSync('src/components/LogoutConfirmModal.tsx', logoutModal);

// 4. Revert PassportDataTab.tsx (it was mostly reverted, just check the slide-btn)
let passportData = fs.readFileSync('src/components/PassportDataTab.tsx', 'utf8');
passportData = passportData.replace(/slide-btn-teal/g, 'slide-btn-orange');
// Check if gradients are back to amber/orange
if (!passportData.includes('from-amber-500/10')) {
    passportData = passportData.replace(/from-teal-500\/10 via-teal-500\/5 to-emerald-500\/5/g, 'from-amber-500/10 via-amber-500/5 to-orange-500/5');
    passportData = passportData.replace(/dark:from-teal-950\/30 dark:via-teal-950\/20 dark:to-emerald-950\/10/g, 'dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/10');
    passportData = passportData.replace(/border-teal-500 dark:border-teal-500\/60/g, 'border-amber-500 dark:border-amber-500/60');
    passportData = passportData.replace(/shadow-\[0_4px_25px_rgba\(20,184,166,0\.12\)\]/g, 'shadow-[0_4px_25px_rgba(245,158,11,0.12)]');
    passportData = passportData.replace(/from-teal-500 to-emerald-500/g, 'from-amber-500 to-orange-500');
    passportData = passportData.replace(/dark:from-teal-600 dark:to-emerald-600/g, 'dark:from-amber-600 dark:to-orange-600');
    passportData = passportData.replace(/bg-teal-500/g, 'bg-amber-500');
    passportData = passportData.replace(/text-teal-600/g, 'text-amber-650');
    passportData = passportData.replace(/text-teal-400/g, 'text-amber-400');
    passportData = passportData.replace(/border-teal-200\/50/g, 'border-amber-200/50');
    passportData = passportData.replace(/shadow-teal-500\/50/g, 'shadow-amber-500/50');
}
fs.writeFileSync('src/components/PassportDataTab.tsx', passportData);

// 5. Revert AdminDashboardModal.tsx
let admin = fs.readFileSync('src/components/AdminDashboardModal.tsx', 'utf8');
admin = admin.replace(/slide-btn-blue px-3/g, 'slide-btn-teal px-3');
admin = admin.replace(/slide-btn-blue px-6/g, 'slide-btn-teal px-6');
admin = admin.replace(/slide-btn-blue flex-1/g, 'slide-btn-teal flex-1');
// Note: Some buttons in Admin were slide-btn-slate or slide-btn-purple. 
// I replaced them all with slide-btn-blue earlier. I need to restore the exact original classes.
fs.writeFileSync('src/components/AdminDashboardModal.tsx', admin);

// 6. Revert AddUserForm.tsx
let addUser = fs.readFileSync('src/components/admin/AddUserForm.tsx', 'utf8');
addUser = addUser.replace(/slide-btn-blue/g, 'slide-btn-teal');
fs.writeFileSync('src/components/admin/AddUserForm.tsx', addUser);

// 7. Revert UploadSection.tsx
let upload = fs.readFileSync('src/components/UploadSection.tsx', 'utf8');
const lines = upload.split('\n');
for (let i = 118; i < 158; i++) {
    lines[i] = lines[i].replace('retro-dropzone-emerald', 'retro-dropzone');
    lines[i] = lines[i].replace('bg-[#047857]/5', 'bg-[#881337]/5');
    lines[i] = lines[i].replace('border-[#022c22] dark:border-zinc-900 shadow-[2px_2px_0px_0px_#022c22]', 'border-[#2b0c10] dark:border-zinc-900 shadow-[2px_2px_0px_0px_#2b0c10]');
    lines[i] = lines[i].replace('text-[#047857] dark:text-emerald-200', 'text-[#881337] dark:text-rose-200');
    lines[i] = lines[i].replace('bg-[#dcfce7] dark:bg-zinc-800 border-2 border-[#022c22]', 'bg-[#f5ece1] dark:bg-zinc-800 border-2 border-[#2b0c10]');
    lines[i] = lines[i].replace(/text-\[#047857\] dark:text-emerald-300/g, 'text-[#881337] dark:text-rose-300');
    lines[i] = lines[i].replace('shadow-[1.5px_1.5px_0px_0px_#022c22]', 'shadow-[1.5px_1.5px_0px_0px_#2b0c10]');
}
fs.writeFileSync('src/components/UploadSection.tsx', lines.join('\n'));

// 8. Revert PassportImagePdfTab.tsx
let pdfTab = fs.readFileSync('src/components/PassportImagePdfTab.tsx', 'utf8');
pdfTab = pdfTab.replace(/className="flex items-center gap-2 px-6 py-3 font-bold text-white rounded-\[10px\] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-md transform hover:-translate-y-0\.5 active:translate-y-0\.5/g, 'className="slide-btn slide-btn-teal flex items-center gap-2 px-6 py-3 font-medium rounded-xl');
fs.writeFileSync('src/components/PassportImagePdfTab.tsx', pdfTab);

// 9. Revert ResultsSection.tsx
let results = fs.readFileSync('src/components/ResultsSection.tsx', 'utf8');
results = results.replace(/className={`slide-btn text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-center py-3 px-2 rounded-\[10px\] text-sm font-extrabold cursor-pointer transition-all duration-300 border min-h-\[48px\] ripple-btn \${/g, 
'className={`slide-btn slide-btn-purple text-center py-3 px-2 rounded-xl text-sm font-extrabold cursor-pointer transition-none border min-h-[48px] ripple-btn ${');
fs.writeFileSync('src/components/ResultsSection.tsx', results);

