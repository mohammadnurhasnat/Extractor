const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Replace .slide-btn-orange with .slide-btn-teal and make it teal
css = css.replace(/\.slide-btn-orange,\n\.slide-btn-teal {/g, '.slide-btn-teal, .slide-btn-teal-alt {');
css = css.replace(/\.slide-btn-orange:hover,\n\.slide-btn-teal:hover {/g, '.slide-btn-teal:hover, .slide-btn-teal-alt:hover {');
css = css.replace(/\.slide-btn-orange:active,\n\.slide-btn-teal:active,\n\.slide-btn-orange\.active,\n\.slide-btn-teal\.active {/g, '.slide-btn-teal:active, .slide-btn-teal-alt:active, .slide-btn-teal.active, .slide-btn-teal-alt.active {');
css = css.replace(/\.dark \.slide-btn-orange,\n\.dark \.slide-btn-teal {/g, '.dark .slide-btn-teal, .dark .slide-btn-teal-alt {');
css = css.replace(/\.dark \.slide-btn-orange:hover,\n\.dark \.slide-btn-teal:hover {/g, '.dark .slide-btn-teal:hover, .dark .slide-btn-teal-alt:hover {');
css = css.replace(/\.dark \.slide-btn-orange:active,\n\.dark \.slide-btn-teal:active,\n\.dark \.slide-btn-orange\.active,\n\.dark \.slide-btn-teal\.active {/g, '.dark .slide-btn-teal:active, .dark .slide-btn-teal-alt:active, .dark .slide-btn-teal.active, .dark .slide-btn-teal-alt.active {');

// We also need to change the colors of .slide-btn-teal to actually be teal in style 1.
// We previously reverted it to terracotta. Let's make a regex to replace it inside that block, or just append a fresh set of classes.
// Actually, it's easier to append new classes and use them in React.

const newStyles = `
/* Modern Deep Blue */
.slide-btn-blue {
  background-color: #1d4ed8 !important;
  color: #ffffff !important;
  border: 1px solid #1e3a8a !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #1e3a8a !important;
  transform: translateY(0) !important;
}
.slide-btn-blue:hover {
  background-color: #2563eb !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #1e3a8a !important;
}
.slide-btn-blue:active, .slide-btn-blue.active {
  background-color: #1e40af !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #1e3a8a !important;
}
.dark .slide-btn-blue {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border-color: #1e3a8a !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-blue:hover {
  background-color: #3b82f6 !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-blue:active, .dark .slide-btn-blue.active {
  background-color: #1d4ed8 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #172554 !important;
}

/* Bright Red */
.slide-btn-red {
  background-color: #ef4444 !important;
  color: #ffffff !important;
  border: 1px solid #b91c1c !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #b91c1c !important;
  transform: translateY(0) !important;
}
.slide-btn-red:hover {
  background-color: #f87171 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #b91c1c !important;
}
.slide-btn-red:active, .slide-btn-red.active {
  background-color: #dc2626 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #b91c1c !important;
}
.dark .slide-btn-red {
  background-color: #ef4444 !important;
  color: #ffffff !important;
  border-color: #b91c1c !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-red:hover {
  background-color: #f87171 !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-red:active, .dark .slide-btn-red.active {
  background-color: #dc2626 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #7f1d1d !important;
}

/* Crisp Teal */
.slide-btn-teal {
  background-color: #0d9488 !important;
  color: #ffffff !important;
  border: 1px solid #0f766e !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 0 0 #0f766e !important;
  transform: translateY(0) !important;
}
.slide-btn-teal:hover {
  background-color: #14b8a6 !important;
  transform: translateY(-1.5px) !important;
  box-shadow: 0 5.5px 0 0 #0f766e !important;
}
.slide-btn-teal:active, .slide-btn-teal.active {
  background-color: #0f766e !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #0f766e !important;
}
.dark .slide-btn-teal {
  background-color: #14b8a6 !important;
  color: #ffffff !important;
  border-color: #0f766e !important;
  box-shadow: 0 4px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-teal:hover {
  background-color: #2dd4bf !important;
  box-shadow: 0 5.5px 0 0 rgba(255, 255, 255, 0.35) !important;
}
.dark .slide-btn-teal:active, .dark .slide-btn-teal.active {
  background-color: #0d9488 !important;
  transform: translateY(4px) !important;
  box-shadow: 0 0px 0 0 #042f2c !important;
}
`;
css = css + newStyles;
fs.writeFileSync('src/index.css', css);
