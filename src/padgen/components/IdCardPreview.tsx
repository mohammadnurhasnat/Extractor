import React from 'react';
import { CompanyData, Theme } from '../types';
import { hexToRgba, getInitials } from '../utils';
import { Phone, Mail, Globe, MapPin, ShieldAlert } from 'lucide-react';

interface IdCardPreviewProps {
  data: CompanyData;
  theme: Theme;
}

export const IdCardPreview: React.FC<IdCardPreviewProps> = ({ data, theme }) => {
  const prim = theme.primary || '#0D47A1';
  const acc = theme.accent || '#D4AF37';
  const sec = theme.secondary || '#1565C0';
  const sh2 = theme.shade2 || '#1E88E5';
  const sh3 = theme.shade3 || '#F0F4FC';

  // Format company name to display beautifully
  const companyNameFormatted = data.companyName ? (
    data.casing === 'upper'
      ? data.companyName.toUpperCase()
      : data.casing === 'title'
      ? data.companyName.replace(/\b\w/g, (c) => c.toUpperCase())
      : data.companyName
  ) : 'COMPANY NAME';

  // Render a mock barcode SVG/HTML
  const renderBarcode = () => {
    return (
      <div className="flex items-center justify-center gap-[1.5px] bg-white px-2 py-1.5 rounded border border-gray-200 w-full h-[32px] overflow-hidden" style={{ filter: 'contrast(150%)' }}>
        {[3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 1, 2, 1, 3, 2, 1, 4].map((width, idx) => (
          <div
            key={idx}
            className="bg-black h-full"
            style={{ width: `${width * 0.75}px` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row items-center gap-6 justify-center">
      {/* Front Side */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-mono font-bold uppercase text-[#6B7076] tracking-wider">FRONT SIDE</span>
        <div
          id="id-card-front"
          className="relative bg-white select-none overflow-hidden rounded-[8px]"
          style={{
            width: '54mm',
            height: '86mm',
            minWidth: '54mm',
            minHeight: '86mm',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header design with curves/diagonals */}
          <div
            style={{
              height: '24mm',
              background: `linear-gradient(135deg, ${prim} 0%, ${sh2} 100%)`,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2mm',
              color: '#FFFFFF',
            }}
          >
            {/* Background geometric accents */}
            <div style={{ position: 'absolute', bottom: '-4mm', left: '-5mm', width: '20mm', height: '20mm', borderRadius: '50%', background: hexToRgba(acc, 0.15), filter: 'blur(3px)' }} />
            <div style={{ position: 'absolute', top: '-2mm', right: '-2mm', width: '15mm', height: '15mm', background: 'rgba(255,255,255,0.06)', transform: 'rotate(15deg)', borderRadius: '3px' }} />

            {/* Logo placeholder/Custom Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5mm', zIndex: 2 }}>
              {data.customLogo ? (
                <img
                  src={data.customLogo}
                  alt="Logo"
                  style={{
                    width: '6.5mm',
                    height: '6.5mm',
                    objectFit: 'contain',
                    filter: 'brightness(1.2) contrast(1.2)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '6.5mm',
                    height: '6.5mm',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    color: prim,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '7pt',
                    fontWeight: 'bold',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {getInitials(data.companyName || 'C')}
                </div>
              )}
              <div
                style={{
                  fontSize: '7.5pt',
                  fontWeight: 800,
                  letterSpacing: '0.3px',
                  lineHeight: 1.1,
                  maxWidth: '38mm',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'left',
                }}
              >
                {companyNameFormatted}
              </div>
            </div>

            {/* Tagline or Department badge */}
            <div
              style={{
                fontSize: '4.5pt',
                color: acc,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginTop: '1mm',
                zIndex: 2,
              }}
            >
              OFFICE ID CARD
            </div>
            
            {/* Splitter line */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1mm', background: acc }} />
          </div>

          {/* Photo Container */}
          <div className="flex justify-center" style={{ marginTop: '4mm', position: 'relative', zIndex: 10 }}>
            <div
              style={{
                width: '24mm',
                height: '24mm',
                borderRadius: '4px',
                border: `2.5px solid ${acc}`,
                background: '#F3F4F6',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {data.empPhoto ? (
                <img
                  src={data.empPhoto}
                  alt={data.empName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${data.photoScale ? data.photoScale / 100 : 1}) translate(${data.photoX ?? 0}px, ${data.photoY ?? 0}px)`,
                    opacity: data.photoOpacity ?? 1,
                    filter: `brightness(${data.photoBrightness ?? 100}%) contrast(${data.photoSharpness ?? 100}%)`,
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 gap-1">
                  <div
                    style={{
                      width: '8mm',
                      height: '8mm',
                      borderRadius: '50%',
                      background: '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="text-[12px] font-bold text-gray-500">
                      {getInitials(data.empName || 'E')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee Info */}
          <div
            className="flex-1 flex flex-col items-center justify-between"
            style={{ padding: '3mm 3mm 2mm', textAlign: 'center' }}
          >
            <div className="w-full flex flex-col items-center">
              {/* Employee Name */}
              <div
                style={{
                  fontSize: '9pt',
                  fontWeight: 800,
                  color: prim,
                  lineHeight: 1.2,
                  width: '48mm',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '1mm',
                }}
              >
                {data.empName || 'Employee Name'}
              </div>

              {/* Designation */}
              <div
                style={{
                  fontSize: '6.5pt',
                  fontWeight: 600,
                  color: sec,
                  marginTop: '0.8mm',
                  width: '48mm',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {data.empRole || 'Designation'}
              </div>

              {/* ID Details Grid */}
              <div
                style={{
                  width: '44mm',
                  background: sh3,
                  borderRadius: '4px',
                  padding: '1.5mm 2mm',
                  marginTop: '3.5mm',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1mm',
                  fontSize: '5pt',
                  color: '#4B5563',
                  textAlign: 'left',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#1F2937', display: 'block' }}>EMPLOYEE ID</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: prim }}>
                    {data.empId || 'ST-2026-089'}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: '#1F2937', display: 'block' }}>VALID THRU</span>
                  <span style={{ fontWeight: 600 }}>12/2028</span>
                </div>
              </div>
            </div>

            {/* Bottom barcode decoration */}
            <div className="w-full flex flex-col items-center gap-1">
              {renderBarcode()}
              <span style={{ fontSize: '4.5pt', color: '#9CA3AF', letterSpacing: '0.5px' }}>
                * {data.empId || 'ST-2026-089'} *
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back Side */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-mono font-bold uppercase text-[#6B7076] tracking-wider">BACK SIDE</span>
        <div
          id="id-card-back"
          className="relative bg-white select-none overflow-hidden rounded-[8px]"
          style={{
            width: '54mm',
            height: '86mm',
            minWidth: '54mm',
            minHeight: '86mm',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4mm',
            backgroundColor: '#FBFBFA',
          }}
        >
          {/* Header details block */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 justify-center mb-2">
              <ShieldAlert className="w-4 h-4" style={{ color: acc }} />
              <span style={{ fontSize: '7pt', fontWeight: 800, color: prim, letterSpacing: '0.2px' }}>
                TERMS & CONDITIONS
              </span>
            </div>
            
            <p style={{ fontSize: '5pt', color: '#4B5563', lineHeight: 1.4, textAlign: 'justify', marginBottom: '3mm' }}>
              This card is the exclusive property of <b>{companyNameFormatted}</b>. The holder is authorized to access designated office premises. If found, please return this card immediately to the company office address listed below. Alternately, contact office admin support directly.
            </p>
          </div>

          {/* Contact Details Block */}
          <div
            className="flex flex-col gap-1.5"
            style={{
              borderTop: `1.2px solid ${hexToRgba(prim, 0.15)}`,
              borderBottom: `1.2px solid ${hexToRgba(prim, 0.15)}`,
              padding: '2.5mm 1mm',
              fontSize: '5.2pt',
              color: '#374151',
            }}
          >
            <div className="flex items-start gap-1.5">
              <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: prim, marginTop: '0.2mm' }} />
              <span className="leading-tight text-left">
                {data.address || 'Company Address details here'}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Phone className="w-2.5 h-2.5 shrink-0" style={{ color: prim }} />
              <span>{data.phone}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Mail className="w-2.5 h-2.5 shrink-0" style={{ color: prim }} />
              <span className="truncate">{data.email}</span>
            </div>

            {data.website && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-2.5 h-2.5 shrink-0" style={{ color: prim }} />
                <span>{data.website}</span>
              </div>
            )}
          </div>

          {/* Footer block with authorized signature */}
          <div className="flex flex-col items-center text-center gap-1">
            {/* Signature Area */}
            <div className="flex flex-col items-center">
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '9pt', fontStyle: 'italic', color: '#1F2937', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                {data.empName ? data.empName.split(' ')[0] : 'Author'}
              </span>
              <div style={{ width: '22mm', height: '1px', background: '#9CA3AF', margin: '0.5mm 0' }} />
              <span style={{ fontSize: '4.5pt', color: '#6B7280', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                AUTHORIZED SIGNATURE
              </span>
            </div>

            <div style={{ fontSize: '4.2pt', color: '#9CA3AF', marginTop: '1.5mm' }}>
              Power of Professional Identity | Padgen App
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
