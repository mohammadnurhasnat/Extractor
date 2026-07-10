const fs = require('fs');

// 1. UPDATE index.css
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace Terracotta with Crisp Teal
css = css.replace(/TERRACOTTA/g, 'CRISP TEAL');
css = css.replace(/Accent terracotta orange color \(#e05e38\)/g, 'Accent crisp teal color (#0d9488)');
css = css.replace(/Solid 3D bottom shadow \(#9a3412\)/g, 'Solid 3D bottom shadow (#0f766e)');

css = css.replace(/\.slide-btn-orange,\n\.slide-btn-teal {\n  background-color: #e05e38 !important;\n  color: #ffffff !important;\n  border: 1px solid #c24622 !important;\n  border-radius: 12px !important;\n  box-shadow: 0 4px 0 0 #9a3412 !important;\n  transform: translateY\(0\) !important;\n}/g, 
`.slide-btn-orange,
.slide-btn-teal {
  background-color: #0d9488 !important;
  color: #ffffff !important;
  border: 1px solid #0f766e !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #0f766e !important;
  transform: translateY(0) !important;
}`);

css = css.replace(/\.slide-btn-orange:hover,\n\.slide-btn-teal:hover {\n  background-color: #e66b47 !important;\n  transform: translateY\(-1\.5px\) !important;\n  box-shadow: 0 5\.5px 0 0 #9a3412 !important;\n}/g,
`.slide-btn-orange:hover,
.slide-btn-teal:hover {
  background-color: #14b8a6 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #0f766e !important;
}`);

css = css.replace(/\.slide-btn-orange:active,\n\.slide-btn-teal:active,\n\.slide-btn-orange\.active,\n\.slide-btn-teal\.active {\n  background-color: #cd512c !important;\n  transform: translateY\(4px\) !important;\n  box-shadow: 0 0px 0 0 #9a3412 !important;\n}/g,
`.slide-btn-orange:active,
.slide-btn-teal:active,
.slide-btn-orange.active,
.slide-btn-teal.active {
  background-color: #0f766e !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #0f766e !important;
}`);

// Note: there might be a typo in the previous replace for .dark .slide-btn-teal
css = css.replace(/\.dark \.slide-btn-orange,\n\.slide-btn-teal {\n  background-color: #d95c37 !important;\n  color: #ffffff !important;\n  border-color: #9a3412 !important;\n  box-shadow: 0 4px 0 0 rgba\(255, 255, 255, 0\.35\) !important;\n}/g,
`.dark .slide-btn-orange,
.dark .slide-btn-teal {
  background-color: #14b8a6 !important;
  color: #ffffff !important;
  border-color: #0f766e !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}`);

// Handle if it was correct earlier
css = css.replace(/\.dark \.slide-btn-orange,\n\.dark \.slide-btn-teal {\n  background-color: #d95c37 !important;\n  color: #ffffff !important;\n  border-color: #9a3412 !important;\n  box-shadow: 0 4px 0 0 rgba\(255, 255, 255, 0\.35\) !important;\n}/g,
`.dark .slide-btn-orange,
.dark .slide-btn-teal {
  background-color: #14b8a6 !important;
  color: #ffffff !important;
  border-color: #0f766e !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}`);


css = css.replace(/\.dark \.slide-btn-orange:hover,\n\.dark \.slide-btn-teal:hover {\n  background-color: #e06e4b !important;\n  box-shadow: 0 5\.5px 0 0 rgba\(255, 255, 255, 0\.35\) !important;\n}/g,
`.dark .slide-btn-orange:hover,
.dark .slide-btn-teal:hover {
  background-color: #2dd4bf !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}`);

css = css.replace(/\.dark \.slide-btn-orange:active,\n\.dark \.slide-btn-teal:active,\n\.dark \.slide-btn-orange\.active,\n\.dark \.slide-btn-teal\.active {\n  background-color: #c44d28 !important;\n  transform: translateY\(4px\) !important;\n  box-shadow: 0 0px 0 0 #5f1a04 !important;\n}/g,
`.dark .slide-btn-orange:active,
.dark .slide-btn-teal:active,
.dark .slide-btn-orange.active,
.dark .slide-btn-teal.active {
  background-color: #0d9488 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #042f2c !important;
}`);

// Append new styles
const additionalStyles = `
/* Modern Deep Blue */
.slide-btn-blue {
  background-color: #1d4ed8 !important;
  color: #ffffff !important;
  border: 1px solid #1e3a8a !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #1e3a8a !important;
  transform: translateY(0) !important;
}
.slide-btn-blue:hover {
  background-color: #2563eb !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #1e3a8a !important;
}
.slide-btn-blue:active, .slide-btn-blue.active {
  background-color: #1e40af !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #1e3a8a !important;
}
.dark .slide-btn-blue {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border-color: #1e3a8a !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-blue:hover {
  background-color: #3b82f6 !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-blue:active, .dark .slide-btn-blue.active {
  background-color: #1d4ed8 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #0f172a !important;
}

/* Bright Red */
.slide-btn-red {
  background-color: #ef4444 !important;
  color: #ffffff !important;
  border: 1px solid #b91c1c !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #991b1b !important;
  transform: translateY(0) !important;
}
.slide-btn-red:hover {
  background-color: #f87171 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #991b1b !important;
}
.slide-btn-red:active, .slide-btn-red.active {
  background-color: #dc2626 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #991b1b !important;
}
.dark .slide-btn-red {
  background-color: #ef4444 !important;
  color: #ffffff !important;
  border-color: #b91c1c !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-red:hover {
  background-color: #f87171 !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-red:active, .dark .slide-btn-red.active {
  background-color: #dc2626 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #7f1d1d !important;
}

/* Mix Color (Gradient) with 10px Border Radius */
.slide-btn-mix {
  background: linear-gradient(to right, #3b82f6, #6366f1, #a855f7) !important;
  color: #ffffff !important;
  border: 1px solid #4f46e5 !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 0 0 #3730a3 !important;
  transform: translateY(0) !important;
}
.slide-btn-mix:hover {
  background: linear-gradient(to right, #60a5fa, #818cf8, #c084fc) !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #3730a3 !important;
}
.slide-btn-mix:active, .slide-btn-mix.active {
  background: linear-gradient(to right, #2563eb, #4f46e5, #9333ea) !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #3730a3 !important;
}
.dark .slide-btn-mix {
  background: linear-gradient(to right, #3b82f6, #6366f1, #a855f7) !important;
  color: #ffffff !important;
  border-color: #4f46e5 !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-mix:hover {
  background: linear-gradient(to right, #60a5fa, #818cf8, #c084fc) !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-mix:active, .dark .slide-btn-mix.active {
  background: linear-gradient(to right, #2563eb, #4f46e5, #9333ea) !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #312e81 !important;
}
`;

if (!css.includes('.slide-btn-blue')) {
  css += additionalStyles;
}
fs.writeFileSync('src/index.css', css);

// 2. Theme Toggle (Header.tsx)
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');
header = header.replace(/className="slide-btn slide-btn-slate p-1\.5 sm:p-2 rounded-\[8px\]/g, 'className="slide-btn slide-btn-slate p-1.5 sm:p-2 rounded-[5px]');
header = header.replace(/className="slide-btn slide-btn-slate p-1\.5 sm:p-2 rounded-\[5px\]/g, 'className="slide-btn slide-btn-slate p-1.5 sm:p-2 rounded-[5px]'); // Ensure it stays if already changed
fs.writeFileSync('src/components/Header.tsx', header);

// 3. Logout Button Bright Red (Header.tsx & LogoutConfirmModal.tsx)
header = header.replace(/className="slide-btn slide-btn-orange p-1\.5/g, 'className="slide-btn slide-btn-red p-1.5');
header = header.replace(/className="slide-btn slide-btn-teal p-1\.5/g, 'className="slide-btn slide-btn-red p-1.5');
fs.writeFileSync('src/components/Header.tsx', header);

let logoutModal = fs.readFileSync('src/components/LogoutConfirmModal.tsx', 'utf8');
logoutModal = logoutModal.replace(/className="slide-btn slide-btn-orange flex-1/g, 'className="slide-btn slide-btn-red flex-1');
logoutModal = logoutModal.replace(/className="slide-btn slide-btn-teal flex-1/g, 'className="slide-btn slide-btn-red flex-1');
fs.writeFileSync('src/components/LogoutConfirmModal.tsx', logoutModal);

// 4. Some Buttons Modern Deep Blue (AdminDashboardModal.tsx & AddUserForm.tsx)
let admin = fs.readFileSync('src/components/AdminDashboardModal.tsx', 'utf8');
// Let's replace the top "Add New User" button and the "Reset Limits" buttons with slide-btn-blue
admin = admin.replace(/slide-btn-teal px-3/g, 'slide-btn-blue px-3');
admin = admin.replace(/slide-btn-teal px-6/g, 'slide-btn-blue px-6');
fs.writeFileSync('src/components/AdminDashboardModal.tsx', admin);

let addUser = fs.readFileSync('src/components/admin/AddUserForm.tsx', 'utf8');
addUser = addUser.replace(/slide-btn-teal/g, 'slide-btn-blue');
fs.writeFileSync('src/components/admin/AddUserForm.tsx', addUser);

// 5. Mix Color & 10px Radius for "Passport Profile" and "Image to PDF" (ResultsSection.tsx)
let results = fs.readFileSync('src/components/ResultsSection.tsx', 'utf8');
// For Passport Profile
results = results.replace(/className={`slide-btn slide-btn-purple text-center py-3 px-2 rounded-xl text-sm font-extrabold cursor-pointer transition-none border min-h-\[48px\] ripple-btn \${/g,
'className={`slide-btn slide-btn-mix text-center py-3 px-2 rounded-[10px] text-sm font-extrabold cursor-pointer transition-none border min-h-[48px] ripple-btn ${');
fs.writeFileSync('src/components/ResultsSection.tsx', results);

// Update ResultsSection "Image to PDF" button class that is statically defined inside PassportImagePdfTab.tsx too (wait, ResultsSection renders a tab, but PassportImagePdfTab renders the Download button)
let pdfTab = fs.readFileSync('src/components/PassportImagePdfTab.tsx', 'utf8');
pdfTab = pdfTab.replace(/className="slide-btn slide-btn-teal flex items-center gap-2 px-6 py-3 font-medium rounded-xl/g, 'className="slide-btn slide-btn-mix flex items-center gap-2 px-6 py-3 font-bold rounded-[10px]');
pdfTab = pdfTab.replace(/className="slide-btn slide-btn-orange flex items-center gap-2 px-6 py-3 font-medium rounded-xl/g, 'className="slide-btn slide-btn-mix flex items-center gap-2 px-6 py-3 font-bold rounded-[10px]');
fs.writeFileSync('src/components/PassportImagePdfTab.tsx', pdfTab);

console.log('Update script completed successfully!');
