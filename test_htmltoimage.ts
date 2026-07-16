import fs from 'fs';

let content = fs.readFileSync('src/padgen/PadgenApp.tsx', 'utf8');

// Remove the lines that change wrapper.style.cssText
content = content.replace(/const orig = wrapper\.style\.cssText;\n\s*wrapper\.style\.cssText = 'position: fixed; left: 0; top: 0; z-index: -999;';/g, '');
content = content.replace(/wrapper\.style\.cssText = orig;/g, '');

fs.writeFileSync('src/padgen/PadgenApp.tsx', content);
