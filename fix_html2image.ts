import fs from 'fs';

let content = fs.readFileSync('src/padgen/PadgenApp.tsx', 'utf8');

// replace import
content = content.replace("import html2canvas from 'html2canvas';", "import * as htmlToImage from 'html-to-image';");

// replace html2canvas with htmlToImage
// Note: we can't just replace the word, we have to refactor the blocks.

const regex = /const canvas = await html2canvas\(target, \{[\s\S]*?\}\);/g;
content = content.replace(regex, (match) => {
  // Extract scale to use as pixelRatio
  const scaleMatch = match.match(/scale:\s*([0-9.]+)/);
  const scale = scaleMatch ? scaleMatch[1] : '2.5';
  
  return `const canvas = await htmlToImage.toCanvas(target, {
        pixelRatio: ${scale},
        backgroundColor: '#ffffff'
      });`;
});

// For handleExportPSD, it uses canvas.toBlob. htmlToImage.toCanvas returns a canvas, so canvas.toBlob will still work.

fs.writeFileSync('src/padgen/PadgenApp.tsx', content);
