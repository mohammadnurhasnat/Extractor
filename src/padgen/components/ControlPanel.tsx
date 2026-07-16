import React, { useRef } from 'react';
import { Sparkles, Loader2, History } from 'lucide-react';
import { CompanyData, DesignControls } from '../types';
import { HEADLINE_FONTS, SHAPES, PAD_LAYOUTS, CARD_LAYOUTS, PAD_LAYOUT_LABELS, CARD_LAYOUT_LABELS, LOGO_STYLES, LOGO_STYLE_LABELS, INDUSTRIES, INDUSTRY_LABELS, GRID_STYLES, GRID_STYLE_LABELS, TEXTURES, TEXTURE_LABELS, DEFAULT_COMPANY_DATA } from '../data';

interface ControlPanelProps {
  companyData: CompanyData;
  onDataChange: (data: CompanyData) => void;
  controls: DesignControls;
  onControlsChange: (controls: DesignControls) => void;
  onGenerate: () => void;
  onRandomTheme: () => void;
  onResetAll: () => void;
  onDownloadPadPDF: () => void;
  onDownloadCardPDF: () => void;
  onExportCardSVG: () => void;
  onExportPadSVG: () => void;
  onDownloadCardPNG: () => void;
  onDownloadPadPNG: () => void;
  onExportAI: () => void;
  onExportPSD: () => void;
  onSaveTemplate: () => void;
  onLoadTemplate: (payload: any) => void;
  error: string | null;
  status: string | null;
  onAiPremiumGenerate?: () => void;
  aiLoading?: boolean;
  aiExplanation?: string | null;
  onOpenHistory: () => void;
  historyCount: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  companyData,
  onDataChange,
  controls,
  onControlsChange,
  onGenerate,
  onRandomTheme,
  onResetAll,
  onDownloadPadPDF,
  onDownloadCardPDF,
  onExportCardSVG,
  onExportPadSVG,
  onDownloadCardPNG,
  onDownloadPadPNG,
  onExportAI,
  onExportPSD,
  onSaveTemplate,
  onLoadTemplate,
  error,
  status,
  onOpenHistory,
  historyCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    onDataChange({
      ...companyData,
      [field]: value === '' ? (DEFAULT_COMPANY_DATA as any)[field] : value,
    });
  };

  const getInputProps = (field: keyof CompanyData, placeholder: string) => ({
    value: companyData[field] === (DEFAULT_COMPANY_DATA as any)[field] ? '' : (companyData[field] || ''),
    placeholder: (DEFAULT_COMPANY_DATA as any)[field] || placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(field, e.target.value),
    className: "w-full p-2 border border-[#DDDEDC] rounded text-[13px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658]",
  });

  const handleControlChange = <K extends keyof DesignControls>(
    key: K,
    value: DesignControls[K]
  ) => {
    onControlsChange({
      ...controls,
      [key]: value,
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string);
        if (payload && payload.data) {
          onLoadTemplate(payload);
        } else {
          alert('Invalid template file format.');
        }
      } catch (err) {
        alert('Failed to parse template JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="panel" className="bg-white border-b md:border-b-0 md:border-r border-[#DDDEDC] h-[45vh] md:h-screen flex flex-col overflow-hidden w-full md:w-[380px] shrink-0">
      {/* 1. FIXED HEADER AND MAIN TITLE */}
      <div className="p-5 border-b border-[#DDDEDC] bg-[#FBFBFA] flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-[14px] font-bold tracking-wider text-[#1C1E22] m-0">
            PadGen
          </h1>
          <div className="font-mono text-[9.5px] text-[#6B7076] tracking-widest uppercase mt-0.5">
            A4 Letterhead &nbsp;/&nbsp; Business Card 89×51mm
          </div>
        </div>
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDDEDC] hover:border-[#3B4658] text-[11px] font-bold text-[#3B4658] hover:bg-[#FAFBF9] transition-all cursor-pointer shadow-xs shrink-0 bg-white"
          title="Open Saved Downloads History"
        >
          <History className="w-3.5 h-3.5 text-[#3B4658]" />
          <span>History</span>
          {historyCount > 0 && (
            <span className="bg-[#3B4658] text-white text-[9.5px] px-1.5 py-0.2 rounded-full font-extrabold shrink-0">
              {historyCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="px-5 pt-3 bg-white shrink-0">
          <div
            id="errorBox"
            className="bg-[#FBEAEA] border border-[#E3B6B6] text-[#8A2C2C] text-[12px] p-2 rounded font-medium"
          >
            {error}
          </div>
        </div>
      )}

      {/* 2. SCROLLABLE BODY CONTAINING FORM & DESIGN OPTIONS */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Company Fields */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider font-bold border-b border-[#DDDEDC] pb-1">
            Company Credentials
          </div>

            <div className="flex flex-col gap-1">
            <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
              Company Name
            </label>
            <input type="text" {...getInputProps('companyName', 'e.g. Subarna Traders')} className="w-full p-3 border border-[#DDDEDC] rounded text-[15px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658]" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
              Company Name Casing Style
            </label>
            <div className="flex gap-2">
              {(['title', 'upper', 'as-typed'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleInputChange('casing', c)}
                  className={`flex-1 py-3 px-4 rounded border text-[13px] font-semibold cursor-pointer transition-all duration-150 ${
                    (companyData.casing || 'title') === c
                      ? 'bg-[#3B4658] text-white border-[#3B4658]'
                      : 'bg-[#FBFBFA] text-[#1C1E22] border-[#DDDEDC] hover:border-[#3B4658]'
                  }`}
                >
                  {c === 'title' ? 'Title Case' : c === 'upper' ? 'UPPERCASE' : 'As Typed'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
              Business Industry / Domain
            </label>
            <select
              value={companyData.industry || 'corporate'}
              onChange={(e) => handleInputChange('industry', e.target.value as any)}
              className="w-full p-3 border border-[#DDDEDC] rounded text-[15px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658] font-semibold cursor-pointer"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {INDUSTRY_LABELS[ind]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
              Address
            </label>
            <input type="text" {...getInputProps('address', 'e.g. 24 Motijheel C/A, Dhaka-1000')} className="w-full p-3 border border-[#DDDEDC] rounded text-[15px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
                Telephone
              </label>
              <input type="text" {...getInputProps('phone', 'Phone number')} className="w-full p-3 border border-[#DDDEDC] rounded text-[15px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
                Email
              </label>
              <input type="email" {...getInputProps('email', 'Email address')} className="w-full p-3 border border-[#DDDEDC] rounded text-[15px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658]" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-mono text-[#6B7076] uppercase tracking-wider">
              Website / Tagline
            </label>
            <input type="text" {...getInputProps('tagline', 'e.g. www.subarnatraders.com')} className="w-full p-3 border border-[#DDDEDC] rounded text-[15px] bg-[#FBFBFA] text-[#1C1E22] focus:outline-none focus:border-[#3B4658]" />
          </div>
        </div>

        {/* Employee Section */}
        <div className="flex flex-col gap-3 border-t border-[#DDDEDC] pt-3">
          <div className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider font-bold border-b border-[#DDDEDC] pb-1">
            Visiting Card Holder
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider">
              Employee Name
            </label>
            <input type="text" {...getInputProps('empName', 'e.g. Md. Rahim Uddin')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider">
                Designation
              </label>
              <input type="text" {...getInputProps('empRole', 'Designation')} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider">
                Mobile Number
              </label>
              <input type="text" {...getInputProps('empPhone', 'Optional mobile')} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider">
                Employee Email
              </label>
              <input type="email" {...getInputProps('empEmail', 'Optional employee email')} />
            </div>
        </div>

        {/* Design Controls */}
        <div className="flex flex-col gap-4 border-t border-[#DDDEDC] pt-3">
          <div className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider font-bold border-b border-[#DDDEDC] pb-1">
            Design Customizations (Live)
          </div>

          {/* Font Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider">
              Typography Stack
            </label>
            <select
              className="w-full p-2 border border-[#DDDEDC] rounded text-[13px] bg-[#FBFBFA] text-[#1C1E22] cursor-pointer focus:outline-none focus:border-[#3B4658]"
              value={controls.font}
              onChange={(e) => handleControlChange('font', e.target.value)}
            >
              <option value="random">Random Font</option>
              {HEADLINE_FONTS.map((font, idx) => (
                <option key={idx} value={String(idx)}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shape control (7 shapes) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider mb-1">
              Logo Shape
            </label>
            <div className="flex gap-1 flex-wrap">
              {(['random', ...SHAPES] as const).map((sh) => (
                <button
                  key={sh}
                  type="button"
                  onClick={() => handleControlChange('shape', sh)}
                  className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                    controls.shape === sh
                      ? 'bg-[#3B4658] text-white border-[#3B4658]'
                      : 'bg-[#FBFBFA] text-[#1C1E22] border-[#DDDEDC] hover:border-[#3B4658]'
                  }`}
                >
                  {sh.charAt(0).toUpperCase() + sh.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Style Control (classic, typographic, bordered, shadow-badge) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider mb-1">
              Logo Design Style
            </label>
            <div className="flex gap-1 flex-wrap">
              {(['random', ...LOGO_STYLES] as const).map((sty) => (
                <button
                  key={sty}
                  type="button"
                  onClick={() => handleControlChange('logoStyle', sty)}
                  className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                    controls.logoStyle === sty
                      ? 'bg-[#3B4658] text-white border-[#3B4658]'
                      : 'bg-[#FBFBFA] text-[#1C1E22] border-[#DDDEDC] hover:border-[#3B4658]'
                  }`}
                >
                  {sty === 'random' ? 'Random' : LOGO_STYLE_LABELS[sty]}
                </button>
              ))}
            </div>
          </div>

          {/* Pad Layout control (7 layouts) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider mb-1">
              Pad Layout Format
            </label>
            <div className="flex gap-1 flex-wrap">
              {(['random', ...PAD_LAYOUTS] as const).map((lay) => (
                <button
                  key={lay}
                  type="button"
                  onClick={() => handleControlChange('padLayout', lay)}
                  className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                    controls.padLayout === lay
                      ? 'bg-[#3B4658] text-white border-[#3B4658]'
                      : 'bg-[#FBFBFA] text-[#1C1E22] border-[#DDDEDC] hover:border-[#3B4658]'
                  }`}
                >
                  {lay === 'random' ? 'Random' : PAD_LAYOUT_LABELS[lay]?.split(' ')[0] || lay}
                </button>
              ))}
            </div>
          </div>

          {/* Letterhead Grid / Line Toggles */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider mb-1">
              Letterhead Grid / Lines
            </label>
            <select
              value={controls.gridStyle}
              onChange={(e) => handleControlChange("gridStyle", e.target.value as any)}
              className="px-2 py-1.5 rounded border border-[#DDDEDC] bg-[#FBFBFA] text-[#1C1E22] text-[12px] font-medium outline-none focus:border-[#3B4658] transition-colors"
            >
              <option value="random">Random</option>
              {GRID_STYLES.map((gSty) => (
                <option key={gSty} value={gSty}>{GRID_STYLE_LABELS[gSty as keyof typeof GRID_STYLE_LABELS]}</option>
              ))}
            </select>
          </div>

          {/* Paper Texture Toggles */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider mb-1">
              Paper Texture
            </label>
            <select
              value={controls.texture}
              onChange={(e) => handleControlChange("texture", e.target.value as any)}
              className="px-2 py-1.5 rounded border border-[#DDDEDC] bg-[#FBFBFA] text-[#1C1E22] text-[12px] font-medium outline-none focus:border-[#3B4658] transition-colors"
            >
              <option value="random">Random</option>
              {TEXTURES.map((tex) => (
                <option key={tex} value={tex}>{TEXTURE_LABELS[tex as keyof typeof TEXTURE_LABELS]}</option>
              ))}
            </select>
          </div>

          {/* Card Layout control (7 layouts) */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono text-[#6B7076] uppercase tracking-wider mb-1">
              Visiting Card Format
            </label>
            <div className="flex gap-1 flex-wrap mb-2">
              {(['random', ...CARD_LAYOUTS] as const).map((lay) => (
                <button
                  key={lay}
                  type="button"
                  onClick={() => handleControlChange('cardLayout', lay)}
                  className={`px-2 py-1 rounded border text-[11px] font-semibold cursor-pointer transition-all duration-150 ${
                    controls.cardLayout === lay
                      ? 'bg-[#3B4658] text-white border-[#3B4658]'
                      : 'bg-[#FBFBFA] text-[#1C1E22] border-[#DDDEDC] hover:border-[#3B4658]'
                  }`}
                >
                  {lay === 'random' ? 'Random' : CARD_LAYOUT_LABELS[lay]?.split(' ')[0] || lay}
                </button>
              ))}
            </div>
            {/* Card Downloads grouped under Card Layouts */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onDownloadCardPDF}
                className="border border-[#DDDEDC] bg-[#E8F0FE] text-[#1967D2] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#D2E3FC] transition-colors duration-150 cursor-pointer"
              >
                Download Card PDF
              </button>
              <button
                onClick={onDownloadCardPNG}
                className="border border-[#DDDEDC] bg-[#E8F0FE] text-[#1967D2] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#D2E3FC] transition-colors duration-150 cursor-pointer"
              >
                Download Card PNG
              </button>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="flex flex-col gap-2 border-t border-[#DDDEDC] pt-3">
          <button
            onClick={onGenerate}
            className="w-full bg-[#3B4658] text-white rounded py-2 px-4 text-[12.5px] font-semibold hover:bg-[#2A3240] transition-colors duration-150 cursor-pointer"
          >
            Generate New Design
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRandomTheme}
              className="border border-[#DDDEDC] text-[#3B4658] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#F2F3F1] transition-colors duration-150 cursor-pointer"
            >
              Random Theme
            </button>
            <button
              onClick={onResetAll}
              className="border border-[#DDDEDC] text-[#3B4658] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#F2F3F1] transition-colors duration-150 cursor-pointer"
            >
              Reset Inputs
            </button>
          </div>

          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onDownloadPadPDF}
              className="border border-[#DDDEDC] bg-[#E8F0FE] text-[#1967D2] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#D2E3FC] transition-colors duration-150 cursor-pointer"
            >
              Download Pad PDF
            </button>
            <button
              onClick={onDownloadPadPNG}
              className="border border-[#DDDEDC] bg-[#E8F0FE] text-[#1967D2] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#D2E3FC] transition-colors duration-150 cursor-pointer"
            >
              Download Pad PNG
            </button>
          </div>





          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onSaveTemplate}
              className="border border-[#DDDEDC] text-[#3B4658] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#F2F3F1] transition-colors duration-150 cursor-pointer"
            >
              Save Template
            </button>
            <button
              onClick={triggerFileSelect}
              className="border border-[#DDDEDC] text-[#3B4658] rounded py-1.5 px-2 text-[11.5px] font-semibold hover:bg-[#F2F3F1] transition-colors duration-150 cursor-pointer"
            >
              Load Template
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* 3. FIXED FOOTER AND STATUS MESSAGES */}
      <div className="p-3 border-t border-[#DDDEDC] bg-[#FBFBFA]">
        {status && (
          <div
            id="statusBox"
            className="bg-[#EAF3EC] border border-[#B9D8C1] text-[#255A34] text-[11px] p-1.5 rounded text-center font-medium"
          >
            {status}
          </div>
        )}

      </div>
    </div>
  );
};
