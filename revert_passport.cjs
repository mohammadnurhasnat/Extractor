const fs = require('fs');

let file = fs.readFileSync('src/components/PassportDataTab.tsx', 'utf8');

file = file.replace(/from-teal-500\/10 via-teal-500\/5 to-emerald-500\/5/g, 'from-amber-500/10 via-amber-500/5 to-orange-500/5');
file = file.replace(/dark:from-teal-950\/30 dark:via-teal-950\/20 dark:to-emerald-950\/10/g, 'dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/10');
file = file.replace(/border-teal-500 dark:border-teal-500\/60/g, 'border-amber-500 dark:border-amber-500/60');
file = file.replace(/shadow-\[0_4px_25px_rgba\(20,184,166,0\.12\)\]/g, 'shadow-[0_4px_25px_rgba(245,158,11,0.12)]');
file = file.replace(/from-teal-500 to-emerald-500/g, 'from-amber-500 to-orange-500');
file = file.replace(/dark:from-teal-600 dark:to-emerald-600/g, 'dark:from-amber-600 dark:to-orange-600');
file = file.replace(/bg-teal-500/g, 'bg-amber-500');
file = file.replace(/text-teal-600/g, 'text-amber-650');
file = file.replace(/text-teal-400/g, 'text-amber-400');
file = file.replace(/border-teal-200\/50/g, 'border-amber-200/50');
file = file.replace(/shadow-teal-500\/50/g, 'shadow-amber-500/50');

fs.writeFileSync('src/components/PassportDataTab.tsx', file);
