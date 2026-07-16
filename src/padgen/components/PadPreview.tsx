import React from 'react';
import { CompanyData, Theme } from '../types';
import { getInitials, logoMarkSVG, hexToRgba, nameFontSize, formatCompanyName, getTextureStyles, getGridStyles } from '../utils';

interface PadPreviewProps {
  data: CompanyData;
  theme: Theme;
  shape: any;
  layout: any;
  headlineFont: string;
  logoStyle: any;
  gridStyle?: any;
  texture?: any;
}

const renderDecorationsAroundName = (
  name: string,
  decorations: string | undefined,
  theme: Theme,
  headlineFont: string,
  nameSize: number,
  tagline: string
) => {
  const dColor = theme.decorationColor || theme.accent;
  const secColor = theme.secondary || theme.accent;
  const sh3 = theme.shade3 || '#F3F4F6';

  const nameEl = (
    <div style={{ fontFamily: headlineFont, fontSize: `${nameSize - 1}pt`, fontWeight: "bold", letterSpacing: ".03em", color: theme.primary, lineHeight: 1.15, whiteSpace: "nowrap" }}>
      {name}
    </div>
  );

  const taglineEl = tagline ? (
    <div style={{ fontSize: '12pt', color: secColor, letterSpacing: '.1em', textTransform: 'uppercase', marginTop: '1.2mm', fontWeight: 600 }}>
      {tagline}
    </div>
  ) : null;

  const headerContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    position: 'relative',
    paddingTop: '3mm',
    paddingRight: '5mm',
    paddingBottom: '3mm',
    paddingLeft: '5mm',
    borderRadius: '4px',
  };

  switch (decorations) {
    case 'brackets':
      return (
        <div style={headerContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3.5mm' }}>
            <span style={{ fontSize: `${nameSize + 4}pt`, fontFamily: headlineFont, color: dColor, fontWeight: 300, lineHeight: 1 }}>[</span>
            {nameEl}
            <span style={{ fontSize: `${nameSize + 4}pt`, fontFamily: headlineFont, color: dColor, fontWeight: 300, lineHeight: 1 }}>]</span>
          </div>
          {taglineEl}
        </div>
      );

    case 'horizontal-lines':
      return (
        <div style={headerContainerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4mm', width: '100%', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '1.5px', background: `linear-gradient(90deg, transparent, ${dColor})`, maxWidth: '40mm' }}></div>
            {nameEl}
            <div style={{ flex: 1, height: '1.5px', background: `linear-gradient(90deg, ${dColor}, transparent)`, maxWidth: '40mm' }}></div>
          </div>
          {taglineEl}
        </div>
      );

    case 'subtle-box':
      return (
        <div style={{ 
          ...headerContainerStyle, 
          border: `1.5px solid ${dColor}`, 
          background: `linear-gradient(135deg, ${sh3} 0%, rgba(255,255,255,0.95) 100%)`, 
          padding: '4mm 8mm', 
          boxShadow: `0 3px 10px rgba(0,0,0,0.03)`,
          display: 'inline-block',
          margin: '0 auto'
        }}>
          {nameEl}
          {taglineEl}
        </div>
      );

    case 'top-bottom-dots':
      return (
        <div style={headerContainerStyle}>
          <div style={{ display: 'flex', gap: '1.5mm', marginBottom: '2.5mm' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: i === 3 ? theme.accent : dColor, opacity: 0.8 }} />
            ))}
          </div>
          {nameEl}
          {taglineEl}
          <div style={{ display: 'flex', gap: '1.5mm', marginTop: '2.5mm' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: i === 3 ? theme.accent : dColor, opacity: 0.8 }} />
            ))}
          </div>
        </div>
      );

    case 'corner-flourish':
      return (
        <div style={{ ...headerContainerStyle, display: 'inline-block', position: 'relative', padding: '5mm 10mm', margin: '0 auto' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4mm', height: '4mm', borderTop: `2px solid ${dColor}`, borderLeft: `2px solid ${dColor}` }}></div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '4mm', height: '4mm', borderTop: `2px solid ${dColor}`, borderRight: `2px solid ${dColor}` }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '4mm', height: '4mm', borderBottom: `2px solid ${dColor}`, borderLeft: `2px solid ${dColor}` }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '4mm', height: '4mm', borderBottom: `2px solid ${dColor}`, borderRight: `2px solid ${dColor}` }}></div>
          {nameEl}
          {taglineEl}
        </div>
      );

    case 'crest':
      return (
        <div style={headerContainerStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2mm' }}>
            <div style={{
              width: '12mm',
              height: '12mm',
              border: `2px solid ${dColor}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.shade2 || theme.primary} 100%)`,
              boxShadow: `0 2.5px 5px rgba(0,0,0,0.1)`,
              color: '#FFFFFF',
              fontFamily: headlineFont,
              fontSize: '11pt',
              fontWeight: 'bold',
              letterSpacing: '.05em'
            }}>
              {name.substring(0, 2).toUpperCase()}
            </div>
            {nameEl}
            {taglineEl}
          </div>
        </div>
      );

    case 'modern-accent':
      return (
        <div style={{ ...headerContainerStyle, alignItems: 'flex-start', textAlign: 'left', borderLeft: `3.5px solid ${dColor}`, paddingLeft: '4.5mm', paddingRight: '2mm' }}>
          {nameEl}
          {taglineEl}
          <div style={{ width: '45%', height: '2px', background: `linear-gradient(90deg, ${secColor}, transparent)`, marginTop: '2mm' }}></div>
        </div>
      );

    default:
      return (
        <div style={headerContainerStyle}>
          {nameEl}
          {taglineEl}
        </div>
      );
  }
};



const PadTopAesthetics: React.FC<{ theme: Theme }> = ({ theme }) => {
  const { primary, accent, secondary, shade2, shade3 } = theme;
  const p = hexToRgba(primary, 0.12);
  const p2 = hexToRgba(primary, 0.08);
  const a = hexToRgba(accent, 0.15);
  const a2 = hexToRgba(accent, 0.1);
  const s = hexToRgba(secondary || primary, 0.08);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45mm', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
      {/* Abstract large background polygons */}
      <div style={{ position: 'absolute', top: '-15mm', left: '-10mm', width: '60mm', height: '40mm', background: p2, clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 80%)' }}></div>
      <div style={{ position: 'absolute', top: '-10mm', right: '-20mm', width: '70mm', height: '50mm', background: a2, clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 0 100%)' }}></div>
      
      {/* Decorative Circles */}
      <div style={{ position: 'absolute', top: '5mm', right: '15mm', width: '25mm', height: '25mm', borderRadius: '50%', border: `1.5px dashed ${a}`, opacity: 0.6 }}></div>
      <div style={{ position: 'absolute', top: '15mm', right: '35mm', width: '6mm', height: '6mm', borderRadius: '50%', background: p }}></div>
      <div style={{ position: 'absolute', top: '22mm', left: '12mm', width: '4mm', height: '4mm', borderRadius: '50%', border: `1px solid ${p}` }}></div>
      
      {/* Decorative Rectangles & Lines */}
      <div style={{ position: 'absolute', top: '10mm', left: '20mm', width: '15mm', height: '15mm', border: `2px solid ${s}`, transform: 'rotate(15deg)', borderRadius: '3px' }}></div>
      <div style={{ position: 'absolute', top: '28mm', left: '-5mm', width: '35mm', height: '2mm', background: `linear-gradient(90deg, ${p}, transparent)`, transform: 'rotate(5deg)' }}></div>
      <div style={{ position: 'absolute', top: '35mm', right: '-15mm', width: '45mm', height: '1.5mm', background: `linear-gradient(-90deg, ${a}, transparent)`, transform: 'rotate(-10deg)' }}></div>
      
      {/* Micro dots cluster */}
      <div style={{ position: 'absolute', top: '8mm', left: '45%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2mm', opacity: 0.4 }}>
         {[...Array(9)].map((_, i) => <div key={i} style={{width: '2px', height: '2px', borderRadius: '50%', background: primary}}></div>)}
      </div>
    </div>
  );
};


const PadBottomAesthetics: React.FC<{ theme: Theme }> = ({ theme }) => {
  const { primary, accent, secondary, shade2, shade3 } = theme;
  const p = hexToRgba(primary, 0.12);
  const p2 = hexToRgba(primary, 0.08);
  const a = hexToRgba(accent, 0.15);
  const s = hexToRgba(secondary || primary, 0.1);

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45mm', overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
      {/* Abstract large background polygons */}
      <div style={{ position: 'absolute', bottom: '-15mm', right: '-15mm', width: '80mm', height: '40mm', background: p2, clipPath: 'polygon(100% 100%, 0 100%, 20% 0, 100% 30%)' }}></div>
      <div style={{ position: 'absolute', bottom: '-20mm', left: '-10mm', width: '60mm', height: '50mm', background: hexToRgba(accent, 0.06), clipPath: 'polygon(0 100%, 100% 100%, 80% 0, 0 20%)' }}></div>

      {/* Decorative Circles */}
      <div style={{ position: 'absolute', bottom: '8mm', left: '15mm', width: '30mm', height: '30mm', borderRadius: '50%', border: `2px solid ${s}`, opacity: 0.7 }}></div>
      <div style={{ position: 'absolute', bottom: '15mm', left: '10mm', width: '40mm', height: '40mm', borderRadius: '50%', border: `1px dashed ${a}`, opacity: 0.4 }}></div>
      <div style={{ position: 'absolute', bottom: '25mm', left: '45mm', width: '5mm', height: '5mm', borderRadius: '50%', background: p }}></div>

      {/* Decorative Rectangles & Lines */}
      <div style={{ position: 'absolute', bottom: '15mm', right: '25mm', width: '12mm', height: '12mm', borderTop: `3px solid ${a}`, borderRight: `3px solid ${a}`, transform: 'rotate(15deg)', borderRadius: '2px' }}></div>
      <div style={{ position: 'absolute', bottom: '30mm', right: '5mm', width: '25mm', height: '2mm', background: `linear-gradient(-90deg, ${p}, transparent)`, transform: 'rotate(-25deg)' }}></div>
      
      {/* Crosshairs */}
      <div style={{ position: 'absolute', bottom: '10mm', right: '15mm', width: '8mm', height: '8mm', opacity: 0.6 }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: primary, transform: 'translateY(-50%)' }}></div>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: primary, transform: 'translateX(-50%)' }}></div>
      </div>
      
      <div style={{ position: 'absolute', bottom: '8mm', left: '60%', transform: 'translateX(-50%)', display: 'flex', gap: '3mm', opacity: 0.5 }}>
         {[1, 2, 3, 4, 5].map(i => <div key={i} style={{width: '4px', height: '4px', transform: 'rotate(45deg)', background: i % 2 === 0 ? primary : accent, borderRadius: '1px'}}></div>)}
      </div>
    </div>
  );
};

const PadPreviewInner: React.FC<PadPreviewProps> = ({
  data,
  theme,
  shape,
  layout,
  headlineFont,
  logoStyle,
  gridStyle = 'none',
  texture = 'none',
}) => {
  const initials = getInitials(data.companyName);
  const mark = logoMarkSVG(initials, shape, theme.primary, theme.accent, '#FFFFFF', logoStyle);
  const whiteLogoMark = logoMarkSVG(initials, shape, '#FFFFFF', theme.accent, theme.primary, logoStyle);
  const detailsMuted = hexToRgba(theme.primary, 0.75);
  const nameSize = nameFontSize(data.companyName);
  const industry = data.industry || 'corporate';


  // Define highly professional Canva & Freepik background paper tones
  let customPaper = theme.paper;
  if (theme.paper === '#FFFFFF') {
    if (industry === 'hospitality') {
      customPaper = '#FAF8F5'; // Premium Warm Ivory
    } else if (industry === 'legal') {
      customPaper = '#FCFBF8'; // Classic Royal Alabaster
    } else if (industry === 'medical') {
      customPaper = '#FAFCFD'; // Crisp Clinical Mint
    } else {
      customPaper = '#FCFCFC'; // Rich Studio Matte White
    }
  }

  // Multi-shaded visual accent parameters
  const prim = theme.primary;

  
  const acc = theme.accent;
  const sec = theme.secondary || theme.accent;
  const sh2 = theme.shade2 || prim;
  const sh3 = theme.shade3 || '#E2E8F0';

  const waterMark = (
    <div
      className="wm"
      style={{
        position: 'absolute',
        top: '55%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90mm',
        height: '90mm',
        opacity: 0.12,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      dangerouslySetInnerHTML={{ __html: mark }}
    />
  );


  const backgroundGridStyles = getGridStyles(gridStyle, prim, headlineFont, data.companyName);
  const nameFormatted = formatCompanyName(data.companyName, data.casing);

  // 3. Sideband Layout (Full Left Side Geometric Palette)
  if (layout === 'sideband') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        {/* Left Solid/Gradient Decorative sidebar */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '9mm', background: `linear-gradient(180deg, ${prim} 0%, ${sh2} 50%, ${sec} 100%)`, zIndex: 3, boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
          {/* Inner Accent lines */}
          <div style={{ position: 'absolute', top: 0, right: '1.5mm', bottom: 0, width: '1.2mm', background: acc, opacity: 0.9 }}></div>
          {/* Translucent geometric shapes */}
          <div style={{ position: 'absolute', top: '15mm', left: 0, width: '100%', height: '9mm', background: 'rgba(255,255,255,0.15)', transform: 'skewY(30deg)' }}></div>
          <div style={{ position: 'absolute', bottom: '15mm', left: 0, width: '100%', height: '9mm', background: 'rgba(255,255,255,0.15)', transform: 'skewY(-30deg)' }}></div>
        </div>

        {/* Right Corner decorative fold */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '22mm', height: '22mm', overflow: 'hidden', zIndex: 2 }}>
          <div style={{ position: 'absolute', top: '-10mm', right: '-10mm', width: '20mm', height: '20mm', background: acc, transform: 'rotate(45deg)' }}></div>
          <div style={{ position: 'absolute', top: '-12mm', right: '-12mm', width: '20mm', height: '20mm', background: prim, transform: 'rotate(45deg)' }}></div>
        </div>

        {/* Bottom Corner decorative fold */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20mm', height: '20mm', overflow: 'hidden', zIndex: 2 }}>
          <div style={{ position: 'absolute', bottom: '-10mm', right: '-10mm', width: '20mm', height: '20mm', background: sec, transform: 'rotate(45deg)' }}></div>
        </div>

        {waterMark}

        <div className="content" style={{ padding: '16mm 15mm 16mm 22mm' }}>
          <div style={{ borderLeft: `4px solid ${acc}`, paddingLeft: '5mm', position: 'relative', zIndex: 1 }}>
            {renderDecorationsAroundName(nameFormatted, theme.decorations === 'crest' ? undefined : theme.decorations, theme, headlineFont, nameSize, data.tagline)}
            <div style={{ 
              fontSize: '11pt', 
              color: detailsMuted, 
              marginTop: '3.5mm',
              lineHeight: 1.4
            }}>
              <span style={{ fontWeight: 600, color: prim }}>{data.address}</span> 
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1mm', marginTop: '1mm' }}>
                <span>Phone: {data.phone}</span> 
                <span>&bull;</span> 
                <span style={{ fontWeight: 600, color: prim }}>{data.email}</span>
              </div>
            </div>
          </div>
          <div style={{ height: '2px', background: `linear-gradient(90deg, ${acc} 0%, ${sh2} 40%, transparent 100%)`, marginTop: '5mm', opacity: 0.85 }}></div>
          
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // 4. Compact Modern Header Layout (Asymmetric Polygon Shapes)
  if (layout === 'modern-header') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        {/* Canva Premium Asymmetric Polygon Header */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '18mm', overflow: 'hidden', zIndex: 3 }}>
          {/* Colorful overlays */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '48%', height: '14mm', background: `linear-gradient(135deg, ${prim}, ${sh2})`, clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}></div>
          <div style={{ position: 'absolute', top: 0, left: '46%', width: '12%', height: '14mm', background: acc, clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)', opacity: 0.9 }}></div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '11mm', background: `linear-gradient(135deg, ${sec}, ${sh3})`, clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}></div>
          {/* Multi-layered dividing line */}
          <div style={{ position: 'absolute', bottom: '1.5mm', left: 0, right: 0, height: '1.5mm', background: acc }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5mm', background: prim }}></div>
        </div>

        {/* Elegant bottom footer */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '14mm', overflow: 'hidden', zIndex: 3 }}>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '42%', height: '9mm', background: `linear-gradient(135deg, ${prim}, ${sh2})`, clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: '40%', width: '10%', height: '9mm', background: acc, clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5mm', background: `linear-gradient(90deg, ${acc}, ${prim})` }}></div>
        </div>

        {waterMark}

        <div className="content" style={{ padding: '24mm 15mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div>
              {renderDecorationsAroundName(nameFormatted, theme.decorations === 'crest' ? undefined : theme.decorations, theme, headlineFont, nameSize, data.tagline)}
            </div>
            <div style={{ 
              textAlign: 'right', 
              fontSize: '11pt', 
              color: detailsMuted, 
              lineHeight: 1.45,
              background: 'rgba(255,255,255,0.8)',
              padding: '2mm 3mm',
              borderRadius: '4px',
              border: `1px solid ${hexToRgba(prim, 0.1)}`,
              maxWidth: '80mm',
              wordWrap: 'break-word'
            }}>
              <div style={{ fontWeight: 'bold', color: prim }}>{data.address}</div>
              <div>Phone: {data.phone} &bull; <span style={{ fontWeight: 600, color: prim }}>{data.email}</span></div>
            </div>
          </div>
          <div style={{
            height: '3px',
            background: `linear-gradient(90deg, ${prim} 0%, ${acc} 50%, ${sec} 100%)`,
            marginTop: '5mm',
            borderRadius: '1.5px',
          }}></div>
          
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // 5. Elegant Double Border Layout (Classic Masterpiece)
  if (layout === 'elegant-border') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        {/* Full thin colorful frame outer border */}
        <div style={{ position: 'absolute', top: '4mm', left: '4mm', right: '4mm', bottom: '4mm', border: `1.5px solid ${acc}`, pointerEvents: 'none', zIndex: 2, opacity: 0.85 }}></div>
        <div style={{ position: 'absolute', top: '5.2mm', left: '5.2mm', right: '5.2mm', bottom: '5.2mm', border: `0.8px solid ${prim}`, pointerEvents: 'none', zIndex: 2, opacity: 0.65 }}></div>

        {/* Corner floral color block accents */}
        <div style={{ position: 'absolute', top: '4mm', left: '4mm', width: '8mm', height: '8mm', borderTop: `4.5px solid ${prim}`, borderLeft: `4.5px solid ${prim}`, pointerEvents: 'none', zIndex: 3 }}></div>
        <div style={{ position: 'absolute', top: '4mm', right: '4mm', width: '8mm', height: '8mm', borderTop: `4.5px solid ${acc}`, borderRight: `4.5px solid ${acc}`, pointerEvents: 'none', zIndex: 3 }}></div>
        <div style={{ position: 'absolute', bottom: '4mm', left: '4mm', width: '8mm', height: '8mm', borderBottom: `4.5px solid ${sec}`, borderLeft: `4.5px solid ${sec}`, pointerEvents: 'none', zIndex: 3 }}></div>
        <div style={{ position: 'absolute', bottom: '4mm', right: '4mm', width: '8mm', height: '8mm', borderBottom: `4.5px solid ${prim}`, borderRight: `4.5px solid ${prim}`, pointerEvents: 'none', zIndex: 3 }}></div>

        {waterMark}

        <div className="content" style={{ padding: '12mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              {renderDecorationsAroundName(nameFormatted, theme.decorations === 'crest' ? undefined : theme.decorations, theme, headlineFont, nameSize, data.tagline)}
            </div>
            <div style={{ textAlign: 'right', fontSize: '10.5pt', color: detailsMuted, lineHeight: 1.4, maxWidth: '80mm', wordWrap: 'break-word' }}>
              <div style={{ fontWeight: 600, color: prim }}>{data.address}</div>
              <div>Phone: {data.phone} &bull; <span style={{ fontWeight: 600, color: prim }}>{data.email}</span></div>
            </div>
          </div>
          {/* Elegant double dividing line with multi-tonal spacing */}
          <div style={{ marginTop: '5mm' }}>
            <div style={{ height: '2.5px', background: `linear-gradient(90deg, ${prim}, ${acc}, ${sec})` }}></div>
            <div style={{ height: '1px', background: acc, marginTop: '1.2mm' }}></div>
          </div>
          
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // 6. Bottom Weighted Layout (Heavy Modern Infographic Style)
  if (layout === 'bottom-heavy') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        {/* Dynamic header visual strip */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4mm', background: `linear-gradient(90deg, ${prim} 0%, ${acc} 50%, ${sec} 100%)`, zIndex: 3 }}></div>

        {waterMark}

        <div className="content" style={{ padding: '14mm 15mm 14mm', justifyContent: 'space-between' }}>
          {/* Minimal top name */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              {renderDecorationsAroundName(nameFormatted, theme.decorations === 'crest' ? undefined : theme.decorations, theme, headlineFont, nameSize, data.tagline)}
            </div>
          </div>

          

          {/* Freepik style ultra-bold, colorful footer banner */}
          <div style={{ 
            position: 'relative', 
            background: `linear-gradient(135deg, ${prim} 0%, ${sh2} 100%)`, 
            borderRadius: '6px', 
            padding: '4.5mm 6mm',
            color: '#FFFFFF',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            borderTop: `3px solid ${acc}`
          }}>
            {/* Background geometric accents inside the footer box */}
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: `linear-gradient(135deg, ${acc} 0%, ${sec} 100%)`, clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)', opacity: 0.35 }}></div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '4mm', fontSize: '11pt', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ fontWeight: 'bold', color: acc, textTransform: 'uppercase', fontSize: '9.5pt', marginBottom: '1mm', letterSpacing: '.06em' }}>Head Office</div>
                <div style={{ color: '#F3F4F6' }}>{data.address}</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: acc, textTransform: 'uppercase', fontSize: '9.5pt', marginBottom: '1mm', letterSpacing: '.06em' }}>Inquiries</div>
                <div style={{ color: '#F3F4F6' }}>Phone: {data.phone}</div>
                <div style={{ fontWeight: 'bold', color: '#FFFFFF' }}>Email: {data.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: acc, textTransform: 'uppercase', fontSize: '9.5pt', marginBottom: '1mm', letterSpacing: '.06em' }}>Corporate Identity</div>
                <div style={{ color: '#E2E8F0', fontStyle: 'italic' }}>{data.tagline || 'Original Certified Document'}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // 7. Minimalist Corner Accent Layout (Chic & Sleek Pattern)
  if (layout === 'minimalist-corner') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        {/* Top Left decorative triangles */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '25mm', height: '25mm', overflow: 'hidden', zIndex: 2 }}>
          <div style={{ position: 'absolute', top: '-15mm', left: '-15mm', width: '30mm', height: '30mm', background: prim, transform: 'rotate(45deg)' }}></div>
          <div style={{ position: 'absolute', top: '-17mm', left: '-17mm', width: '30mm', height: '30mm', background: acc, transform: 'rotate(45deg)', opacity: 0.8 }}></div>
        </div>

        {/* Bottom Right decorative triangles */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '25mm', height: '25mm', overflow: 'hidden', zIndex: 2 }}>
          <div style={{ position: 'absolute', bottom: '-15mm', right: '-15mm', width: '30mm', height: '30mm', background: sec, transform: 'rotate(45deg)' }}></div>
          <div style={{ position: 'absolute', bottom: '-17mm', right: '-17mm', width: '30mm', height: '30mm', background: acc, transform: 'rotate(45deg)', opacity: 0.85 }}></div>
        </div>

        {waterMark}

        <div className="content" style={{ padding: '16mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              {renderDecorationsAroundName(nameFormatted, theme.decorations === 'crest' ? undefined : theme.decorations, theme, headlineFont, nameSize, data.tagline)}
            </div>
          </div>
          <div style={{ height: '2px', background: `linear-gradient(90deg, ${acc} 0%, ${prim} 50%, ${sec} 100%)`, marginTop: '5mm', opacity: 0.9 }}></div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '11pt', 
            color: detailsMuted, 
            marginTop: '4mm',
            background: `linear-gradient(90deg, ${hexToRgba(sh3, 0.3)}, transparent)`,
            padding: '1.5mm 3.5mm',
            borderRadius: '4px',
            borderLeft: `2.5px solid ${acc}`
          }}>
            <span>{data.address}</span>
            <span>Phone: {data.phone} &nbsp;|&nbsp; <span style={{ fontWeight: 600, color: prim }}>{data.email}</span></span>
          </div>

          
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // 8. Vibrant Geometric BG
  if (layout === 'geometric-bg') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '18mm', overflow: 'hidden', zIndex: 2 }}>
          <svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <circle cx="10%" cy="-10" r="40" fill={hexToRgba(prim, 0.15)} />
            <circle cx="85%" cy="10" r="50" fill={hexToRgba(acc, 0.2)} />
            <rect x="40%" y="-30" width="80" height="80" rx="15" transform="rotate(45)" fill={hexToRgba(sec, 0.1)} />
          </svg>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2.5px', background: `linear-gradient(90deg, ${prim}, ${acc}, ${sec})` }}></div>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '22mm 15mm 16mm' }}>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {renderDecorationsAroundName(nameFormatted, theme.decorations === 'crest' ? undefined : theme.decorations, theme, headlineFont, nameSize, data.tagline)}
            <div style={{ fontSize: '11pt', color: detailsMuted, marginTop: '4mm' }}>
              {data.address} &bull; {data.phone} &bull; {data.email}
            </div>
          </div>
          
        </div>
        <div className="glossy-sheen"></div>
      </div>
    );
  }

  // 9. Tech Isometric Grid
  if (layout === 'tech-isometric') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Courier New', Courier, monospace" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: prim }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '12mm', borderTop: `1px solid ${hexToRgba(prim, 0.2)}`, padding: '2mm 5mm', display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt', color: prim }}>
          <span>{data.address}</span>
          <span>{data.phone} &bull; {data.email}</span>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '12mm 12mm 18mm' }}>
          <div style={{ borderBottom: `2.5px solid ${prim}`, paddingBottom: '3mm' }}>
            <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
            <div style={{ fontSize: '10.5pt', color: acc, letterSpacing: '2px', marginTop: '1mm' }}>{data.tagline}</div>
          </div>
          
        </div>
      </div>
    );
  }

  // 10. Classic Royal Seal
  if (layout === 'classic-seal') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Georgia', serif" }}>
        <div style={{ textAlign: 'center', padding: '10mm 15mm 0' }}>
          <div style={{ fontSize: '12pt', color: acc, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '2mm' }}>OFFICIAL STATIONERY</div>
          <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
          {data.tagline && <div style={{ fontSize: '10.5pt', fontStyle: 'italic', color: detailsMuted, marginTop: '1mm' }}>&ldquo;{data.tagline}&rdquo;</div>}
          <div style={{ width: '60mm', height: '1px', background: acc, margin: '4mm auto 1mm' }}></div>
          <div style={{ fontSize: '12pt', color: detailsMuted }}>{data.address} &bull; Ph: {data.phone} &bull; Email: {data.email}</div>
          <div style={{ width: '40mm', height: '0.5px', background: prim, margin: '1.5mm auto' }}></div>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '2mm 15mm 15mm' }}>
          
        </div>
      </div>
    );
  }

  // 11. Diagonal Sash Accent
  if (layout === 'diagonal-sash') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
        <div style={{ position: 'absolute', top: 0, left: 0, width: '40mm', height: '40mm', overflow: 'hidden', zIndex: 3 }}>
          <div style={{ position: 'absolute', top: '10mm', left: '-15mm', width: '60mm', height: '8mm', background: prim, transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '11.5pt', fontWeight: 'bold', letterSpacing: '1px' }}>
            
          </div>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm 15mm 22mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${acc}`, paddingBottom: '3mm' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '10.5pt', color: sec }}>{data.tagline}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10.5pt', color: detailsMuted }}>
              <div>{data.address}</div>
              <div>{data.phone} &bull; {data.email}</div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // 12. Abstract Wave Shapes
  if (layout === 'abstract-waves') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '14mm', overflow: 'hidden', zIndex: 2 }}>
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ width: '100%', height: '100%', position: 'absolute' }}>
            <path d="M0,80 C150,130 350,30 500,80 L500,150 L0,150 Z" fill={hexToRgba(prim, 0.8)} />
            <path d="M0,100 C180,50 320,120 500,90 L500,150 L0,150 Z" fill={hexToRgba(acc, 0.5)} />
          </svg>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm 20mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '10.5pt', color: sec, letterSpacing: '1px' }}>{data.tagline}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10.5pt', color: detailsMuted }}>
              <div>{data.address}</div>
              <div>Ph: {data.phone} &bull; {data.email}</div>
            </div>
          </div>
          <div style={{ height: '1.5px', background: `linear-gradient(90deg, ${prim}, transparent)`, marginTop: '4mm' }}></div>
          
        </div>
      </div>
    );
  }

  // 13. Corporate Column
  if (layout === 'corporate-column') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        {/* Elegant top accent line with double-tonal design */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4mm', background: `linear-gradient(90deg, ${prim} 0%, ${acc} 100%)`, zIndex: 3 }}></div>
        
        {waterMark}
        
        <div className="content" style={{ padding: '16mm 15mm 12mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            {/* Left side: Corporate Identity */}
            <div style={{ flex: 1, paddingRight: '8mm' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3mm' }}>
                {/* Visual accent vertical bar next to name */}
                <div style={{ width: '4px', height: '10mm', background: `linear-gradient(180deg, ${prim}, ${acc})`, borderRadius: '2px' }}></div>
                <div>
                  <div style={{ fontFamily: headlineFont, fontSize: `${nameSize + 1}pt`, fontWeight: 'bold', color: prim, letterSpacing: '0.5px' }}>
                    <span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span>
                  </div>
                  {data.tagline && (
                    <div style={{ fontSize: '10.5pt', color: acc, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '1mm' }}>
                      {data.tagline}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Structured Office Details Block */}
            <div style={{ 
              width: '85mm', 
              background: hexToRgba(prim, 0.03), 
              borderLeft: `3px solid ${acc}`, 
              borderRadius: '0 6px 6px 0',
              padding: '3.5mm 4.5mm', 
              fontSize: '11pt', 
              color: detailsMuted, 
              lineHeight: 1.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontWeight: 'bold', color: prim, fontSize: '9.5pt', letterSpacing: '1px', marginBottom: '1.5mm', textTransform: 'uppercase' }}>
                Office Address & Contact
              </div>
              <div style={{ marginBottom: '1mm' }}>{data.address}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2mm' }}>
                <span>P: {data.phone}</span>
                <span>&bull;</span>
                <span style={{ fontWeight: 600, color: prim }}>{data.email}</span>
              </div>
            </div>
          </div>

          {/* Elegant horizontal separator under the header */}
          <div style={{ height: '1.5px', background: `linear-gradient(90deg, ${acc} 0%, ${hexToRgba(prim, 0.1)} 100%)`, marginTop: '5mm', opacity: 0.85 }}></div>
        </div>
        
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // 14. Editorial Luxury Border
  if (layout === 'editorial-luxury') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Georgia', serif" }}>
        <div style={{ position: 'absolute', top: '5mm', left: '5mm', right: '5mm', bottom: '5mm', border: `1px solid ${acc}`, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '7mm', left: '7mm', right: '7mm', bottom: '7mm', border: `0.5px solid ${prim}`, opacity: 0.5, pointerEvents: 'none' }}></div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim, letterSpacing: '1px' }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
            <div style={{ fontSize: '10.5pt', color: acc, fontStyle: 'italic', marginTop: '1.5mm' }}>{data.tagline}</div>
            <div style={{ fontSize: '12pt', color: detailsMuted, marginTop: '3mm', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {data.address} &nbsp;&bull;&nbsp; Ph: {data.phone} &nbsp;&bull;&nbsp; {data.email}
            </div>
          </div>
          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${acc} 50%, transparent)`, marginTop: '4mm' }}></div>
        </div>
      </div>
    );
  }

  // 15. Premium Business Layout
  if (layout === 'premium-business') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '35mm', background: `linear-gradient(135deg, ${prim}, ${sh2})`, zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '10mm', right: '15mm', fontSize: '9pt', color: '#FFFFFF', textAlign: 'right', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{data.companyName}</div>
            <div>{data.address}</div>
            <div>Phone: {data.phone} | Email: {data.email}</div>
          </div>
        </div>
        
        {waterMark}

        <div className="content" style={{ padding: '45mm 15mm 15mm' }}>
           <div style={{ borderLeft: `6px solid ${acc}`, paddingLeft: '10mm', paddingRight: '10mm' }}>
             <div style={{ fontSize: '24pt', fontWeight: 'bold', color: prim }}>{nameFormatted}</div>
             <div style={{ fontSize: '14pt', color: detailsMuted, marginTop: '3mm' }}>{data.tagline}</div>
             
             <div style={{ marginTop: '10mm', borderTop: `1px solid ${sh3}`, paddingTop: '5mm', color: detailsMuted }}>
               <div style={{ fontWeight: 'bold', color: prim }}>Authorized Representative</div>
               <div style={{ fontSize: '13pt', marginTop: '1mm' }}>{data.empName}</div>
               <div style={{ fontSize: '11pt', marginTop: '0.5mm' }}>{data.empRole}</div>
               <div style={{ fontSize: '11pt', marginTop: '2mm' }}>{data.empPhone}</div>
               <div style={{ fontSize: '11pt' }}>{data.empEmail}</div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  // 15. Bento Modular Panels
  if (layout === 'bento-modular') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        {waterMark}
        <div className="content" style={{ padding: '12mm 12mm' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '3mm', marginBottom: '4mm' }}>
            <div style={{ background: hexToRgba(prim, 0.03), borderRadius: '8px', padding: '4mm', border: `1px solid ${hexToRgba(prim, 0.08)}` }}>
              <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '11pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
            </div>
            <div style={{ background: hexToRgba(sec, 0.04), borderRadius: '8px', padding: '4mm', border: `1px solid ${hexToRgba(sec, 0.1)}`, fontSize: '12pt', color: detailsMuted }}>
              <div><b>Address:</b> {data.address}</div>
              <div style={{ marginTop: '1.5mm' }}><b>Phone:</b> {data.phone}</div>
              <div><b>Email:</b> {data.email}</div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // 16. Retro Brutalist Border
  if (layout === 'retro-brutalist') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Impact', 'Arial Black', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '16mm', background: prim, borderBottom: '3px solid #000000', display: 'flex', alignItems: 'center', padding: '0 10mm', justifyContent: 'space-between', color: '#FFFFFF', zIndex: 3 }}>
          <span style={{ fontSize: '18pt', letterSpacing: '1px' }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted.toUpperCase()}</span></span>
          <span style={{ fontSize: '10.5pt', background: acc, color: '#000000', padding: '1mm 3mm', fontWeight: 'bold', border: '2px solid #000000' }}>{data.tagline || 'STATIONERY'}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '10mm', background: '#000000', color: '#FFFFFF', display: 'flex', alignItems: 'center', padding: '0 10mm', fontSize: '10.5pt', justifyContent: 'space-between' }}>
          <span>{data.address.toUpperCase()}</span>
          <span>{data.phone} &bull; {data.email.toUpperCase()}</span>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '22mm 12mm 16mm' }}>
          
        </div>
      </div>
    );
  }

  // 17. Organic Leaf Shape
  if (layout === 'organic-leaf') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '30mm', height: '30mm', opacity: 0.15, overflow: 'hidden' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <path d="M0,100 C30,40 70,40 100,0 C70,60 30,60 0,100" fill={prim} />
          </svg>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ borderLeft: `3px solid ${acc}`, paddingLeft: '4mm' }}>
            <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: '600', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
            <div style={{ fontSize: '10.5pt', color: detailsMuted, marginTop: '1mm' }}>{data.tagline} &bull; {data.address} &bull; {data.phone}</div>
          </div>
          
        </div>
      </div>
    );
  }

  // 18. Architectural Thin Grid
  if (layout === 'architectural-lines') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Courier New', Courier, monospace" }}>
        <div style={{ position: 'absolute', top: '10mm', left: '10mm', width: '6mm', height: '6mm', borderTop: '1px solid #777777', borderLeft: '1px solid #777777', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', top: '10mm', right: '10mm', width: '6mm', height: '6mm', borderTop: '1px solid #777777', borderRight: '1px solid #777777', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '10mm', left: '10mm', width: '6mm', height: '6mm', borderBottom: '1px solid #777777', borderLeft: '1px solid #777777', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '10mm', right: '10mm', width: '6mm', height: '6mm', borderBottom: '1px solid #777777', borderRight: '1px solid #777777', opacity: 0.5 }}></div>
        {waterMark}
        <div className="content" style={{ padding: '18mm 18mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '0.5px solid #BBBBBB', paddingBottom: '4mm' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${nameSize - 2}pt`, fontWeight: 'bold', color: prim, letterSpacing: '1px' }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted.toUpperCase()}</span></div>
              <div style={{ fontSize: '9.5pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '9.5pt', color: detailsMuted, lineHeight: 1.4 }}>
              <div>{data.address}</div>
              <div>Ph: {data.phone} &bull; {data.email}</div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // 19. Executive Signature Monogram
  if (layout === 'executive-signature') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Times New Roman', Times, serif" }}>
        <div style={{ position: 'absolute', top: '8mm', left: '15mm', fontSize: '55pt', fontFamily: headlineFont, color: prim, opacity: 0.08, fontWeight: 'bold', pointerEvents: 'none' }}>
          {initials}
        </div>
        {waterMark}
        <div className="content" style={{ padding: '18mm 15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1.5px solid ${prim}`, paddingBottom: '2.5mm', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${nameSize}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '10.5pt', fontStyle: 'italic', color: acc, marginTop: '0.5mm' }}>{data.tagline}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10.5pt', color: detailsMuted }}>
              <div>{data.address}</div>
              <div>Phone: {data.phone} &bull; Email: {data.email}</div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // 21. Freepik Corporate
  if (layout === 'freepik-corporate-blue') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42mm', background: `linear-gradient(135deg, ${prim} 0%, ${acc} 100%)`, zIndex: 1, padding: '8mm 12mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
             <div style={{ color: '#ffffff' }}>
               <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', lineHeight: 1.15 }}>{nameFormatted}</div>
               <div style={{ fontSize: '11.5pt', opacity: 0.9, marginTop: '1mm' }}>{data.tagline}</div>
             </div>
           </div>
           <div style={{ color: '#ffffff', textAlign: 'right', fontSize: '13pt', lineHeight: 1.45, opacity: 0.95 }}>
             <div>📍 {data.address}</div>
             <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
           </div>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '48mm 15mm 20mm' }}></div>
      </div>
    );
  }

  // 22. Canva Creative Wave
  if (layout === 'canva-creative-wave') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42mm', overflow: 'hidden' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 1440 320">
            <path fill={hexToRgba(prim, 0.1)} fillOpacity="1" d="M0,160L48,165.3C96,171,192,181,288,160C384,139,480,85,576,96C672,107,768,181,864,213.3C960,245,1056,235,1152,197.3C1248,160,1344,96,1392,64L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
            <path fill={prim} fillOpacity="1" d="M0,64L48,85.3C96,107,192,149,288,149.3C384,149,480,107,576,101.3C672,96,768,128,864,160C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
          </svg>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42mm', padding: '6mm 12mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, boxSizing: 'border-box' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
             <div style={{ color: '#ffffff' }}>
               <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', lineHeight: 1.15 }}>{nameFormatted}</div>
               <div style={{ fontSize: '11.5pt', opacity: 0.9, marginTop: '1mm' }}>{data.tagline}</div>
             </div>
           </div>
           <div style={{ color: '#ffffff', textAlign: 'right', fontSize: '13pt', lineHeight: 1.45, opacity: 0.95 }}>
             <div>📍 {data.address}</div>
             <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
           </div>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '48mm 15mm 20mm' }}></div>
      </div>
    );
  }

  // 23. Modern Gradient Edge
  if (layout === 'modern-gradient-edge') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6mm', background: `linear-gradient(to bottom, ${prim}, ${acc})` }}></div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm 15mm 21mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${prim}`, paddingBottom: '5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontFamily: headlineFont, fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
                <div style={{ fontSize: '11.5pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: detailsMuted, lineHeight: 1.45 }}>
              <div>📍 {data.address}</div>
              <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 24. Luxury Gold Foil
  if (layout === 'luxury-gold-foil') {
    return (
      <div className="pad" style={{ background: '#FAF8F5', fontFamily: "'Georgia', serif" }}>
        <div style={{ position: 'absolute', top: '8mm', left: '8mm', right: '8mm', bottom: '8mm', border: '1.5px solid #AA771C', pointerEvents: 'none', boxSizing: 'border-box' }}></div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #AA771C', paddingBottom: '5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', color: '#AA771C', lineHeight: 1.15 }}>{nameFormatted}</div>
                <div style={{ fontSize: '11.5pt', color: '#BF953F', fontStyle: 'italic', marginTop: '1mm' }}>{data.tagline}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: '#775211', lineHeight: 1.45 }}>
              <div>📍 {data.address}</div>
              <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 25. Startup Geometric
  if (layout === 'startup-geometric') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: '-15mm', right: '-15mm', width: '60mm', height: '60mm', background: hexToRgba(prim, 0.08), borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', top: '25mm', right: '-10mm', width: '40mm', height: '40mm', background: hexToRgba(acc, 0.08), borderRadius: '50%' }}></div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${prim}`, paddingBottom: '5mm', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
                <div style={{ fontSize: '11.5pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: detailsMuted, lineHeight: 1.45 }}>
              <div>📍 {data.address}</div>
              <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 26. Law Firm Classic
  if (layout === 'law-firm-classic') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Times New Roman', serif" }}>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2.5px double ${prim}`, paddingBottom: '5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontSize: `${nameSize + 5}pt`, fontWeight: 'bold', color: prim, letterSpacing: '0.5px', lineHeight: 1.15 }}>{nameFormatted.toUpperCase()}</div>
                <div style={{ fontSize: '11.5pt', color: acc, letterSpacing: '2px', marginTop: '1.5mm', textTransform: 'uppercase' }}>{data.tagline || 'Attorneys at Law'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: detailsMuted, lineHeight: 1.45 }}>
              <div>📍 {data.address}</div>
              <div>Phone: {data.phone} &bull; Email: {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 27. Creative Agency Bold
  if (layout === 'creative-agency-bold') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42mm', background: prim, zIndex: 1, padding: '8mm 12mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
             <div style={{ color: '#ffffff' }}>
               <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', lineHeight: 1.15, letterSpacing: '-0.5px' }}>{nameFormatted.toUpperCase()}</div>
               <div style={{ fontSize: '11.5pt', color: acc, marginTop: '1mm', fontWeight: '500' }}>{data.tagline}</div>
             </div>
           </div>
           <div style={{ color: '#ffffff', textAlign: 'right', fontSize: '13pt', lineHeight: 1.45, opacity: 0.95 }}>
             <div>📍 {data.address}</div>
             <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
           </div>
        </div>
        {waterMark}
        <div className="content" style={{ padding: '48mm 15mm 20mm' }}></div>
      </div>
    );
  }

  // 28. Medical Clean
  if (layout === 'medical-clean-cross') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', sans-serif" }}>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${acc}`, paddingBottom: '5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
                <div style={{ fontSize: '11.5pt', color: detailsMuted, marginTop: '1.5mm' }}>{data.tagline || 'Medical & Healthcare Services'}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: detailsMuted, lineHeight: 1.45 }}>
              <div>📍 {data.address}</div>
              <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 29. Real Estate Arch
  if (layout === 'real-estate-arch') {
    return (
      <div className="pad" style={{ background: customPaper, fontFamily: "'Georgia', serif" }}>
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '90mm', height: '42mm', background: hexToRgba(prim, 0.04), borderBottomLeftRadius: '45mm', borderBottomRightRadius: '45mm' }}></div>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1.5px solid ${prim}`, paddingBottom: '5mm', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontSize: `${nameSize + 4}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
                <div style={{ fontSize: '11.5pt', color: acc, fontStyle: 'italic', marginTop: '1.5mm' }}>{data.tagline}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: detailsMuted, lineHeight: 1.45 }}>
              <div>📍 {data.address}</div>
              <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 30. Hospitality Elegant
  if (layout === 'hospitality-elegant') {
    return (
      <div className="pad" style={{ background: '#FAF8F5', fontFamily: "'Cinzel', serif" }}>
        {waterMark}
        <div className="content" style={{ padding: '15mm 15mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${hexToRgba(prim, 0.25)}`, paddingBottom: '5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm' }}>
              <div>
                <div style={{ fontSize: `${nameSize + 4}pt`, color: prim, letterSpacing: '2px', fontWeight: 'bold', lineHeight: 1.15 }}>{nameFormatted}</div>
                <div style={{ fontSize: '11pt', color: acc, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '1.5mm' }}>{data.tagline}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '13pt', color: detailsMuted, lineHeight: 1.45, fontFamily: "'Segoe UI', sans-serif" }}>
              <div>📍 {data.address}</div>
              <div>📞 {data.phone} &bull; ✉️ {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 20. Minimalist Stamped Border (Default and Fallback)
  return (
    <div className="pad" style={{ background: customPaper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {gridStyle !== 'none' && <div style={backgroundGridStyles}></div>}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 0% 0%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%), radial-gradient(circle at 100% 0%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 0% 100%, ${hexToRgba(acc, 0.035)} 0%, transparent 35%), radial-gradient(circle at 100% 100%, ${hexToRgba(prim, 0.04)} 0%, transparent 30%)`, zIndex: 0, pointerEvents: "none" }}></div>
        <PadTopAesthetics theme={theme} />
        <PadBottomAesthetics theme={theme} />
        
      <div style={{ position: 'absolute', top: '6mm', left: '6mm', right: '6mm', bottom: '6mm', border: `1px solid ${hexToRgba(prim, 0.2)}`, pointerEvents: 'none' }}></div>
      {waterMark}
      <div className="content" style={{ padding: '15mm 15mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: headlineFont, fontSize: `${nameSize - 1}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
            <div style={{ fontSize: '11pt', color: detailsMuted, marginTop: '1mm' }}>{data.address} &bull; Ph: {data.phone}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10.5pt', fontWeight: 600, color: prim }}>
            {data.email}
          </div>
        </div>
        <div style={{ height: '1px', background: prim, marginTop: '4mm', opacity: 0.5 }}></div>
        
      </div>
    </div>
  );
};

export const PadPreview: React.FC<PadPreviewProps> = (props) => {

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PadPreviewInner {...props} />
      {props.texture && props.texture !== 'none' && (
        <div style={{ ...getTextureStyles(props.texture), position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'none' }} />
      )}
    </div>
  );
};
