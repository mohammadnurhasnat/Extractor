const fs = require('fs');

let results = fs.readFileSync('src/components/ResultsSection.tsx', 'utf8');
results = results.replace(/className={`slide-btn slide-btn-mix text-center py-3 px-2 rounded-\[10px\] text-sm font-extrabold cursor-pointer transition-none border min-h-\[48px\] ripple-btn \${/g, 
'className={`slide-btn slide-btn-purple text-center py-3 px-2 rounded-xl text-sm font-extrabold cursor-pointer transition-none border min-h-[48px] ripple-btn ${');
fs.writeFileSync('src/components/ResultsSection.tsx', results);

let pdfTab = fs.readFileSync('src/components/PassportImagePdfTab.tsx', 'utf8');
pdfTab = pdfTab.replace(/className="slide-btn slide-btn-mix flex items-center gap-2 px-6 py-3 font-bold rounded-\[10px\]/g, 
'className="slide-btn slide-btn-teal flex items-center gap-2 px-6 py-3 font-medium rounded-xl');
fs.writeFileSync('src/components/PassportImagePdfTab.tsx', pdfTab);

console.log('Reverted buttons successfully');
