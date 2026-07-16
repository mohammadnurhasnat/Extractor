import fs from 'fs';

let content = fs.readFileSync('src/padgen/PadgenApp.tsx', 'utf8');

// Function string to insert
const applyComputedStyles = `
    const origElements = target.querySelectorAll('*');
    origElements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const comp = window.getComputedStyle(el);
        if (comp.color) el.setAttribute('data-comp-color', comp.color);
        if (comp.backgroundColor) el.setAttribute('data-comp-bg', comp.backgroundColor);
        if (comp.borderColor) el.setAttribute('data-comp-border', comp.borderColor);
        if (comp.fill) el.setAttribute('data-comp-fill', comp.fill);
        if (comp.stroke) el.setAttribute('data-comp-stroke', comp.stroke);
      }
    });
`;

const cleanupComputedStyles = `
      const origElementsClean = target.querySelectorAll('*');
      origElementsClean.forEach((el) => {
        el.removeAttribute('data-comp-color');
        el.removeAttribute('data-comp-bg');
        el.removeAttribute('data-comp-border');
        el.removeAttribute('data-comp-fill');
        el.removeAttribute('data-comp-stroke');
      });
`;

const newOnclone = `(doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const color = el.getAttribute('data-comp-color');
              const bg = el.getAttribute('data-comp-bg');
              const border = el.getAttribute('data-comp-border');
              const fill = el.getAttribute('data-comp-fill');
              const stroke = el.getAttribute('data-comp-stroke');
              
              if (color) el.style.setProperty('color', color, 'important');
              if (bg) el.style.setProperty('background-color', bg, 'important');
              if (border) el.style.setProperty('border-color', border, 'important');
              if (fill) el.style.setProperty('fill', fill, 'important');
              if (stroke) el.style.setProperty('stroke', stroke, 'important');
            }
          });
        }`;

// Let's manually replace it using AST-like regex or by replacing the exact blocks.
content = content.replace(/const canvas = await html2canvas\(target, \{\s*scale: \d+,\s*\/\/ reduced for speed\s*useCORS: true,\s*backgroundColor: '#ffffff',\s*onclone: \([\s\S]*?\}\s*\)\s*\}\s*\);\s*\}\s*\);/g, (match) => {
  return "/* MATCH_REPLACE */\n" + match;
});

// Since the regex replacement is tricky due to the multiline block, let's just do an exact string replace.

const oldOnclone = `onclone: (doc) => {
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

content = content.split(oldOnclone).join(newOnclone);

// Now we need to insert the apply / cleanup.
// For handleDownloadPadPDF
content = content.replace(/(showStatusMessage\('Rendering Pad PDF…'\);\n\s*try \{)/g, "$1\n" + applyComputedStyles);
content = content.replace(/(const fn = `\$\{baseFilename\(\)\}-pad\.pdf`;)/g, cleanupComputedStyles + "\n      $1");

// For handleDownloadCardPDF
content = content.replace(/(showStatusMessage\('Rendering A4 Card Sheet PDF…'\);\n\s*try \{)/g, "$1\n" + applyComputedStyles);
content = content.replace(/(const fn = `\$\{baseFilename\(\)\}-card-a4\.pdf`;)/g, cleanupComputedStyles + "\n      $1");

// For handleDownloadCardPNG
content = content.replace(/(showStatusMessage\('Rendering Card PNG…'\);\n\s*try \{)/g, "$1\n" + applyComputedStyles);
content = content.replace(/(const imgData = canvas\.toDataURL\('image\/png'\);)/g, cleanupComputedStyles + "\n      $1");

// For handleDownloadPadPNG
content = content.replace(/(showStatusMessage\('Rendering Pad PNG…'\);\n\s*try \{)/g, "$1\n" + applyComputedStyles);
content = content.replace(/(const imgData = canvas\.toDataURL\('image\/png'\);)/g, cleanupComputedStyles + "\n      $1");

// For handleExportPSD
content = content.replace(/(showStatusMessage\('Preparing layered document stream…'\);\n\s*try \{)/g, "$1\n" + applyComputedStyles);
content = content.replace(/(canvas\.toBlob\(\(blob\) => \{)/g, cleanupComputedStyles + "\n      $1");


fs.writeFileSync('src/padgen/PadgenApp.tsx', content);
