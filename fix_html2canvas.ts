import fs from 'fs';

let content = fs.readFileSync('src/padgen/PadgenApp.tsx', 'utf8');

const replacement = `,
        onclone: (doc) => {
          const els = doc.querySelectorAll('*');
          for (let i = 0; i < els.length; i++) {
            const el = els[i] as HTMLElement;
            if (el.style) {
              if (!el.style.color) el.style.setProperty('color', '#000000', 'important');
              if (!el.style.borderColor) el.style.setProperty('border-color', 'transparent', 'important');
              if (!el.style.outlineColor) el.style.setProperty('outline-color', 'transparent', 'important');
              if (!el.style.textDecorationColor) el.style.setProperty('text-decoration-color', 'transparent', 'important');
            }
          }
        }
      });`;

content = content.replace(/useCORS: true,\s*}\);/g, 'useCORS: true' + replacement);

fs.writeFileSync('src/padgen/PadgenApp.tsx', content);
