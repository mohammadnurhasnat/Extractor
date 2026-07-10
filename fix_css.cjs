const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\.slide-btn-teal, \.slide-btn-teal-alt/g, '.slide-btn-teal');

fs.writeFileSync('src/index.css', css);
