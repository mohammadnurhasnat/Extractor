import React from "react";
export function getInitials(name: string): string {
  const stop = new Set(['the', 'and', 'of', '&', 'trading', 'traders', 'enterprise', 'ltd', 'limited', 'co', 'company']);
  const words = name.trim().split(/\s+/).filter(Boolean);
  const kept = words.filter(w => !stop.has(w.toLowerCase()));
  const pool = kept.length ? kept : words;
  if (pool.length >= 2) return (pool[0][0] + pool[1][0]).toUpperCase();
  if (pool.length === 1) return pool[0].slice(0, 2).toUpperCase();
  return '—';
}

export function logoMarkSVG(
  initials: string,
  shape: 'circle' | 'square' | 'hexagon' | 'diamond' | 'shield' | 'octagon' | 'star' | 'rhombus' | 'cross' | 'ellipse' | 'badge-ribbon' | 'waves' | 'emblem-shield',
  fillColor: string,
  accent: string,
  textColor: string = '#FFFFFF',
  logoStyle: 'classic' | 'typographic' | 'bordered' | 'shadow-badge' = 'classic'
): string {
  let shapeEl = '';
  const fontSize = logoStyle === 'typographic' ? 64 : 74;
  let ty = 126;
  
  const defs = `
    <defs>
      <filter id="logo-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.26"/>
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.12"/>
      </filter>
      <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${fillColor}"/>
        <stop offset="100%" stop-color="${hexToRgba(fillColor, 0.85)}"/>
      </linearGradient>
    </defs>
  `;

  const fill = logoStyle === 'shadow-badge' ? 'url(#logo-gradient)' : fillColor;
  const filterAttr = logoStyle === 'shadow-badge' ? 'filter="url(#logo-drop-shadow)"' : '';

  if (logoStyle === 'typographic') {
    let perimeter = '';
    switch (shape) {
      case 'circle':
        perimeter = `<circle cx="100" cy="100" r="92" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <circle cx="100" cy="100" r="84" fill="none" stroke="${accent}" stroke-width="1.2" stroke-dasharray="4,4"/>`;
        break;
      case 'square':
        perimeter = `<rect x="10" y="10" width="180" height="180" rx="12" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <rect x="18" y="18" width="164" height="164" rx="8" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="5,3"/>`;
        break;
      case 'hexagon':
        perimeter = `<polygon points="100,8 184,54 184,146 100,192 16,146 16,54" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <polygon points="100,16 176,58 176,142 100,184 24,142 24,58" fill="none" stroke="${accent}" stroke-width="1" opacity="0.7"/>`;
        break;
      case 'diamond':
        perimeter = `<polygon points="100,14 186,100 100,186 14,100" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <polygon points="100,24 176,100 100,176 24,100" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="6,3"/>`;
        break;
      case 'shield':
        perimeter = `<path d="M 100 18 C 145 18, 178 32, 178 82 C 178 132, 137 169, 100 185 C 63 169, 22 132, 22 82 C 22 32, 55 18, 100 18 Z" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <path d="M 100 26 C 137 26, 168 38, 168 82 C 168 123, 132 155, 100 172 C 68 155, 32 123, 32 82 C 32 38, 63 26, 100 26 Z" fill="none" stroke="${accent}" stroke-width="1" opacity="0.7"/>`;
        break;
      case 'octagon':
        perimeter = `<polygon points="68,14 132,14 186,68 186,132 132,186 68,186 14,132 14,68" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <polygon points="71,18 129,18 182,71 182,129 129,182 71,182 18,129 18,71" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4,2"/>`;
        break;
      case 'star':
        perimeter = `<polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <polygon points="100,25 119,67 167,73 133,107 141,155 100,132 59,155 67,107 33,73 81,67" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4,2"/>`;
        break;
        break;
      case 'rhombus':
        perimeter = `<polygon points="100,16 174,74 100,184 26,126" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <polygon points="100,26 163,77 100,172 37,123" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4,2"/>`;
        break;
      case 'cross':
        perimeter = `<polygon points="76,16 124,16 124,76 184,76 184,124 124,124 124,184 76,184 76,124 16,124 16,76 76,76" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <polygon points="80,22 120,22 120,80 178,80 178,120 120,120 120,178 80,178 80,120 22,120 22,80 80,80" fill="none" stroke="${accent}" stroke-width="1" opacity="0.7"/>`;
        break;
      case 'ellipse':
        perimeter = `<ellipse cx="100" cy="100" rx="92" ry="68" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <ellipse cx="100" cy="100" rx="84" ry="60" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4,4"/>`;
        break;
      case 'badge-ribbon':
        perimeter = `<polygon points="68,130 50,184 82,170 100,184 118,170 150,184 132,130" fill="none" stroke="${accent}" stroke-width="1.5"/>
                     <circle cx="100" cy="90" r="76" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <circle cx="100" cy="90" r="68" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="3,3"/>`;
        break;
      case 'waves':
        perimeter = `<circle cx="100" cy="100" r="92" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <path d="M 25 100 C 50 75, 75 125, 100 100 C 125 75, 150 125, 175 100" fill="none" stroke="${accent}" stroke-width="2" opacity="0.8"/>
                     <path d="M 30 115 C 52 95, 78 135, 100 115 C 122 95, 148 135, 170 115" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>`;
        break;
      case 'emblem-shield':
        perimeter = `<path d="M 26,26 L 174,26 L 174,96 C 174,146 100,184 100,184 C 100,184 26,146 26,96 Z" fill="none" stroke="${fillColor}" stroke-width="2.5"/>
                     <path d="M 34,34 L 166,34 L 166,94 C 166,138 100,172 100,172 C 100,172 34,138 34,94 Z" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="4,2"/>`;
        break;
    }
    shapeEl = `
      ${perimeter}
      <line x1="35" y1="100" x2="65" y2="100" stroke="${accent}" stroke-width="2"/>
      <line x1="135" y1="100" x2="165" y2="100" stroke="${accent}" stroke-width="2"/>
      <circle cx="100" cy="100" r="3" fill="${accent}"/>
    `;
    textColor = fillColor; 
  } else if (logoStyle === 'bordered') {
    switch (shape) {
      case 'circle':
        shapeEl = `
          <circle cx="100" cy="100" r="92" fill="${fill}" ${filterAttr}/>
          <circle cx="100" cy="100" r="92" fill="none" stroke="${accent}" stroke-width="4"/>
          <circle cx="100" cy="100" r="85" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <circle cx="100" cy="100" r="78" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'square':
        shapeEl = `
          <rect x="8" y="8" width="184" height="184" rx="16" fill="${fill}" ${filterAttr}/>
          <rect x="8" y="8" width="184" height="184" rx="16" fill="none" stroke="${accent}" stroke-width="4"/>
          <rect x="15" y="15" width="170" height="170" rx="12" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <rect x="22" y="22" width="156" height="156" rx="8" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'hexagon':
        shapeEl = `
          <polygon points="100,5 188,52 188,148 100,195 12,148 12,52" fill="${fill}" ${filterAttr}/>
          <polygon points="100,5 188,52 188,148 100,195 12,148 12,52" fill="none" stroke="${accent}" stroke-width="4"/>
          <polygon points="100,14 178,57 178,143 100,186 22,143 22,57" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="4,2" opacity="0.7"/>
          <polygon points="100,20 171,61 171,139 100,180 29,139 29,61" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'diamond':
        shapeEl = `
          <polygon points="100,8 192,100 100,192 8,100" fill="${fill}" ${filterAttr}/>
          <polygon points="100,8 192,100 100,192 8,100" fill="none" stroke="${accent}" stroke-width="4"/>
          <polygon points="100,18 178,100 100,182 22,100" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.7"/>
          <polygon points="100,26 166,100 100,174 34,100" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'shield':
        shapeEl = `
          <path d="M 100 14 C 151 14, 187 29, 187 84 C 187 139, 141 181, 100 197 C 59 181, 13 139, 13 84 C 13 29, 49 14, 100 14 Z" fill="${fill}" ${filterAttr}/>
          <path d="M 100 14 C 151 14, 187 29, 187 84 C 187 139, 141 181, 100 197 C 59 181, 13 139, 13 84 C 13 29, 49 14, 100 14 Z" fill="none" stroke="${accent}" stroke-width="4"/>
          <path d="M 100 22 C 142 22, 175 35, 175 84 C 175 130, 135 167, 100 182 C 65 167, 25 130, 25 84 C 25 35, 58 22, 100 22 Z" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.7"/>
          <path d="M 100 30 C 134 30, 163 41, 163 84 C 163 121, 129 153, 100 167 C 71 153, 37 121, 37 84 C 37 41, 66 30, 100 30 Z" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'octagon':
        shapeEl = `
          <polygon points="65,8 135,8 192,65 192,135 135,192 65,192 8,135 8,65" fill="${fill}" ${filterAttr}/>
          <polygon points="65,8 135,8 192,65 192,135 135,192 65,192 8,135 8,65" fill="none" stroke="${accent}" stroke-width="4"/>
          <polygon points="67,13 133,13 187,67 187,133 133,187 67,187 13,133 13,67" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.7"/>
          <polygon points="70,18 130,18 182,70 182,130 130,182 70,182 18,130 18,70" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'star':
        shapeEl = `
          <polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="${fill}" ${filterAttr}/>
          <polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="none" stroke="${accent}" stroke-width="4"/>
          <polygon points="100,24 121,66 172,73 134,110 144,160 100,136 56,160 66,110 28,73 79,66" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <polygon points="100,32 117,65 158,70 128,99 136,138 100,120 64,138 72,99 42,70 83,65" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'rhombus':
        shapeEl = `
          <polygon points="100,12 178,70 100,188 22,130" fill="${fill}" ${filterAttr}/>
          <polygon points="100,12 178,70 100,188 22,130" fill="none" stroke="${accent}" stroke-width="4"/>
          <polygon points="100,20 170,72 100,178 30,127" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <polygon points="100,28 160,74 100,166 40,124" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'cross':
        shapeEl = `
          <polygon points="74,12 126,12 126,74 178,74 178,126 126,126 126,178 74,178 74,126 22,126 22,74 74,74" fill="${fill}" ${filterAttr}/>
          <polygon points="74,12 126,12 126,74 178,74 178,126 126,126 126,178 74,178 74,126 22,126 22,74 74,74" fill="none" stroke="${accent}" stroke-width="4"/>
          <polygon points="76,17 124,17 124,76 173,76 173,124 124,124 124,173 76,173 76,124 27,124 27,76 76,76" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <polygon points="78,22 122,22 122,78 168,78 168,122 122,122 122,168 78,168 78,122 32,122 32,78 78,78" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'ellipse':
        shapeEl = `
          <ellipse cx="100" cy="100" rx="92" ry="70" fill="${fill}" ${filterAttr}/>
          <ellipse cx="100" cy="100" rx="92" ry="70" fill="none" stroke="${accent}" stroke-width="4"/>
          <ellipse cx="100" cy="100" rx="84" ry="62" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <ellipse cx="100" cy="100" rx="76" ry="54" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'badge-ribbon':
        shapeEl = `
          <g ${filterAttr}>
            <polygon points="68,130 46,186 80,172 100,186 120,172 154,186 132,130" fill="${accent}"/>
            <circle cx="100" cy="90" r="76" fill="${fill}"/>
          </g>
          <circle cx="100" cy="90" r="76" fill="none" stroke="${accent}" stroke-width="4"/>
          <circle cx="100" cy="90" r="68" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <circle cx="100" cy="90" r="60" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'waves':
        shapeEl = `
          <circle cx="100" cy="100" r="92" fill="${fill}" ${filterAttr}/>
          <circle cx="100" cy="100" r="92" fill="none" stroke="${accent}" stroke-width="4"/>
          <path d="M 20 100 C 45 75, 70 125, 95 100 C 120 75, 145 125, 170 100" fill="none" stroke="${textColor}" stroke-width="2" stroke-dasharray="4,2"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
      case 'emblem-shield':
        shapeEl = `
          <path d="M 24,24 L 176,24 L 176,96 C 176,148 100,188 100,188 C 100,188 24,148 24,96 Z" fill="${fill}" ${filterAttr}/>
          <path d="M 24,24 L 176,24 L 176,96 C 176,148 100,188 100,188 C 100,188 24,148 24,96 Z" fill="none" stroke="${accent}" stroke-width="4"/>
          <path d="M 32,32 L 168,32 L 168,94 C 168,140 100,176 100,176 C 100,176 32,140 32,94 Z" fill="none" stroke="${textColor}" stroke-width="1" stroke-dasharray="3,3" opacity="0.8"/>
          <path d="M 40,40 L 160,40 L 160,92 C 160,132 100,164 100,164 C 100,164 40,132 40,92 Z" fill="none" stroke="${accent}" stroke-width="1.5"/>
        `;
        break;
    }
  } else if (logoStyle === 'shadow-badge') {
    let innerGlare = '';
    switch (shape) {
      case 'circle':
        shapeEl = `<circle cx="100" cy="100" r="91" fill="${fill}" ${filterAttr}/>
                   <circle cx="100" cy="100" r="91" fill="none" stroke="${accent}" stroke-width="4"/>
                   <circle cx="100" cy="100" r="82" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        innerGlare = `<path d="M 19 80 A 81 81 0 0 1 181 80 A 81 60 0 0 0 19 80 Z" fill="#FFFFFF" opacity="0.12"/>`;
        break;
      case 'square':
        shapeEl = `<rect x="9" y="9" width="182" height="182" rx="24" fill="${fill}" ${filterAttr}/>
                   <rect x="9" y="9" width="182" height="182" rx="24" fill="none" stroke="${accent}" stroke-width="4"/>
                   <rect x="18" y="18" width="164" height="164" rx="15" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        innerGlare = `<path d="M 18 80 Q 100 110 182 80 L 182 18 Q 100 18 18 18 Z" fill="#FFFFFF" opacity="0.1"/>`;
        break;
      case 'hexagon':
        shapeEl = `<polygon points="100,6 187,53 187,147 100,194 13,147 13,53" fill="${fill}" ${filterAttr}/>
                   <polygon points="100,6 187,53 187,147 100,194 13,147 13,53" fill="none" stroke="${accent}" stroke-width="4"/>
                   <polygon points="100,16 177,58 177,142 100,184 23,142 23,58" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'diamond':
        shapeEl = `<polygon points="100,9 191,100 100,191 9,100" fill="${fill}" ${filterAttr}/>
                   <polygon points="100,9 191,100 100,191 9,100" fill="none" stroke="${accent}" stroke-width="4"/>
                   <polygon points="100,19 179,100 100,181 21,100" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'shield':
        shapeEl = `<path d="M 100 14 C 151 14, 187 29, 187 84 C 187 139, 141 181, 100 197 C 59 181, 13 139, 13 84 C 13 29, 49 14, 100 14 Z" fill="${fill}" ${filterAttr}/>
                   <path d="M 100 14 C 151 14, 187 29, 187 84 C 187 139, 141 181, 100 197 C 59 181, 13 139, 13 84 C 13 29, 49 14, 100 14 Z" fill="none" stroke="${accent}" stroke-width="4"/>
                   <path d="M 100 23 C 141 23, 173 36, 173 84 C 173 129, 134 165, 100 180 C 66 165, 27 129, 27 84 C 27 36, 59 23, 100 23 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'octagon':
        shapeEl = `<polygon points="65,9 135,9 191,65 191,135 135,191 65,191 9,135 9,65" fill="${fill}" ${filterAttr}/>
                   <polygon points="65,9 135,9 191,65 191,135 135,191 65,191 9,135 9,65" fill="none" stroke="${accent}" stroke-width="4"/>
                   <polygon points="67,14 133,14 186,67 186,133 133,186 67,186 14,133 14,67" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'star':
        shapeEl = `<polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="${fill}" ${filterAttr}/>
                   <polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="none" stroke="${accent}" stroke-width="4"/>
                   <polygon points="100,24 121,66 172,73 134,110 144,160 100,136 56,160 66,110 28,73 79,66" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'rhombus':
        shapeEl = `<polygon points="100,12 178,70 100,188 22,130" fill="${fill}" ${filterAttr}/>
                   <polygon points="100,12 178,70 100,188 22,130" fill="none" stroke="${accent}" stroke-width="4"/>
                   <polygon points="100,20 170,72 100,178 30,127" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'cross':
        shapeEl = `<polygon points="74,12 126,12 126,74 178,74 178,126 126,126 126,178 74,178 74,126 22,126 22,74 74,74" fill="${fill}" ${filterAttr}/>
                   <polygon points="74,12 126,12 126,74 178,74 178,126 126,126 126,178 74,178 74,126 22,126 22,74 74,74" fill="none" stroke="${accent}" stroke-width="4"/>
                   <polygon points="76,17 124,17 124,76 173,76 173,124 124,124 124,173 76,173 76,124 27,124 27,76 76,76" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'ellipse':
        shapeEl = `<ellipse cx="100" cy="100" rx="92" ry="70" fill="${fill}" ${filterAttr}/>
                   <ellipse cx="100" cy="100" rx="92" ry="70" fill="none" stroke="${accent}" stroke-width="4"/>
                   <ellipse cx="100" cy="100" rx="84" ry="62" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'badge-ribbon':
        shapeEl = `<g ${filterAttr}>
                     <polygon points="68,130 46,186 80,172 100,186 120,172 154,186 132,130" fill="${accent}"/>
                     <circle cx="100" cy="90" r="76" fill="${fill}"/>
                   </g>
                   <circle cx="100" cy="90" r="76" fill="none" stroke="${accent}" stroke-width="4"/>
                   <circle cx="100" cy="90" r="68" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
      case 'waves':
        shapeEl = `<circle cx="100" cy="100" r="92" fill="${fill}" ${filterAttr}/>
                   <circle cx="100" cy="100" r="92" fill="none" stroke="${accent}" stroke-width="4"/>
                   <path d="M 20 100 C 45 75, 70 125, 95 100 C 120 75, 145 125, 170 100" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.3"/>`;
        break;
      case 'emblem-shield':
        shapeEl = `<path d="M 24,24 L 176,24 L 176,96 C 176,148 100,188 100,188 C 100,188 24,148 24,96 Z" fill="${fill}" ${filterAttr}/>
                   <path d="M 24,24 L 176,24 L 176,96 C 176,148 100,188 100,188 C 100,188 24,148 24,96 Z" fill="none" stroke="${accent}" stroke-width="4"/>
                   <path d="M 32,32 L 168,32 L 168,94 C 168,140 100,176 100,176 C 100,176 32,140 32,94 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.3"/>`;
        break;
    }
    shapeEl = `${shapeEl}${innerGlare}`;
  } else {
    switch (shape) {
      case 'circle':
        shapeEl = `<circle cx="100" cy="100" r="90" fill="${fill}"/><circle cx="100" cy="100" r="90" fill="none" stroke="${accent}" stroke-width="5"/><circle cx="100" cy="100" r="80" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".6"/>`;
        break;
      case 'square':
        shapeEl = `<rect x="8" y="8" width="184" height="184" rx="22" fill="${fill}"/><rect x="8" y="8" width="184" height="184" rx="22" fill="none" stroke="${accent}" stroke-width="5"/><rect x="18" y="18" width="164" height="164" rx="14" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".6"/>`;
        break;
      case 'hexagon':
        shapeEl = `<polygon points="100,4 189,52 189,148 100,196 11,148 11,52" fill="${fill}"/><polygon points="100,4 189,52 189,148 100,196 11,148 11,52" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'diamond':
        shapeEl = `<polygon points="100,10 190,100 100,190 10,100" fill="${fill}"/><polygon points="100,10 190,100 100,190 10,100" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'shield':
        shapeEl = `<path d="M 100 15 C 150 15, 185 30, 185 85 C 185 140, 140 180, 100 195 C 60 180, 15 140, 15 85 C 15 30, 50 15, 100 15 Z" fill="${fill}"/><path d="M 100 15 C 150 15, 185 30, 185 85 C 185 140, 140 180, 100 195 C 60 180, 15 140, 15 85 C 15 30, 50 15, 100 15 Z" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'octagon':
        shapeEl = `<polygon points="65,10 135,10 190,65 190,135 135,190 65,190 10,135 10,65" fill="${fill}"/><polygon points="65,10 135,10 190,65 190,135 135,190 65,190 10,135 10,65" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'star':
        shapeEl = `<polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="${fill}"/><polygon points="100,15 124,67 181,75 139,116 150,172 100,146 50,172 61,116 19,75 76,67" fill="none" stroke="${accent}" stroke-width="5"/><polygon points="100,24 121,66 172,73 134,110 144,160 100,136 56,160 66,110 28,73 79,66" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".6"/>`;
        break;
      case 'rhombus':
        shapeEl = `<polygon points="100,12 178,70 100,188 22,130" fill="${fill}"/><polygon points="100,12 178,70 100,188 22,130" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'cross':
        shapeEl = `<polygon points="74,12 126,12 126,74 178,74 178,126 126,126 126,178 74,178 74,126 22,126 22,74 74,74" fill="${fill}"/><polygon points="74,12 126,12 126,74 178,74 178,126 126,126 126,178 74,178 74,126 22,126 22,74 74,74" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'ellipse':
        shapeEl = `<ellipse cx="100" cy="100" rx="92" ry="70" fill="${fill}"/><ellipse cx="100" cy="100" rx="92" ry="70" fill="none" stroke="${accent}" stroke-width="5"/><ellipse cx="100" cy="100" rx="84" ry="62" fill="none" stroke="${accent}" stroke-width="1.2" opacity=".6"/>`;
        break;
      case 'badge-ribbon':
        shapeEl = `<polygon points="68,130 46,186 80,172 100,186 120,172 154,186 132,130" fill="${accent}"/><circle cx="100" cy="90" r="76" fill="${fill}"/><circle cx="100" cy="90" r="76" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
      case 'waves':
        shapeEl = `<circle cx="100" cy="100" r="92" fill="${fill}"/><circle cx="100" cy="100" r="92" fill="none" stroke="${accent}" stroke-width="5"/><path d="M 20 100 C 45 75, 70 125, 95 100 C 120 75, 145 125, 170 100" fill="none" stroke="${accent}" stroke-width="2"/>`;
        break;
      case 'emblem-shield':
        shapeEl = `<path d="M 24,24 L 176,24 L 176,96 C 176,148 100,188 100,188 C 100,188 24,148 24,96 Z" fill="${fill}"/><path d="M 24,24 L 176,24 L 176,96 C 176,148 100,188 100,188 C 100,188 24,148 24,96 Z" fill="none" stroke="${accent}" stroke-width="5"/>`;
        break;
    }
  }

  const textShadowAttr = logoStyle === 'shadow-badge' ? 'style="text-shadow: 0 2px 4px rgba(0,0,0,0.3); font-feature-settings: \'ss01\' on;"' : '';
  const textFontWeight = logoStyle === 'typographic' ? '500' : 'bold';
  const textFontFamily = logoStyle === 'typographic' ? "'Cinzel', Georgia, serif" : "Georgia, 'Times New Roman', serif";

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    ${defs}
    ${shapeEl}
    <text x="100" y="${ty}" font-size="${fontSize}" font-family="${textFontFamily}" font-weight="${textFontWeight}" fill="${textColor}" text-anchor="middle" ${textShadowAttr}>${initials}</text>
  </svg>`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function nameFontSize(name: string): number {
  const len = (name || '').length;
  if (len <= 16) return 38;
  if (len <= 24) return 32;
  if (len <= 34) return 27;
  return 22;
}

export function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function svgWrap(innerHTML: string, wmm: number, hmm: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${wmm}mm" height="${hmm}mm" viewBox="0 0 ${wmm} ${hmm}">
<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${wmm}mm;height:${hmm}mm;">${innerHTML}</div></foreignObject>
</svg>`;
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCompanyName(name: string, casing?: 'title' | 'upper' | 'as-typed'): string {
  if (!name) return '';
  const style = casing || 'title';
  if (style === 'upper') {
    return name.toUpperCase();
  }
  if (style === 'title') {
    return toTitleCase(name);
  }
  return name;
}

export const getTextureStyles = (tex: string): React.CSSProperties => {
  if (tex === 'linen') {
    return {
      backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.02) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.02) 1px, transparent 1px, transparent 4px)`,
      backgroundSize: '100% 100%',
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'canvas') {
    return {
      backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03)), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03))`,
      backgroundPosition: `0 0, 2px 2px`,
      backgroundSize: `4px 4px`,
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'vellum') {
    return {
      backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.02) 0%, transparent 50%)`,
      backgroundSize: '100% 100%',
    };
  }
  if (tex === 'watercolor') {
    return {
      backgroundImage: `radial-gradient(circle at 10% 20%, rgba(0,0,0,0.02) 0%, transparent 40%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.03) 0%, transparent 50%)`,
      backgroundSize: '100% 100%',
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'parchment') {
    return {
      backgroundImage: `radial-gradient(circle at center, transparent 0%, rgba(200, 150, 100, 0.05) 100%), repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.01) 2px, rgba(0,0,0,0.01) 4px)`,
      backgroundSize: '100% 100%, 4px 4px',
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'recycled') {
    return {
      backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px), radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)`,
      backgroundSize: `10px 10px, 15px 15px`,
      backgroundPosition: `0 0, 5px 5px`,
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'felt') {
    return {
      backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.01) 0px, rgba(0,0,0,0.01) 1px, transparent 1px, transparent 3px)`,
      backgroundSize: '100% 100%',
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'laid') {
    return {
      backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 11px), repeating-linear-gradient(to right, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 3px)`,
      backgroundSize: '100% 100%',
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'kraft') {
    return {
      backgroundImage: `linear-gradient(rgba(200,150,100,0.08), rgba(200,150,100,0.08)), radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)`,
      backgroundSize: `100% 100%, 8px 8px`,
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'metallic') {
    return {
      backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.3) 100%)`,
      backgroundSize: '100% 100%',
    };
  }
  if (tex === 'speckled') {
    return {
      backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px), radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)`,
      backgroundSize: `6px 6px, 9px 9px`,
      backgroundPosition: `0 0, 3px 3px`,
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'leather') {
    return {
      backgroundImage: `radial-gradient(circle at center, rgba(0,0,0,0.03) 0%, transparent 30%)`,
      backgroundSize: `4px 4px`,
      mixBlendMode: 'multiply',
    };
  }
  if (tex === 'wood') {
    return {
      backgroundImage: `repeating-radial-gradient(ellipse at center, rgba(0,0,0,0.02) 0%, transparent 2%, transparent 4%, rgba(0,0,0,0.02) 6%)`,
      backgroundSize: `200% 100%`,
      backgroundPosition: `center`,
      mixBlendMode: 'multiply',
    };
  }
  return {};
};

export const getGridStyles = (gridStyle: string, prim: string, headlineFont: string, companyName: string): React.CSSProperties => {
  const styles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: 'none',
  };
  
  if (gridStyle === 'none') return styles;

  const cPrim = hexToRgba(prim, 0.22);
  const cLine = hexToRgba(prim, 0.08);
  const cLineLight = hexToRgba(prim, 0.03);

  if (gridStyle === 'dots') {
    styles.backgroundImage = `radial-gradient(circle, ${cPrim} 1.5px, transparent 1.5px)`;
    styles.backgroundSize = '5mm 5mm';
  } else if (gridStyle === 'lines') {
    styles.backgroundImage = `linear-gradient(${cLine} 1px, transparent 1px), linear-gradient(90deg, ${cLineLight} 1px, transparent 1px)`;
    styles.backgroundSize = '100% 6.5mm, 6.5mm 100%';
  } else if (gridStyle === 'repeated-name') {
    const fontStr = headlineFont.replace(/['"]/g, '');
    const cleanCompanyName = companyName.replace(/[<>]/g, '');
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="40"><text x="0" y="24" fill="${hexToRgba(prim, 0.06)}" font-family="${fontStr}" font-size="12px" font-weight="600" letter-spacing="1px" white-space="nowrap">${Array.from({length: 40}).map(() => cleanCompanyName + "    •    ").join('')}</text></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '1200px 40px';
  } else if (gridStyle === 'graph') {
    styles.backgroundImage = `linear-gradient(${cLine} 1px, transparent 1px), linear-gradient(90deg, ${cLine} 1px, transparent 1px), linear-gradient(${cLineLight} 1px, transparent 1px), linear-gradient(90deg, ${cLineLight} 1px, transparent 1px)`;
    styles.backgroundSize = '10mm 10mm, 10mm 10mm, 2mm 2mm, 2mm 2mm';
  } else if (gridStyle === 'isometric') {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="34.64"><path d="M 0,17.32 L 20,5.77 M 0,17.32 L 20,28.87 M 10,0 L 10,34.64" stroke="${cLineLight}" stroke-width="0.5" fill="none"/></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '10mm 17.32mm';
  } else if (gridStyle === 'crosses') {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M 10,6 L 10,14 M 6,10 L 14,10" stroke="${cLine}" stroke-width="1" fill="none"/></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '10mm 10mm';
  } else if (gridStyle === 'diagonal') {
    styles.backgroundImage = `repeating-linear-gradient(45deg, ${cLineLight} 0, ${cLineLight} 1px, transparent 1px, transparent 8mm)`;
  } else if (gridStyle === 'hexagonal') {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="34.64" height="60"><path d="M17.32,0 L34.64,10 L34.64,30 L17.32,40 L0,30 L0,10 Z M17.32,40 L34.64,50 L34.64,70" fill="none" stroke="${cLineLight}" stroke-width="1"/></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '8mm 13.86mm';
  } else if (gridStyle === 'music') {
    const line = `<line x1="0" y1="0" x2="100%" y2="0" stroke="${cLine}" stroke-width="1"/>`;
    const staves = `\${line}<line x1="0" y1="4" x2="100%" y2="4" stroke="${cLine}" stroke-width="1"/><line x1="0" y1="8" x2="100%" y2="8" stroke="${cLine}" stroke-width="1"/><line x1="0" y1="12" x2="100%" y2="12" stroke="${cLine}" stroke-width="1"/><line x1="0" y1="16" x2="100%" y2="16" stroke="${cLine}" stroke-width="1"/>`;
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><g transform="translate(0, 20)">${staves}</g></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '100% 20mm';
  } else if (gridStyle === 'calligraphy') {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><line x1="0" y1="10" x2="100%" y2="10" stroke="${cLineLight}" stroke-width="1"/><line x1="0" y1="20" x2="100%" y2="20" stroke="${cLine}" stroke-width="1" stroke-dasharray="4 4"/><line x1="0" y1="30" x2="100%" y2="30" stroke="${cLineLight}" stroke-width="1"/></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '100% 12mm';
  } else if (gridStyle === 'stipple') {
    styles.backgroundImage = `radial-gradient(circle, ${cPrim} 0.5px, transparent 0.5px), radial-gradient(circle, ${cPrim} 0.5px, transparent 0.5px)`;
    styles.backgroundSize = '4mm 4mm, 3mm 3mm';
    styles.backgroundPosition = '0 0, 1.5mm 1.5mm';
  } else if (gridStyle === 'blueprint') {
    styles.backgroundColor = '#1e3a5f';
    const bLine = 'rgba(255,255,255,0.2)';
    const bLineLight = 'rgba(255,255,255,0.08)';
    styles.backgroundImage = `linear-gradient(${bLine} 1px, transparent 1px), linear-gradient(90deg, ${bLine} 1px, transparent 1px), linear-gradient(${bLineLight} 1px, transparent 1px), linear-gradient(90deg, ${bLineLight} 1px, transparent 1px)`;
    styles.backgroundSize = '20mm 20mm, 20mm 20mm, 4mm 4mm, 4mm 4mm';
  } else if (gridStyle === 'circuit') {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none" stroke="${cLine}" stroke-width="1"><path d="M10,10 L20,10 L25,15 L35,15 M20,10 A2,2 0 1,1 20,9.9 M35,15 A2,2 0 1,1 35,14.9 M40,40 L30,40 L20,30 L20,20 M40,40 A2,2 0 1,1 40,39.9 M20,20 A2,2 0 1,1 20,19.9"/></svg>`;
    styles.backgroundImage = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}")`;
    styles.backgroundSize = '20mm 20mm';
  }

  return styles;
};
