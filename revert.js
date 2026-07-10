const fs = require('fs');

// Revert index.css
let indexCss = fs.readFileSync('src/index.css', 'utf8');

// Revert style 1
indexCss = indexCss.replace(/CRISP TEAL/g, 'TERRACOTTA');
indexCss = indexCss.replace(/Accent crisp teal color \(#0d9488\)/g, 'Accent terracotta orange color (#e05e38)');
indexCss = indexCss.replace(/Solid 3D bottom shadow \(#0f766e\)/g, 'Solid 3D bottom shadow (#9a3412)');

indexCss = indexCss.replace(/background-color: #0d9488 !important;/g, 'background-color: #e05e38 !important;');
indexCss = indexCss.replace(/border: 1px solid #0f766e !important;/g, 'border: 1px solid #c24622 !important;');
indexCss = indexCss.replace(/box-shadow: 0 4px 0 0 #0f766e !important;/g, 'box-shadow: 0 4px 0 0 #9a3412 !important;');
indexCss = indexCss.replace(/background-color: #14b8a6 !important;/g, 'background-color: #e66b47 !important;');
indexCss = indexCss.replace(/box-shadow: 0 5.5px 0 0 #0f766e !important;/g, 'box-shadow: 0 5.5px 0 0 #9a3412 !important;');
indexCss = indexCss.replace(/background-color: #0f766e !important;/g, 'background-color: #cd512c !important;');
indexCss = indexCss.replace(/box-shadow: 0 0px 0 0 #0f766e !important;/g, 'box-shadow: 0 0px 0 0 #9a3412 !important;');
indexCss = indexCss.replace(/border-color: #0f766e !important;/g, 'border-color: #9a3412 !important;');
indexCss = indexCss.replace(/background-color: #2dd4bf !important;/g, 'background-color: #e06e4b !important;');
indexCss = indexCss.replace(/box-shadow: 0 0px 0 0 #042f2c !important;/g, 'box-shadow: 0 0px 0 0 #5f1a04 !important;');
indexCss = indexCss.replace(/border-color: #042f2c !important;/g, 'border-color: #5f1a04 !important;');

// In index.css, I also had background-color: #d95c37 !important; for dark mode .slide-btn-orange.
// But now it's background-color: #e66b47 (which was #14b8a6 previously).
// Let's just restore from a clean state or manually fix it.
