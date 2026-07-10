const fs = require('fs');

let file = fs.readFileSync('src/components/UploadSection.tsx', 'utf8');
const lines = file.split('\n');

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
