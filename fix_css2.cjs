const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace(/\.slide-btn-teal:hover, \.slide-btn-teal-alt:hover/g, '.slide-btn-teal:hover');
css = css.replace(/\.slide-btn-teal:active, \.slide-btn-teal-alt:active, \.slide-btn-teal\.active, \.slide-btn-teal-alt\.active/g, '.slide-btn-teal:active,\n.slide-btn-teal.active');
css = css.replace(/\.dark \.slide-btn-teal, \.dark \.slide-btn-teal-alt/g, '.dark .slide-btn-teal');
css = css.replace(/\.dark \.slide-btn-teal:hover, \.dark \.slide-btn-teal-alt:hover/g, '.dark .slide-btn-teal:hover');
css = css.replace(/\.dark \.slide-btn-teal:active, \.dark \.slide-btn-teal-alt:active, \.dark \.slide-btn-teal\.active, \.dark \.slide-btn-teal-alt\.active/g, '.dark .slide-btn-teal:active,\n.dark .slide-btn-teal.active');

// Ensure terracotta style has both orange and teal.
// I should just restore the exact original lines.
css = css.replace(/\.slide-btn-teal {\n  background-color/g, '.slide-btn-orange,\n.slide-btn-teal {\n  background-color');
css = css.replace(/\.slide-btn-teal:hover {\n  background-color/g, '.slide-btn-orange:hover,\n.slide-btn-teal:hover {\n  background-color');
css = css.replace(/\.slide-btn-teal:active,\n\.slide-btn-teal\.active {\n  background-color/g, '.slide-btn-orange:active,\n.slide-btn-teal:active,\n.slide-btn-orange.active,\n.slide-btn-teal.active {\n  background-color');
css = css.replace(/\.dark \.slide-btn-teal {\n  background-color/g, '.dark .slide-btn-orange,\n.dark .slide-btn-teal {\n  background-color');
css = css.replace(/\.dark \.slide-btn-teal:hover {\n  background-color/g, '.dark .slide-btn-orange:hover,\n.dark .slide-btn-teal:hover {\n  background-color');
css = css.replace(/\.dark \.slide-btn-teal:active,\n\.dark \.slide-btn-teal\.active {\n  background-color/g, '.dark .slide-btn-orange:active,\n.dark .slide-btn-teal:active,\n.dark .slide-btn-orange.active,\n.dark .slide-btn-teal.active {\n  background-color');

fs.writeFileSync('src/index.css', css);
