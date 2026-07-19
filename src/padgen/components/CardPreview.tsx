import React from 'react';
import { CompanyData, Theme } from '../types';
import { getInitials, logoMarkSVG, hexToRgba, formatCompanyName, getTextureStyles, getGridStyles } from '../utils';


interface CardPreviewProps {
  data: CompanyData;
  theme: Theme;
  shape: any;
  layout: any;
  headlineFont: string;
  logoStyle: any;
  gridStyle?: any;
  texture?: any;
}

const renderDecorationsAroundNameCard = (
  name: string,
  decorations: string | undefined,
  theme: Theme,
  headlineFont: string,
  cardNameSize: number,
  tagline: string
) => {
  const dColor = theme.decorationColor || theme.accent;
  const secColor = theme.secondary || theme.accent;
  const sh3 = theme.shade3 || '#F3F4F6';

  const nameEl = (
    <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize}pt`, fontWeight: "bold", color: theme.primary, letterSpacing: ".03em", lineHeight: 1.15, whiteSpace: "nowrap" }}>
      {name}
    </div>
  );

  const taglineEl = tagline ? (
    <div style={{ fontSize: '5.2pt', color: secColor, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '0.4mm', fontWeight: 700 }}>
      {tagline}
    </div>
  ) : null;

  switch (decorations) {
    case 'brackets':
      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1.5mm' }}>
            <span style={{ fontSize: `${cardNameSize + 2}pt`, fontFamily: headlineFont, color: dColor, fontWeight: 300, lineHeight: 1 }}>[</span>
            {nameEl}
            <span style={{ fontSize: `${cardNameSize + 2}pt`, fontFamily: headlineFont, color: dColor, fontWeight: 300, lineHeight: 1 }}>]</span>
          </div>
          {taglineEl}
        </div>
      );

    case 'horizontal-lines':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', width: '100%', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '0.8px', background: `linear-gradient(90deg, transparent, ${dColor})` }}></div>
            {nameEl}
            <div style={{ flex: 1, height: '0.8px', background: `linear-gradient(90deg, ${dColor}, transparent)` }}></div>
          </div>
          {taglineEl}
        </div>
      );

    case 'subtle-box':
      return (
        <div style={{ 
          border: `1px solid ${dColor}`, 
          background: `linear-gradient(135deg, ${sh3} 0%, rgba(255,255,255,0.9) 100%)`, 
          padding: '1mm 3mm', 
          borderRadius: '2px',
          display: 'inline-block',
          textAlign: 'center'
        }}>
          {nameEl}
          {taglineEl}
        </div>
      );

    case 'top-bottom-dots':
      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1mm', marginBottom: '1mm' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: '1.8px', height: '1.8px', borderRadius: '50%', backgroundColor: i === 2 ? theme.accent : dColor, opacity: 0.8 }} />
            ))}
          </div>
          {nameEl}
          {taglineEl}
          <div style={{ display: 'flex', gap: '1mm', marginTop: '1mm' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: '1.8px', height: '1.8px', borderRadius: '50%', backgroundColor: i === 2 ? theme.accent : dColor, opacity: 0.8 }} />
            ))}
          </div>
        </div>
      );

    case 'corner-flourish':
      return (
        <div style={{ display: 'inline-block', position: 'relative', padding: '1.5mm 3.5mm' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '2mm', height: '2mm', borderTop: `1px solid ${dColor}`, borderLeft: `1px solid ${dColor}` }}></div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '2mm', height: '2mm', borderTop: `1px solid ${dColor}`, borderRight: `1px solid ${dColor}` }}></div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '2mm', height: '2mm', borderBottom: `1px solid ${dColor}`, borderLeft: `1px solid ${dColor}` }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '2mm', height: '2mm', borderBottom: `1px solid ${dColor}`, borderRight: `1px solid ${dColor}` }}></div>
          {nameEl}
          {taglineEl}
        </div>
      );

    default:
      return (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
          {nameEl}
          {taglineEl}
        </div>
      );
  }
};

const CardPreviewInner: React.FC<CardPreviewProps> = ({
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
  const logoImgHtml = data.customLogo
    ? `<img src="${data.customLogo}" style="width:100%; height:100%; object-fit:contain; border-radius:inherit;" />`
    : null;
  const mark = logoImgHtml || logoMarkSVG(initials, shape, theme.primary, theme.accent, '#FFFFFF', logoStyle);
  const whiteLogoMark = logoImgHtml || logoMarkSVG(initials, shape, '#FFFFFF', theme.accent, theme.primary, logoStyle);
  const roleLine = data.empRole || '';
  const cardNameSize = (data.companyName || '').length <= 18 ? 12 : 9.5;
  const chipBg = hexToRgba(theme.paper === '#FFFFFF' ? '#FFFFFF' : theme.paper, 0.9);
  const mobileNumber = data.empPhone ? data.empPhone.trim() : data.phone;
  const nameFormatted = formatCompanyName(data.companyName, data.casing);
  const detailsMuted = hexToRgba(theme.primary, 0.75);


  const prim = theme.primary;
  const acc = theme.accent;
  const sec = theme.secondary || theme.accent;
  const sh2 = theme.shade2 || prim;
  const sh3 = theme.shade3 || '#F3F4F6';

  // Layout 1: Centered / Stacked Classic (With Canva style top/bottom geometric accents)
  if (layout === 'centered') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif", position: 'relative' }}>
        {/* Colorful geometric frame details */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1.5mm', background: `linear-gradient(90deg, ${prim}, ${acc}, ${sec})` }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1.5mm', background: `linear-gradient(90deg, ${sec}, ${acc}, ${prim})` }}></div>
        
        {/* QR Code moved inside content */}
        
        {/* Corner angled triangles */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '12mm', height: '12mm', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-6mm', left: '-6mm', width: '12mm', height: '12mm', background: prim, transform: 'rotate(45deg)', opacity: 0.15 }}></div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12mm', height: '12mm', overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', bottom: '-6mm', right: '-6mm', width: '12mm', height: '12mm', background: acc, transform: 'rotate(45deg)', opacity: 0.15 }}></div>
        </div>

        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm 5mm 3.5mm', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {/* QR Code and Company Name Header wrapper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize, data.tagline)}
            </div>
          </div>

          {/* Employee Center Info with subtle watermark */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '22mm', height: '22mm', opacity: 0.1, zIndex: 0 }} dangerouslySetInnerHTML={{ __html: mark }} />
            <div style={{ background: chipBg, padding: '1.5mm 5mm', borderRadius: '4px', textAlign: 'center', border: `1px solid ${hexToRgba(acc, 0.25)}`, boxShadow: '0 2px 8px rgba(0,0,0,.04)', zIndex: 1 }}>
              <div style={{ fontSize: '9.8pt', fontWeight: 800, color: prim, letterSpacing: '.01em' }}>{data.empName}</div>
              {roleLine && (
                <div style={{ fontSize: '6.8pt', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: acc, marginTop: '0.6mm' }}>
                  {roleLine}
                </div>
              )}
            </div>
          </div>

          {/* Symmetrical bottom details */}
          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3mm' }}>
            <div style={{ fontSize: '5.8pt', lineHeight: 1.45, color: prim, textAlign: 'left' }}>
              <div style={{ fontWeight: 600 }}>{data.address}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1mm', color: detailsMuted }}>
                <span>{mobileNumber}</span>
                <span>&bull;</span>
                <span>{data.email}</span>
                {data.empEmail && <span>&bull; {data.empEmail}</span>}
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

  // Layout 2: Split / Ribbon Corner (Intersecting polygon layouts)
  if (layout === 'split') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Dynamic diagonal color band on the right */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: `linear-gradient(135deg, ${prim} 0%, ${sh2} 100%)`, clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)', zIndex: 1 }}></div>
        <div style={{ position: 'absolute', top: 0, right: '39%', bottom: 0, width: '1.5mm', background: acc, transform: 'skewX(-20deg)', zIndex: 1 }}></div>

        <div className="content" style={{ display: 'flex', height: '100%', padding: '4mm 5mm', position: 'relative', zIndex: 2 }}>
          {/* Left Block: Content */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingRight: '2mm' }}>
            <div>
              {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize - 1, '')}
              <div style={{ fontSize: '10pt', fontWeight: 800, color: prim, marginTop: '2.5mm', lineHeight: 1.15 }}>
                {data.empName}
              </div>
              <div style={{ fontSize: '6.5pt', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: acc, marginTop: '0.5mm' }}>
                {roleLine}
              </div>
            </div>
            <div style={{ fontSize: '5.6pt', lineHeight: 1.35, color: prim, borderTop: `1.5px solid ${hexToRgba(acc, 0.3)}`, paddingTop: '1.5mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{data.address}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1mm', color: detailsMuted, marginTop: '0.4mm' }}>
                  <span>Mob: {mobileNumber}</span>
                  <span>|</span>
                  <span>Email: {data.email}</span>
                </div>
              </div>
              <div style={{ background: 'white', padding: '1px', display: 'inline-block' }}>
              </div>
            </div>
          </div>

          {/* Right Block: Logo inside colorband */}
          <div style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* White card container for logo */}
            <div style={{ 
              width: '16mm', 
              height: '16mm', 
              background: '#FFFFFF', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              border: `2px solid ${acc}`,
              padding: '2px'
            }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // Layout 3: Sideband (Vibrant vertical accent stripes with high-contrast shapes)
  if (layout === 'sideband') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Left vertical colorband with gorgeous multi-tone gradients */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '22mm', background: `linear-gradient(135deg, ${prim} 0%, ${sh2} 100%)`, zIndex: 1 }}>
          {/* Decorative skewed stripe inside left band */}
          <div style={{ position: 'absolute', bottom: '2mm', left: 0, right: 0, height: '4mm', background: acc, transform: 'skewY(-15deg)', opacity: 0.4 }}></div>
        </div>
        <div style={{ position: 'absolute', top: 0, left: '22mm', bottom: 0, width: '1.2mm', background: acc, zIndex: 1 }}></div>

        <div className="content" style={{ display: 'flex', height: '100%', position: 'relative', zIndex: 2 }}>
          {/* Left Block - Emblem inside left band */}
          <div style={{ width: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '13mm', height: '13mm', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>

          {/* Right Block - Content details */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '4mm 4mm 4mm 5mm', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize - 1, data.tagline)}
              
              <div style={{ marginTop: '2.5mm' }}>
                <div style={{ fontSize: '10pt', fontWeight: 800, color: prim, lineHeight: 1.1 }}>{data.empName}</div>
                {roleLine && (
                  <div style={{ fontSize: '6.5pt', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: acc, marginTop: '0.4mm' }}>
                    {roleLine}
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '5.5pt', lineHeight: 1.3, color: prim, borderTop: `1px solid ${hexToRgba(acc, 0.25)}`, paddingTop: '1.5mm' }}>
              <div>{data.address}</div>
              <div style={{ color: detailsMuted }}>{mobileNumber} &bull; {data.email}</div>
            </div>
          </div>
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // Layout 4: Asymmetric Columns (modern-split - Canva & Freepik bestseller style)
  if (layout === 'modern-split') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <div className="content" style={{ display: 'flex', height: '100%', position: 'relative' }}>
          
          {/* Left Block (42% width): Gorgeous linear gradient with polygon shapes */}
          <div style={{ 
            width: '42%', 
            background: `linear-gradient(135deg, ${prim} 0%, ${sh2} 100%)`, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            padding: '4mm 3.5mm', 
            boxSizing: 'border-box', 
            color: '#FFFFFF', 
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Colorful angled design elements */}
            <div style={{ position: 'absolute', top: '-10mm', right: '-10mm', width: '20mm', height: '20mm', background: acc, transform: 'rotate(45deg)', opacity: 0.25 }}></div>
            <div style={{ position: 'absolute', bottom: '-5mm', left: '-5mm', width: '15mm', height: '15mm', background: sec, transform: 'rotate(45deg)', opacity: 0.2 }}></div>

            <div style={{ 
              width: '11mm', 
              height: '11mm', 
              background: '#FFFFFF', 
              padding: '2px', 
              borderRadius: '4px', 
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              zIndex: 1 
            }} dangerouslySetInnerHTML={{ __html: mark }} />

            <div style={{ zIndex: 1, marginTop: '2mm' }}>
              <div style={{ fontFamily: headlineFont, fontSize: '9pt', fontWeight: 'bold', color: '#FFFFFF', lineHeight: 1.25 }}>
                <span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span>
              </div>
              <div style={{ fontSize: '5.5pt', color: acc, letterSpacing: '.04em', marginTop: '0.8mm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {data.tagline || 'Original Standard'}
              </div>
            </div>
            {/* Split dividing border */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '1.2mm', background: acc }}></div>
          </div>

          {/* Right Block (58% width): Details on clean paper */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4.5mm 4.5mm', boxSizing: 'border-box' }}>
            <div>
              <div style={{ fontSize: '10.5pt', fontWeight: 800, color: prim, lineHeight: 1.1 }}>{data.empName}</div>
              {roleLine && (
                <div style={{ fontSize: '6.8pt', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: acc, marginTop: '0.8mm' }}>
                  {roleLine}
                </div>
              )}
            </div>

            <div style={{ fontSize: '5.6pt', lineHeight: 1.35, color: prim }}>
              <div style={{ fontWeight: 600, color: prim }}>{data.address}</div>
              <div style={{ marginTop: '1mm', color: detailsMuted }}>Mobile: <span style={{ fontWeight: 600, color: prim }}>{mobileNumber}</span></div>
              <div style={{ color: detailsMuted }}>Email: <span style={{ fontWeight: 600, color: prim }}>{data.email}</span></div>
            </div>
          </div>
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // Layout 5: Minimalist Right-Aligned (Chic geometric overlay)
  if (layout === 'minimalist-right') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Abstract background graphics */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '30mm', height: '100%', background: `linear-gradient(90deg, ${hexToRgba(sh3, 0.4)}, transparent)`, zIndex: 0 }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40mm', height: '2mm', background: `linear-gradient(90deg, ${prim}, ${acc})`, zIndex: 0 }}></div>
        
        {/* Large background faded watermark on left */}
        <div style={{ position: 'absolute', left: '4mm', top: '50%', transform: 'translateY(-50%)', width: '28mm', height: '28mm', opacity: 0.1, zIndex: 0 }} dangerouslySetInnerHTML={{ __html: mark }} />
        
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm 5mm', justifyContent: 'space-between', zIndex: 1, textAlign: 'right' }}>
          <div>
            {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize - 0.5, data.tagline)}
          </div>

          <div style={{ marginTop: '2mm' }}>
            <div style={{ fontSize: '10.5pt', fontWeight: 800, color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.8pt', fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '.06em' }}>{roleLine}</div>
          </div>

          <div style={{ fontSize: '5.6pt', color: prim, lineHeight: 1.35, borderTop: `1px dashed ${acc}`, paddingTop: '1.5mm' }}>
            <div style={{ fontWeight: 600 }}>{data.address}</div>
            <div>Cell: {mobileNumber} &nbsp;|&nbsp; {data.email}</div>
          </div>
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // Layout 6: Inverted Accent Band (Dual Tone contrast layout - premium executive look)
  if (layout === 'dark-accent') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Main upper white area */}
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          
          <div style={{ padding: '4mm 4.5mm 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '3mm' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize - 0.5, '')}
              
              <div style={{ fontSize: '9.8pt', fontWeight: 800, color: prim, marginTop: '2mm' }}>
                {data.empName}
              </div>
              <div style={{ fontSize: '6.5pt', fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {roleLine}
              </div>
            </div>
            
            {/* Premium boxed logo */}
            <div style={{ 
              width: '11mm', 
              height: '11mm', 
              background: `linear-gradient(135deg, ${sh3} 0%, #FFFFFF 100%)`, 
              border: `1.5px solid ${acc}`, 
              borderRadius: '4px',
              padding: '1.5px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
            }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>

          {/* Solid primary bottom band with multiple visual sublayers */}
          <div>
            <div style={{ height: '1.5px', background: acc }}></div>
            <div style={{ 
              background: `linear-gradient(90deg, ${prim} 0%, ${sh2} 100%)`, 
              color: '#FFFFFF', 
              padding: '2.5mm 4.5mm',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '5.5pt', color: '#ECEFF1', alignItems: 'center' }}>
                <span style={{ maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{data.address}</span>
                <span style={{ textAlign: 'right' }}>Mob: {mobileNumber} &bull; {data.email}</span>
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

  // Layout 7: Floating Shield Emblem (shield-badge style with intersecting lines)
  if (layout === 'shield-badge') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        {/* Decorative frame vectors */}
        <div style={{ position: 'absolute', top: '1.5mm', left: '1.5mm', right: '1.5mm', bottom: '1.5mm', border: `1px solid ${hexToRgba(acc, 0.4)}`, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '15mm', height: '15mm', background: `linear-gradient(135deg, ${prim}, transparent)`, opacity: 0.1, pointerEvents: 'none' }}></div>

        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4mm 5mm', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {/* Top Header with floating logo on the left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3.5mm' }}>
            <div style={{ 
              width: '10mm', 
              height: '10mm', 
              flexShrink: 0, 
              background: '#FFFFFF', 
              borderRadius: '4px',
              border: `1.5px solid ${prim}`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '1.5px' 
            }} dangerouslySetInnerHTML={{ __html: mark }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize - 1, data.tagline)}
            </div>
          </div>

          {/* Floating line divider */}
          <div style={{ height: '1.5px', background: `linear-gradient(90deg, ${acc} 0%, rgba(255,255,255,0) 100%)` }}></div>

          {/* Name and Designation */}
          <div style={{ paddingLeft: '1mm' }}>
            <div style={{ fontSize: '10.5pt', fontWeight: 800, color: prim, letterSpacing: '.01em' }}>{data.empName}</div>
            <div style={{ fontSize: '6.8pt', fontWeight: 700, color: acc, textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '0.2mm' }}>{roleLine}</div>
          </div>

          {/* Minimal foot */}
          <div style={{ fontSize: '5.5pt', color: prim, opacity: 0.95, lineHeight: 1.35, borderLeft: `2.5px solid ${acc}`, paddingLeft: '2.5mm' }}>
            <div style={{ fontWeight: 600 }}>{data.address}</div>
            <div style={{ color: detailsMuted }}>Mobile: {mobileNumber} &nbsp;|&nbsp; Email: {data.email}</div>
          </div>
        </div>
        <div className="glossy-sheen"></div>
        <div className="glossy-glare"></div>
        <div className="glossy-edge"></div>
      </div>
    );
  }

  // Layout 8: Modern Bento Grid Card (bento-grid)
  if (layout === 'bento-grid') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div className="content" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2mm', height: '100%', padding: '2.5mm' }}>
          <div style={{ background: hexToRgba(prim, 0.04), borderRadius: '4px', border: `1px solid ${hexToRgba(prim, 0.1)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2mm' }}>
            <div style={{ width: '10mm', height: '10mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
            <div style={{ fontSize: '5.5pt', color: prim, fontWeight: 'bold', textAlign: 'center', marginTop: '2mm' }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1mm 2mm' }}>
            <div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
              <div style={{ fontSize: '6.5pt', color: acc, fontWeight: 600 }}>{roleLine}</div>
            </div>
            <div style={{ fontSize: '5.2pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(acc, 0.2)}`, paddingTop: '1mm' }}>
              <div>{data.address}</div>
              <div style={{ color: prim, fontWeight: 'bold', marginTop: '0.5mm' }}>{mobileNumber} &bull; {data.email}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 9: Dynamic Diagonal Split (diagonal-split)
  if (layout === 'diagonal-split') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '25mm', height: '100%', background: `linear-gradient(135deg, ${prim} 0%, ${sh2} 100%)`, clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0 100%)' }}></div>
        <div className="content" style={{ display: 'flex', height: '100%', position: 'relative', zIndex: 2 }}>
          <div style={{ width: '22mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '11mm', height: '11mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4mm 4mm 4mm 2mm' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '5.5pt', color: detailsMuted }}>{data.tagline}</div>
            </div>
            <div>
              <div style={{ fontSize: '10pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
              <div style={{ fontSize: '6.5pt', color: acc, fontWeight: 700 }}>{roleLine}</div>
            </div>
            <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
              {data.address} &bull; Ph: {mobileNumber} &bull; {data.email}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 10: Retro Tech Monospaced Card (retro-tech)
  if (layout === 'retro-tech') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Courier New', monospace" }}>
        <div style={{ position: 'absolute', top: '2mm', right: '3mm', fontSize: '5pt', color: acc }}>[ONLINE]</div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4mm', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{`> ${nameFormatted.toUpperCase()}`}</span></div>
            <div style={{ fontSize: '5.5pt', color: detailsMuted }}>{`// ${data.tagline || 'STATIONERY'}`}</div>
          </div>
          <div>
            <div style={{ fontSize: '10pt', color: prim, fontWeight: 'bold' }}>{data.empName}</div>
            <div style={{ fontSize: '6pt', color: acc }}>{`role: ${roleLine.toLowerCase()}`}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted, borderTop: '0.5px solid #BBBBBB', paddingTop: '1mm' }}>
            <div>{`ADDR: ${data.address}`}</div>
            <div>{`COMM: ${mobileNumber} // ${data.email}`}</div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 11: Ultra-Luxury Gold Border (luxury-gold)
  if (layout === 'luxury-gold') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Georgia', serif" }}>
        <div style={{ position: 'absolute', top: '1.5mm', left: '1.5mm', right: '1.5mm', bottom: '1.5mm', border: `1.5px solid ${acc}`, pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', top: '2.5mm', left: '2.5mm', right: '2.5mm', bottom: '2.5mm', border: `0.5px solid ${prim}`, pointerEvents: 'none', opacity: 0.4 }}></div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '5mm', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '8pt', color: acc, letterSpacing: '2px', textTransform: 'uppercase' }}>PREMIUM SUITE</div>
            <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: 'bold', color: prim, marginTop: '1mm' }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: acc, fontStyle: 'italic', letterSpacing: '1px' }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted, letterSpacing: '0.5px' }}>
            {data.address} &bull; Ph: {mobileNumber} &bull; {data.email}
          </div>
        </div>
      </div>
    );
  }

  // Layout 12: Modern Wave Accent Card (wave-abstract)
  if (layout === 'wave-abstract') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '45%', height: '100%', overflow: 'hidden', zIndex: 1 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path d="M50,100 C20,70 60,30 100,0 L100,100 Z" fill={hexToRgba(prim, 0.15)} />
            <path d="M70,100 C40,80 70,40 100,20 L100,100 Z" fill={hexToRgba(acc, 0.25)} />
          </svg>
        </div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm 5mm', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              {renderDecorationsAroundNameCard(nameFormatted, theme.decorations, theme, headlineFont, cardNameSize - 1, data.tagline)}
            </div>
            <div style={{ width: '10mm', height: '10mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
          <div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '7pt', color: acc, fontWeight: 600 }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.5pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(prim, 0.1)}`, paddingTop: '1mm' }}>
            <div>{data.address}</div>
            <div>{mobileNumber} &bull; {data.email}</div>
          </div>
        </div>
        <div className="glossy-sheen"></div>
      </div>
    );
  }

  // Layout 14: Ultra-Minimal Centered Accent (minimalist-centered)
  if (layout === 'minimalist-centered') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
        <div style={{ position: 'absolute', top: '1.2mm', left: '1.2mm', right: '1.2mm', bottom: '1.2mm', border: `1.5px solid ${acc}`, pointerEvents: 'none', boxShadow: `0 0 5px ${hexToRgba(acc, 0.4)}` }}></div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm 5mm', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '5.5pt', color: detailsMuted }}>{data.tagline}</div>
            </div>
            <div style={{ width: '8mm', height: '8mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
          <div>
            <div style={{ fontSize: '10.5pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: acc, fontWeight: 700 }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
            {data.address} &bull; Ph: {mobileNumber} &bull; {data.email}
          </div>
        </div>
      </div>
    );
  }

  // Layout 15: Triple Stripe Asymmetrical (asymmetrical-stripe)
  if (layout === 'asymmetrical-stripe') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4mm', background: prim }}></div>
        <div style={{ position: 'absolute', top: '4mm', left: 0, right: 0, height: '1px', background: acc }}></div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '6mm 5mm 4mm', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '5.5pt', color: detailsMuted }}>{data.tagline}</div>
            </div>
            <div style={{ width: '8mm', height: '8mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
          <div>
            <div style={{ fontSize: '10.5pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: acc, fontWeight: 600 }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
            {data.address} &bull; Mob: {mobileNumber} &bull; Email: {data.email}
          </div>
        </div>
      </div>
    );
  }

  // Layout 16: Executive Crest & Border (executive-badge)
  if (layout === 'executive-badge') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Times New Roman', serif" }}>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '11pt', fontFamily: headlineFont, color: prim, fontWeight: 'bold', borderBottom: `1px solid ${acc}`, paddingBottom: '1mm', width: '80%' }}>
            <span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span>
          </div>
          <div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', color: prim, letterSpacing: '0.5px' }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: acc, fontStyle: 'italic', marginTop: '0.5mm' }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
            {data.address} &bull; Ph: {mobileNumber} &bull; {data.email}
          </div>
        </div>
      </div>
    );
  }

  // Layout 17: Architectural Bold Frame (architectural-structure)
  if (layout === 'architectural-structure') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Courier New', Courier, monospace" }}>
        <div style={{ position: 'absolute', top: '1.5mm', left: '1.5mm', width: '3mm', height: '3mm', borderTop: '0.5px solid #888888', borderLeft: '0.5px solid #888888', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', top: '1.5mm', right: '1.5mm', width: '3mm', height: '3mm', borderTop: '0.5px solid #888888', borderRight: '0.5px solid #888888', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '1.5mm', left: '1.5mm', width: '3mm', height: '3mm', borderBottom: '0.5px solid #888888', borderLeft: '0.5px solid #888888', opacity: 0.5 }}></div>
        <div style={{ position: 'absolute', bottom: '1.5mm', right: '1.5mm', width: '3mm', height: '3mm', borderBottom: '0.5px solid #888888', borderRight: '0.5px solid #888888', opacity: 0.5 }}></div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4mm', justifyContent: 'space-between' }}>
          <div style={{ borderBottom: '0.5px solid #888888', paddingBottom: '1.5mm' }}>
            <div style={{ fontSize: '8.5pt', fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted.toUpperCase()}</span></div>
            <div style={{ fontSize: '5.5pt', color: acc }}>{data.tagline || 'SCHEMATIC_REF'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10pt', color: prim, fontWeight: 'bold' }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: detailsMuted }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5pt', color: detailsMuted, lineHeight: 1.3 }}>
            <div>{`LOCATION: ${data.address}`}</div>
            <div>{`CONTACT: ${mobileNumber} // ${data.email}`}</div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 18: Connected Node Pattern Card (geometric-nodes)
  if (layout === 'geometric-nodes') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', top: '-10mm', left: '-10mm', width: '30mm', height: '30mm', background: hexToRgba(prim, 0.08), borderRadius: '50%' }}></div>
        <div style={{ position: 'absolute', bottom: '-12mm', right: '-12mm', width: '35mm', height: '35mm', background: hexToRgba(acc, 0.1), borderRadius: '50%' }}></div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm 5mm', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: '600', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
              <div style={{ fontSize: '5.5pt', color: detailsMuted }}>{data.tagline}</div>
            </div>
            <div style={{ width: '8mm', height: '8mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
          <div>
            <div style={{ fontSize: '11pt', fontWeight: '500', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: acc }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
            {data.address} &bull; Ph: {mobileNumber} &bull; {data.email}
          </div>
        </div>
      </div>
    );
  }

  // Layout 19: Vertical Editorial Typography Card (vertical-editorial)
  if (layout === 'vertical-editorial') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Times New Roman', serif" }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3mm', background: prim }}></div>
        <div style={{ position: 'absolute', top: 0, left: '3mm', bottom: 0, width: '1px', background: acc }}></div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4mm 4mm 4mm 7mm', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
            <div style={{ fontSize: '5.5pt', color: acc, fontStyle: 'italic' }}>{data.tagline}</div>
          </div>
          <div>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.8pt', color: detailsMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
            {data.address} &bull; Mob: {mobileNumber} &bull; {data.email}
          </div>
        </div>
      </div>
    );
  }

  // Layout 20: Corporate Diagonal Overlay Card (corporate-envelope)
  if (layout === 'corporate-envelope') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ position: 'absolute', right: '4mm', bottom: '4mm', fontSize: '38pt', color: prim, opacity: 0.05, fontWeight: 'bold', pointerEvents: 'none' }}>
          {initials}
        </div>
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '5mm', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1.5}pt`, fontWeight: '800', color: prim, letterSpacing: '0.5px' }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted.toUpperCase()}</span></div>
          </div>
          <div>
            <div style={{ fontSize: '10.5pt', fontWeight: '700', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: acc, letterSpacing: '1px' }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.2pt', color: detailsMuted, display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid #CCCCCC', paddingTop: '1mm' }}>
            <span>{data.address}</span>
            <span>{mobileNumber} &bull; {data.email}</span>
          </div>
        </div>
      </div>
    );
  }

  // 21. Freepik Corporate
  if (layout === 'freepik-corporate-blue') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
         <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '38mm', background: `linear-gradient(135deg, ${prim} 0%, ${acc} 100%)` }}>
            <div style={{ position: 'absolute', top: '15mm', left: '9mm', width: '20mm', height: '20mm' }} dangerouslySetInnerHTML={{ __html: whiteLogoMark }} />
         </div>
         <div style={{ padding: '8mm 6mm', width: '47mm', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div>
             <div style={{ fontSize: `${cardNameSize + 1}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
             <div style={{ fontSize: '6.5pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
           </div>
           <div>
             <div style={{ fontSize: '9pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
             <div style={{ fontSize: '6.5pt', color: detailsMuted }}>{roleLine}</div>
           </div>
           <div style={{ fontSize: '5.5pt', color: detailsMuted, lineHeight: 1.3, borderTop: `1px solid ${hexToRgba(prim, 0.1)}`, paddingTop: '1.5mm' }}>
             <div>📞 {mobileNumber}</div>
             <div>✉️ {data.email}</div>
             <div>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // 22. Canva Creative Wave
  if (layout === 'canva-creative-wave') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
         <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill={hexToRgba(prim, 0.05)} fillOpacity="1" d="M0,160L48,165.3C96,171,192,181,288,160C384,139,480,85,576,96C672,107,768,181,864,213.3C960,245,1056,235,1152,197.3C1248,160,1344,96,1392,64L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <div style={{ padding: '7mm 8mm', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
               <div style={{ fontSize: `${cardNameSize + 1}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
               <div style={{ fontSize: '6.5pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
            </div>
            <div style={{ width: '12mm', height: '12mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
          </div>
          <div>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
            <div style={{ fontSize: '6.5pt', color: detailsMuted }}>{roleLine}</div>
          </div>
          <div style={{ fontSize: '5.5pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(prim, 0.1)}`, paddingTop: '1.5mm', display: 'flex', justifyContent: 'space-between' }}>
            <span>📞 {mobileNumber} &bull; ✉️ {data.email}</span>
            <span>📍 {data.address}</span>
          </div>
        </div>
      </div>
    );
  }

  // 23. Modern Gradient Edge
  if (layout === 'modern-gradient-edge') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
         <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4mm', background: `linear-gradient(to bottom, ${prim}, ${acc})` }}></div>
         <div style={{ padding: '7mm 8mm 7mm 11mm', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
               <div style={{ fontSize: `${cardNameSize + 1}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
               <div style={{ fontSize: '6.5pt', color: acc, marginTop: '1mm' }}>{data.tagline}</div>
             </div>
             <div style={{ width: '12mm', height: '12mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
           </div>
           <div>
             <div style={{ fontSize: '9pt', fontWeight: 'bold', color: acc }}>{data.empName}</div>
             <div style={{ fontSize: '6.5pt', color: detailsMuted }}>{roleLine}</div>
           </div>
           <div style={{ fontSize: '5.5pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(prim, 0.1)}`, paddingTop: '1.5mm' }}>
             <div>📞 {mobileNumber} &bull; ✉️ {data.email}</div>
             <div>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // 24. Luxury Gold Foil
  if (layout === 'luxury-gold-foil') {
    const goldLogo = logoImgHtml || logoMarkSVG(initials, shape, '#FFFFFF', '#FCF6BA', '#AA771C', logoStyle);
    return (
      <div className="card" style={{ background: '#111111', color: '#F1E6C8', fontFamily: "'Georgia', serif", border: '1mm solid #AA771C', padding: '5mm', boxSizing: 'border-box', position: 'relative' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', height: '100%', alignItems: 'center' }}>
           <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '60%', height: '100%' }}>
             <div>
               <div style={{ fontSize: `${cardNameSize}pt`, fontWeight: 'bold', color: '#FCF6BA', lineHeight: 1.15 }}>{nameFormatted}</div>
               <div style={{ fontSize: '6pt', color: '#BF953F', fontStyle: 'italic', marginTop: '0.5mm' }}>{data.tagline}</div>
             </div>
             <div>
               <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#FFFFFF' }}>{data.empName}</div>
               <div style={{ fontSize: '6pt', color: '#BF953F', letterSpacing: '1px', textTransform: 'uppercase' }}>{roleLine}</div>
             </div>
             <div style={{ fontSize: '5.5pt', color: '#B38728', lineHeight: 1.3, borderTop: '0.5px solid rgba(179,135,40,0.3)', paddingTop: '1mm' }}>
               <div>📞 {mobileNumber} &bull; ✉️ {data.email}</div>
               <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {data.address}</div>
             </div>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '35%' }}>
              <div style={{ width: '16mm', height: '16mm', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} dangerouslySetInnerHTML={{ __html: goldLogo }} />
           </div>
         </div>
      </div>
    );
  }

  // 25. Startup Geometric
  if (layout === 'startup-geometric') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
         <div style={{ position: 'absolute', bottom: '-10mm', right: '-10mm', width: '40mm', height: '40mm', background: hexToRgba(prim, 0.1), borderRadius: '50%' }}></div>
         <div style={{ position: 'absolute', top: '5mm', right: '15mm', width: '15mm', height: '15mm', background: hexToRgba(acc, 0.1), borderRadius: '50%' }}></div>
         <div style={{ padding: '7mm 8mm', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', height: '100%', flexDirection: 'column' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div>
               <div style={{ fontSize: `${cardNameSize + 1}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
               <div style={{ fontSize: '6.5pt', color: acc, marginTop: '0.5mm' }}>{data.tagline}</div>
             </div>
             <div style={{ width: '12mm', height: '12mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
           </div>
           <div>
             <div style={{ fontSize: '9pt', fontWeight: 'bold', color: acc }}>{data.empName}</div>
             <div style={{ fontSize: '6.5pt', color: detailsMuted }}>{roleLine}</div>
           </div>
           <div style={{ fontSize: '5.5pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(prim, 0.15)}`, paddingTop: '1.5mm' }}>
             <div>📞 {mobileNumber} &bull; ✉️ {data.email}</div>
             <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // 26. Law Firm Classic
  if (layout === 'law-firm-classic') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Times New Roman', serif" }}>
         <div style={{ position: 'absolute', top: '5mm', left: '8mm', width: '11mm', height: '11mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
         <div style={{ borderBottom: `1px solid ${prim}`, padding: '4mm 8mm 4mm 22mm', textAlign: 'right' }}>
           <div style={{ fontSize: `${cardNameSize}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted.toUpperCase()}</div>
           <div style={{ fontSize: '5.5pt', color: acc, letterSpacing: '1px', marginTop: '0.5mm' }}>{data.tagline || 'LAW CHAMBERS'}</div>
         </div>
         <div style={{ padding: '4mm 8mm', display: 'flex', justifyContent: 'space-between', height: 'calc(100% - 21mm)', alignItems: 'flex-end' }}>
           <div style={{ textAlign: 'left' }}>
             <div style={{ fontSize: '9pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
             <div style={{ fontSize: '6.5pt', color: acc, fontStyle: 'italic' }}>{roleLine}</div>
           </div>
           <div style={{ textAlign: 'right', fontSize: '5.5pt', color: detailsMuted, lineHeight: 1.3 }}>
             <div>📞 {mobileNumber}</div>
             <div>✉️ {data.email}</div>
             <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '35mm' }}>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // 27. Creative Agency Bold
  if (layout === 'creative-agency-bold') {
    return (
      <div className="card" style={{ background: prim, color: '#fff', fontFamily: "'Arial Black', sans-serif" }}>
         <div style={{ padding: '6mm 8mm', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
             <div style={{ fontSize: `${cardNameSize + 2}pt`, lineHeight: 1.1, letterSpacing: '-1px', maxWidth: '75%' }}>{nameFormatted.toUpperCase()}</div>
             <div style={{ width: '13mm', height: '13mm' }} dangerouslySetInnerHTML={{ __html: whiteLogoMark }} />
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div style={{ fontSize: '5.5pt', opacity: 0.8, lineHeight: 1.3, fontFamily: "sans-serif" }}>
               <div>📍 {data.address}</div>
               <div>✉️ {data.email}</div>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '9pt', color: acc }}>{data.empName}</div>
               <div style={{ fontSize: '6.5pt', opacity: 0.9, fontFamily: 'sans-serif' }}>{roleLine}</div>
               <div style={{ fontSize: '6pt', opacity: 0.8, marginTop: '1px', fontFamily: 'sans-serif' }}>📞 {mobileNumber}</div>
             </div>
           </div>
         </div>
      </div>
    );
  }

  // 28. Medical Clean
  if (layout === 'medical-clean-cross') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', sans-serif" }}>
         <div style={{ position: 'absolute', top: '6mm', left: '8mm', width: '13mm', height: '13mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
         <div style={{ padding: '6mm 8mm 6mm 23mm', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
           <div>
             <div style={{ fontSize: `${cardNameSize + 1}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
             <div style={{ fontSize: '6.5pt', color: detailsMuted, marginTop: '0.5mm' }}>{data.tagline || 'Healthcare Services'}</div>
           </div>
           <div>
             <div style={{ fontSize: '9pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
             <div style={{ fontSize: '6.5pt', color: acc }}>{roleLine}</div>
           </div>
           <div style={{ fontSize: '5.5pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(prim, 0.1)}`, paddingTop: '1.5mm' }}>
             <div>📞 {mobileNumber} &bull; ✉️ {data.email}</div>
             <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // 29. Real Estate Arch
  if (layout === 'real-estate-arch') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Georgia', serif" }}>
         <div style={{ position: 'absolute', top: '0', right: '5mm', width: '30mm', height: '40mm', background: hexToRgba(prim, 0.05), borderBottomLeftRadius: '15mm', borderBottomRightRadius: '15mm' }}></div>
         <div style={{ position: 'absolute', top: '6mm', right: '10mm', width: '12mm', height: '12mm', zIndex: 2 }} dangerouslySetInnerHTML={{ __html: mark }} />
         <div style={{ padding: '7mm 8mm', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
           <div>
             <div style={{ fontSize: `${cardNameSize + 1}pt`, fontWeight: 'bold', color: prim, lineHeight: 1.15 }}>{nameFormatted}</div>
             <div style={{ fontSize: '6.5pt', color: acc, fontStyle: 'italic', marginTop: '0.5mm' }}>{data.tagline}</div>
           </div>
           <div>
             <div style={{ fontSize: '9pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
             <div style={{ fontSize: '6.5pt', color: acc }}>{roleLine}</div>
           </div>
           <div style={{ fontSize: '5.5pt', color: detailsMuted, borderTop: `1px solid ${hexToRgba(prim, 0.15)}`, paddingTop: '1.5mm' }}>
             <div>📞 {mobileNumber} &bull; ✉️ {data.email}</div>
             <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50mm' }}>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // 30. Hospitality Elegant
  if (layout === 'hospitality-elegant') {
    return (
      <div className="card" style={{ background: theme.paper, fontFamily: "'Cinzel', serif" }}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '4.5mm', border: `1px solid ${hexToRgba(prim, 0.2)}`, margin: '3mm', boxSizing: 'border-box' }}>
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.5mm' }}>
             <div style={{ width: '11mm', height: '11mm', marginBottom: '1mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
             <div style={{ fontSize: `${cardNameSize}pt`, color: prim, letterSpacing: '1.5px', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>{nameFormatted}</div>
             <div style={{ fontSize: '5.5pt', color: acc, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '0.5mm' }}>{data.tagline}</div>
           </div>
           <div style={{ textAlign: 'center' }}>
             <div style={{ fontSize: '8.5pt', color: prim, fontWeight: 'bold' }}>{data.empName}</div>
             <div style={{ fontSize: '6pt', color: detailsMuted, letterSpacing: '1px' }}>{roleLine.toUpperCase()}</div>
           </div>
           <div style={{ textAlign: 'center', fontSize: '5.5pt', color: detailsMuted, fontFamily: 'sans-serif', borderTop: `1px solid ${hexToRgba(prim, 0.1)}`, width: '90%', paddingTop: '1mm' }}>
             <div>📞 {mobileNumber} &bull; ✉️ {data.email}</div>
             <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65mm' }}>📍 {data.address}</div>
           </div>
         </div>
      </div>
    );
  }

  // Fallback and default card renderer
  return (
    <div className="card" style={{ background: theme.paper, fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <div style={{ position: 'absolute', top: '1.2mm', left: '1.2mm', right: '1.2mm', bottom: '1.2mm', border: `1.5px solid ${acc}`, pointerEvents: 'none', boxShadow: `0 0 5px ${hexToRgba(acc, 0.4)}` }}></div>
      <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '4.5mm 5mm', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: headlineFont, fontSize: `${cardNameSize - 1}pt`, fontWeight: 'bold', color: prim }}><span style={{ whiteSpace: "nowrap" }}>{nameFormatted}</span></div>
            <div style={{ fontSize: '5.5pt', color: detailsMuted }}>{data.tagline}</div>
          </div>
          <div style={{ width: '8mm', height: '8mm' }} dangerouslySetInnerHTML={{ __html: mark }} />
        </div>
        <div>
          <div style={{ fontSize: '10.5pt', fontWeight: 'bold', color: prim }}>{data.empName}</div>
          <div style={{ fontSize: '6.5pt', color: acc, fontWeight: 700 }}>{roleLine}</div>
        </div>
        <div style={{ fontSize: '5.2pt', color: detailsMuted }}>
          {data.address} &bull; Ph: {mobileNumber} &bull; {data.email}
        </div>
      </div>
    </div>
  );
};

export const CardPreview: React.FC<CardPreviewProps> = (props) => {
  const gridStyle = props.gridStyle || 'none';
  const gridStyles = getGridStyles(gridStyle, props.theme.primary, props.headlineFont, props.data.companyName);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {gridStyle !== 'none' && (
        <div style={{ ...gridStyles, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
        <CardPreviewInner {...props} />
      </div>
      {props.texture && props.texture !== 'none' && (
        <div style={{ ...getTextureStyles(props.texture), position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'none' }} />
      )}
    </div>
  );
};
