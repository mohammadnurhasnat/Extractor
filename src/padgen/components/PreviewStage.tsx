import React, { useEffect, useState, useRef } from 'react';
import { PadPreview } from './PadPreview';
import { CardPreview } from './CardPreview';
import { CompanyData, Theme } from '../types';

interface PreviewStageProps {
  companyData: CompanyData;
  theme: Theme;
  shape: 'circle' | 'square' | 'hexagon' | 'diamond' | 'shield' | 'octagon' | 'star' | 'rhombus' | 'cross' | 'ellipse' | 'badge-ribbon' | 'waves' | 'emblem-shield';
  padLayout: any;
  cardLayout: any;
  headlineFont: string;
  logoStyle: 'classic' | 'typographic' | 'bordered' | 'shadow-badge';
  gridStyle: any;
  texture: any;
  previewPadRef: React.RefObject<HTMLDivElement | null>;
  previewCardRef: React.RefObject<HTMLDivElement | null>;
  onDownloadPadPDF: () => void;
  onDownloadCardPDF: () => void;
}

export const PreviewStage: React.FC<PreviewStageProps> = ({
  companyData,
  theme,
  shape,
  padLayout,
  cardLayout,
  headlineFont,
  logoStyle,
  gridStyle,
  texture,
  previewPadRef,
  previewCardRef,
  onDownloadPadPDF,
  onDownloadCardPDF,
}) => {
  const [scales, setScales] = useState({ padScale: 0.48, cardScale: 0.95 });
  const containerRef = useRef<HTMLDivElement>(null);

  const mmToPx = 96 / 25.4;
  const padNaturalWidth = 210 * mmToPx;
  const cardNaturalWidth = 89 * mmToPx;

  const updateScaling = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;

    // Default targets from original script
    let targetPadWidth = 380;
    let targetCardWidth = 320;

    // Adjust for smaller responsive screens
    if (containerWidth < 900) {
      targetPadWidth = Math.min(380, containerWidth - 40);
      targetCardWidth = Math.min(320, containerWidth - 40);
    }

    setScales({
      padScale: targetPadWidth / padNaturalWidth,
      cardScale: targetCardWidth / cardNaturalWidth,
    });
  };

  useEffect(() => {
    updateScaling();
    window.addEventListener('resize', updateScaling);
    return () => window.removeEventListener('resize', updateScaling);
  }, [companyData]);

  const padHeight = 297 * mmToPx;
  const padWidth = 210 * mmToPx;
  const cardHeight = 51 * mmToPx;
  const cardWidth = 89 * mmToPx;

  return (
    <div
      ref={containerRef}
      id="stage"
      className="flex-1 p-4 md:p-10 overflow-auto flex flex-col justify-start items-center bg-gradient-to-tr from-[#F4F4F2] via-[#EFEFED] to-[#E5E5E2] relative"
      style={{
        backgroundImage: 'radial-gradient(#D1D5DB 1.2px, transparent 1.2px)',
        backgroundSize: '20px 20px',
      }}
    >
      <div className="flex flex-col gap-6 items-center w-full z-10">
        <div className="flex gap-10 justify-center items-start flex-wrap w-full max-w-5xl">
          {/* Pad (A4) Preview Frame */}
          <div className="flex flex-col items-center">
            {/* Header label */}
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono font-bold text-[#4B5563] bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#DDDEDC] shadow-sm tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              A4 LETTERHEAD PAD PREVIEW
            </div>
            
            <div
              className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_12px_24px_-10px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.05)] origin-top-left transition-all duration-300 hover:shadow-[0_35px_70px_-10px_rgba(0,0,0,0.22)] bg-white rounded-sm overflow-hidden border border-black/[0.03]"
              style={{
                width: '210mm',
                height: '297mm',
                transform: `scale(${scales.padScale})`,
                marginBottom: `-${(1 - scales.padScale) * padHeight}px`,
                marginRight: `-${(1 - scales.padScale) * padWidth}px`,
              }}
            >
              <div ref={previewPadRef} className="h-full w-full">
                <PadPreview
                  data={companyData}
                  theme={theme}
                  shape={shape}
                  layout={padLayout}
                  headlineFont={headlineFont}
                  logoStyle={logoStyle}
                  gridStyle={gridStyle}
                  texture={texture}
                />
              </div>
            </div>
          </div>

          {/* Business Visiting Card Preview Frame */}
          <div className="flex flex-col items-center">
            {/* Header label */}
            <div className="mb-4 flex items-center gap-2 text-[10px] font-mono font-bold text-[#4B5563] bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#DDDEDC] shadow-sm tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              VISITING CARD PREVIEW (FRONT)
            </div>

            <div
              className="shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_12px_24px_-10px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.05)] origin-top-left transition-all duration-300 hover:shadow-[0_35px_70px_-10px_rgba(0,0,0,0.22)] bg-white rounded-[3.8mm] overflow-hidden border border-black/[0.08]"
              style={{
                width: '89mm',
                height: '51mm',
                transform: `scale(${scales.cardScale})`,
                marginBottom: `-${(1 - scales.cardScale) * cardHeight}px`,
                marginRight: `-${(1 - scales.cardScale) * cardWidth}px`,
              }}
            >
              <div ref={previewCardRef} className="h-full w-full">
                <CardPreview
                  data={companyData}
                  theme={theme}
                  shape={shape}
                  layout={cardLayout}
                  headlineFont={headlineFont}
                  logoStyle={logoStyle}
                  texture={texture}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons side-by-side */}
        <div className="flex gap-4 w-full max-w-[420px] justify-center items-center px-4 mt-8 mb-2">
          <button
            onClick={onDownloadPadPDF}
            className="slide-btn slide-btn-blue text-white flex-1 py-2.5 px-3 text-xs font-black rounded-xl cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
          >
            Download Pad PDF (HQ)
          </button>
          <button
            onClick={onDownloadCardPDF}
            className="slide-btn slide-btn-purple text-white flex-1 py-2.5 px-3 text-xs font-black rounded-xl cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
          >
            Download Card PDF (HQ)
          </button>
        </div>
      </div>
    </div>
  );
};
