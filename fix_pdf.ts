import fs from 'fs';

let content = fs.readFileSync('src/padgen/PadgenApp.tsx', 'utf8');

// Replace imports
content = content.replace("import * as htmlToImage from 'html-to-image';", "import html2canvas from 'html2canvas';");

// Common onclone function
const oncloneFunc = `(doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const comp = doc.defaultView?.getComputedStyle(el);
              if (comp) {
                if (comp.color) el.style.setProperty('color', comp.color, 'important');
                if (comp.backgroundColor) el.style.setProperty('background-color', comp.backgroundColor, 'important');
                if (comp.borderColor) el.style.setProperty('border-color', comp.borderColor, 'important');
                if (comp.fill) el.style.setProperty('fill', comp.fill, 'important');
                if (comp.stroke) el.style.setProperty('stroke', comp.stroke, 'important');
              }
            }
          });
        }`;

// Replace htmlToImage calls
// PDF Pad
content = content.replace(/const canvas = await htmlToImage\.toCanvas\(target, \{\s*pixelRatio: 2\.5,\s*backgroundColor: '#ffffff'\s*\}\);/,
`const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: ${oncloneFunc}
      });`);

// PDF Card
content = content.replace(/const canvas = await htmlToImage\.toCanvas\(target, \{\s*pixelRatio: 2\.5,\s*backgroundColor: '#ffffff'\s*\}\);/,
`const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: ${oncloneFunc}
      });`);

// PNG Card
content = content.replace(/const canvas = await htmlToImage\.toCanvas\(target, \{\s*pixelRatio: 4,\s*backgroundColor: '#ffffff'\s*\}\);/,
`const canvas = await html2canvas(target, {
        scale: 3, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: ${oncloneFunc}
      });`);

// PNG Pad
content = content.replace(/const canvas = await htmlToImage\.toCanvas\(target, \{\s*pixelRatio: 2\.5,\s*backgroundColor: '#ffffff'\s*\}\);/,
`const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: ${oncloneFunc}
      });`);
      
// PSD Pad
content = content.replace(/const canvas = await htmlToImage\.toCanvas\(target, \{\s*pixelRatio: 3,\s*backgroundColor: '#ffffff'\s*\}\);/,
`const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: ${oncloneFunc}
      });`);

fs.writeFileSync('src/padgen/PadgenApp.tsx', content);
