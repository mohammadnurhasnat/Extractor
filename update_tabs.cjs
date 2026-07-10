const fs = require('fs');

let results = fs.readFileSync('src/components/ResultsSection.tsx', 'utf8');

// Replace slide-btn-purple with the mix color
results = results.replace(/className={`slide-btn slide-btn-purple text-center py-3 px-2 rounded-xl text-sm font-extrabold cursor-pointer transition-none border min-h-\[48px\] ripple-btn \${/g, 
`className={\`slide-btn text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-center py-3 px-2 rounded-[10px] text-sm font-extrabold cursor-pointer transition-all duration-300 border min-h-[48px] ripple-btn \${`);

fs.writeFileSync('src/components/ResultsSection.tsx', results);
