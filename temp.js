const fs = require('fs');
let code = fs.readFileSync('server_modules/extraction.ts', 'utf8');

// The sed command ruined all "import { "
// I will just download the original again or fix it using regex.
// Wait, I can just replace the first 19 lines.
