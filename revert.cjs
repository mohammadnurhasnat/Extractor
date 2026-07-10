const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Revert Red Style
css = css.replace(/\/\* Red Style \*\/[\s\S]*?box-shadow: 0 0px 0 0 #7f1d1d !important;\n}\n/g, '');

// Revert Emerald Dropzone
css = css.replace(/\/\* \n   =========================================\n   RETRO-STYLE EMERALD DROPZONE[\s\S]*?box-shadow: 6px 6px 0px 0px #022c22 !important;\n}\n/g, '');

// Revert teal back to orange
css = css.replace(/CRISP TEAL/g, 'TERRACOTTA');
css = css.replace(/Accent crisp teal color \(#0d9488\)/g, 'Accent terracotta orange color (#e05e38)');
css = css.replace(/Solid 3D bottom shadow \(#0f766e\)/g, 'Solid 3D bottom shadow (#9a3412)');

// Original colors:
// .slide-btn-orange { background-color: #e05e38, border: 1px solid #c24622, box-shadow: 0 4px 0 0 #9a3412 }
// hover: background: #e66b47, box-shadow: 0 5.5px 0 0 #9a3412
// active: background: #cd512c, box-shadow: 0 0px 0 0 #9a3412
// dark: background: #d95c37, color: #ffffff, border: #9a3412, shadow: rgba(255,255,255,0.35)
// dark hover: background: #e06e4b
// dark active: background: #c44d28, shadow: #5f1a04

css = css.replace(/\.slide-btn-orange,\n\.slide-btn-teal {\n  background-color: #0d9488 !important;\n  color: #ffffff !important;\n  border: 1px solid #0f766e !important;\n  border-radius: 12px !important;\n  box-shadow: 0 4px 0 0 #0f766e !important;\n  transform: translateY\(0\) !important;\n}/, 
`.slide-btn-orange,
.slide-btn-teal {
  background-color: #e05e38 !important;
  color: #ffffff !important;
  border: 1px solid #c24622 !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #9a3412 !important;
  transform: translateY(0) !important;
}`);

css = css.replace(/\.slide-btn-orange:hover,\n\.slide-btn-teal:hover {\n  background-color: #14b8a6 !important;\n  transform: translateY\(-1\.5px\) !important;\n  box-shadow: 0 5\.5px 0 0 #0f766e !important;\n}/,
`.slide-btn-orange:hover,
.slide-btn-teal:hover {
  background-color: #e66b47 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #9a3412 !important;
}`);

css = css.replace(/\.slide-btn-orange:active,\n\.slide-btn-teal:active,\n\.slide-btn-orange\.active,\n\.slide-btn-teal\.active {\n  background-color: #0f766e !important;\n  transform: translateY\(4px\) !important;\n  box-shadow: 0 0px 0 0 #0f766e !important;\n}/,
`.slide-btn-orange:active,
.slide-btn-teal:active,
.slide-btn-orange.active,
.slide-btn-teal.active {
  background-color: #cd512c !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #9a3412 !important;
}`);

css = css.replace(/\.dark \.slide-btn-orange,\n\.dark \.slide-btn-teal {\n  background-color: #14b8a6 !important;\n  color: #ffffff !important;\n  border-color: #0f766e !important;\n  box-shadow: 0 4px 0 0 rgba\(255, 255, 255, 0\.35\) !important;\n}/,
`.dark .slide-btn-orange,
.dark .slide-btn-teal {
  background-color: #d95c37 !important;
  color: #ffffff !important;
  border-color: #9a3412 !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}`);

css = css.replace(/\.dark \.slide-btn-orange:hover,\n\.dark \.slide-btn-teal:hover {\n  background-color: #2dd4bf !important;\n  box-shadow: 0 5\.5px 0 0 rgba\(255, 255, 255, 0\.35\) !important;\n}/,
`.dark .slide-btn-orange:hover,
.dark .slide-btn-teal:hover {
  background-color: #e06e4b !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}`);

css = css.replace(/\.dark \.slide-btn-orange:active,\n\.dark \.slide-btn-teal:active,\n\.dark \.slide-btn-orange\.active,\n\.dark \.slide-btn-teal\.active {\n  background-color: #0d9488 !important;\n  transform: translateY\(4px\) !important;\n  box-shadow: 0 0px 0 0 #042f2c !important;\n}/,
`.dark .slide-btn-orange:active,
.dark .slide-btn-teal:active,
.dark .slide-btn-orange.active,
.dark .slide-btn-teal.active {
  background-color: #c44d28 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #5f1a04 !important;
}`);

fs.writeFileSync('src/index.css', css);

