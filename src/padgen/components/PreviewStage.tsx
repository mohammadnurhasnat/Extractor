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
  gridStyle: 'none' | 'dots' | 'lines';
  texture: 'none' | 'linen' | 'vellum' | 'canvas';
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
      className="flex-1 p-3 md:p-10 overflow-auto flex flex-col justify-start items-center bg-[#EFEFED]"
    >
      <div className="flex flex-col gap-6 items-center w-full">
        <div className="flex gap-9 justify-center items-start flex-wrap">
          {/* Pad (A4) Preview Frame */}
          <div className="flex flex-col items-center">
            <div
              className="shadow-[0_10px_34px_rgba(0,0,0,0.20)] origin-top-left transition-transform duration-100"
              style={{
                width: '210mm',
                height: '297mm',
                transform: `scale(${scales.padScale})`,
                marginBottom: `-${(1 - scales.padScale) * padHeight}px`,
                marginRight: `-${(1 - scales.padScale) * padWidth}px`,
              }}
            >
              <div ref={previewPadRef}>
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
            <div
              className="shadow-[0_10px_34px_rgba(0,0,0,0.20)] origin-top-left transition-transform duration-100"
              style={{
                width: '89mm',
                height: '51mm',
                transform: `scale(${scales.cardScale})`,
                marginBottom: `-${(1 - scales.cardScale) * cardHeight}px`,
                marginRight: `-${(1 - scales.cardScale) * cardWidth}px`,
              }}
            >
              <div ref={previewCardRef}>
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
        <div className="flex gap-4 w-full max-w-[420px] justify-center items-center px-4 mt-4 mb-2">
          <button
            onClick={onDownloadPadPDF}
            className="flex-1 border border-[#DDDEDC] bg-[#E8F0FE] text-[#1967D2] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#D2E3FC] transition-colors duration-150 cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
          >
            Download Pad PDF
          </button>
          <button
            onClick={onDownloadCardPDF}
            className="flex-1 border border-[#DDDEDC] bg-[#E8F0FE] text-[#1967D2] rounded-lg py-2.5 px-3 text-xs font-bold hover:bg-[#D2E3FC] transition-colors duration-150 cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
          >
            Download Card PDF
          </button>
        </div>
      </div>
    </div>
  );
};
