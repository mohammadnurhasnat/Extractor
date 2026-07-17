import { useState, useEffect, useRef } from 'react';
import { CompanyData, DesignControls, DesignState, Theme, HistoryItem } from './types';
import {
  THEMES,
  SHAPES,
  PAD_LAYOUTS,
  CARD_LAYOUTS,
  PAD_LAYOUT_LABELS,
  CARD_LAYOUT_LABELS,
  HEADLINE_FONTS,
  DEFAULT_COMPANY_DATA,
  LOGO_STYLES,
  LOGO_STYLE_LABELS,
  GRID_STYLES, TEXTURES,
  GRID_STYLE_LABELS,
} from './data';
import { downloadBlob, svgWrap } from './utils';
import { ControlPanel } from './components/ControlPanel';
import { PreviewStage } from './components/PreviewStage';
import { PadPreview } from './components/PadPreview';
import { useAuth } from '../lib/AuthContext';
import { CardPreview } from './components/CardPreview';
import { HistoryPanel } from './components/HistoryPanel';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function PadgenApp() {
  const [companyData, setCompanyData] = useState<CompanyData>(DEFAULT_COMPANY_DATA);
  const { user } = useAuth();

  const [controls, setControls] = useState<DesignControls>({
    font: 'random',
    shape: 'random',
    padLayout: 'random',
    cardLayout: 'random',
    logoStyle: 'random',
    gridStyle: 'random',
    texture: 'random',
  });

  const [activeState, setActiveState] = useState<DesignState>({
    data: DEFAULT_COMPANY_DATA,
    themeIdx: 0,
    shapeIdx: 0,
    padLayoutIdx: 0,
    cardLayoutIdx: 0,
    headlineIdx: 0,
    logoStyleIdx: 0,
    gridStyleIdx: 0,
    textureIdx: 0,
  });

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [customTheme, setCustomTheme] = useState<Theme | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const previewPadRef = useRef<HTMLDivElement>(null);
  const previewCardRef = useRef<HTMLDivElement>(null);

  const showStatusMessage = (msg: string) => {
    setStatus(msg);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatus(null);
    }, 3500);
  };

  const [downloadHistory, setDownloadHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('padgen_download_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const addDownloadToHistory = (type: HistoryItem['type'], filename: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    
    const activeTheme = activeState.themeIdx === -1 && customTheme ? customTheme : (THEMES[activeState.themeIdx] || THEMES[0]);
    const activeShape = SHAPES[activeState.shapeIdx];
    const activePadLayout = PAD_LAYOUTS[activeState.padLayoutIdx];
    const activeCardLayout = CARD_LAYOUTS[activeState.cardLayoutIdx];
    const activeLogoStyle = LOGO_STYLES[activeState.logoStyleIdx];
    const activeGridStyle = GRID_STYLES[activeState.gridStyleIdx];
    const activeTexture = TEXTURES[activeState.textureIdx] || 'none';

    const newItem: HistoryItem = {
      id: String(Date.now()),
      timestamp,
      type,
      filename,
      data: { ...activeState.data },
      theme: activeTheme,
      shape: activeShape,
      padLayout: activePadLayout,
      cardLayout: activeCardLayout,
      fontIdx: activeState.headlineIdx,
      logoStyle: activeLogoStyle,
      gridStyle: activeGridStyle,
      texture: activeTexture,
    };

    setDownloadHistory((prev) => {
      const updated = [newItem, ...prev];
      localStorage.setItem('padgen_download_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setCompanyData(item.data);
    
    if (item.theme.name.startsWith('Gemini')) {
      setCustomTheme(item.theme);
      setActiveState((prev) => ({
        ...prev,
        data: item.data,
        themeIdx: -1,
        shapeIdx: SHAPES.indexOf(item.shape),
        padLayoutIdx: PAD_LAYOUTS.indexOf(item.padLayout),
        cardLayoutIdx: CARD_LAYOUTS.indexOf(item.cardLayout),
        headlineIdx: item.fontIdx,
        logoStyleIdx: LOGO_STYLES.indexOf(item.logoStyle),
        gridStyleIdx: GRID_STYLES.indexOf(item.gridStyle),
      }));
    } else {
      const matchedThemeIdx = THEMES.findIndex((t) => t.name === item.theme.name);
      setActiveState((prev) => ({
        ...prev,
        data: item.data,
        themeIdx: matchedThemeIdx !== -1 ? matchedThemeIdx : 0,
        shapeIdx: SHAPES.indexOf(item.shape),
        padLayoutIdx: PAD_LAYOUTS.indexOf(item.padLayout),
        cardLayoutIdx: CARD_LAYOUTS.indexOf(item.cardLayout),
        headlineIdx: item.fontIdx,
        logoStyleIdx: LOGO_STYLES.indexOf(item.logoStyle),
        gridStyleIdx: GRID_STYLES.indexOf(item.gridStyle),
      }));
    }

    setControls({
      font: String(item.fontIdx),
      shape: item.shape,
      padLayout: item.padLayout,
      cardLayout: item.cardLayout,
      logoStyle: item.logoStyle,
      gridStyle: item.gridStyle,
      texture: item.texture || 'none',
    });

    showStatusMessage('Historical state loaded successfully.');
  };

  const handleDownloadHistoryItemAgain = async (item: HistoryItem) => {
    handleLoadHistoryItem(item);
    
    // Allow state to fully render before exporting
    setTimeout(() => {
      switch (item.type) {
        case 'pad-pdf':
          handleDownloadPadPDF();
          break;
        case 'card-pdf':
          handleDownloadCardPDF();
          break;
        case 'pad-png':
          handleDownloadPadPNG();
          break;
        case 'card-png':
          handleDownloadCardPNG();
          break;
        case 'pad-svg':
          handleExportPadSVG();
          break;
        case 'card-svg':
          handleExportCardSVG();
          break;
        case 'vector-ai':
          handleExportAI();
          break;
        case 'photoshop-psd':
          handleExportPSD();
          break;
      }
    }, 250);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your saved download history?')) {
      setDownloadHistory([]);
      localStorage.removeItem('padgen_download_history');
      showStatusMessage('Download history cleared.');
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setDownloadHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('padgen_download_history', JSON.stringify(updated));
      return updated;
    });
    showStatusMessage('Item removed from history.');
  };

  const handleAiPremiumGenerate = async () => {
    const missing: string[] = [];
    if (!companyData.companyName) missing.push('Company Name');
    if (!companyData.address) missing.push('Address');
    if (!companyData.phone) missing.push('Phone');
    if (!companyData.email) missing.push('Email');

    if (missing.length > 0) {
      setError('Missing required field(s): ' + missing.join(', '));
      return;
    }

    setError(null);
    setAiLoading(true);
    showStatusMessage('Consulting Gemini AI Design Specialist...');

    try {
      const response = await fetch('/api/generate-premium-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyData.companyName,
          industry: companyData.industry || 'corporate',
          tagline: companyData.tagline,
          email: companyData.email,
          phone: companyData.phone,
          address: companyData.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate premium design.');
      }

      const designResult = await response.json();
      
      const generatedTheme: Theme = {
        name: `Gemini ${designResult.designAttributes?.primaryColor?.substring(1) || 'Custom'}`,
        primary: designResult.designAttributes?.primaryColor || '#1C1E22',
        accent: designResult.designAttributes?.accentColor || '#C5A880',
        paper: designResult.designAttributes?.paperColor || '#FFFFFF',
        secondary: designResult.designAttributes?.secondaryColor,
        shade2: designResult.designAttributes?.shade2Color,
        shade3: designResult.designAttributes?.shade3Color,
        decorations: designResult.designAttributes?.decorations,
        decorationColor: designResult.designAttributes?.decorationColor,
      };

      setCustomTheme(generatedTheme);
      setAiExplanation(designResult.designCommentary || 'Designed specifically for your industry using balanced negative space and rich multi-shaded geometry.');

      const fontIdx = HEADLINE_FONTS.findIndex(
        (f) => f.label.toLowerCase() === (designResult.designAttributes?.headlineFontLabel || '').toLowerCase()
      );
      const matchedFontIdx = fontIdx !== -1 ? fontIdx : 0;

      const shapeIdx = SHAPES.indexOf(designResult.designAttributes?.recommendedShape || 'circle');
      const matchedShapeIdx = shapeIdx !== -1 ? shapeIdx : 0;

      const padLayoutIdx = PAD_LAYOUTS.indexOf(designResult.designAttributes?.recommendedPadLayout || 'sideband');
      const matchedPadLayoutIdx = padLayoutIdx !== -1 ? padLayoutIdx : 0;

      const cardLayoutIdx = CARD_LAYOUTS.indexOf(designResult.designAttributes?.recommendedCardLayout || 'centered');
      const matchedCardLayoutIdx = cardLayoutIdx !== -1 ? cardLayoutIdx : 0;

      const logoStyleIdx = LOGO_STYLES.indexOf(designResult.designAttributes?.recommendedLogoStyle || 'classic');
      const matchedLogoStyleIdx = logoStyleIdx !== -1 ? logoStyleIdx : 0;

      const gridStyleIdx = GRID_STYLES.indexOf(designResult.designAttributes?.recommendedGridStyle || 'none');
      const matchedGridStyleIdx = gridStyleIdx !== -1 ? gridStyleIdx : 0;

      setActiveState({
        data: {
          ...companyData,
          casing: designResult.designAttributes?.textCasing || 'title',
        },
        themeIdx: -1,
        shapeIdx: matchedShapeIdx,
        padLayoutIdx: matchedPadLayoutIdx,
        cardLayoutIdx: matchedCardLayoutIdx,
        headlineIdx: matchedFontIdx,
        logoStyleIdx: matchedLogoStyleIdx,
        gridStyleIdx: matchedGridStyleIdx,
        textureIdx: 0,
      });

      setControls({
        font: String(matchedFontIdx),
        shape: SHAPES[matchedShapeIdx],
        padLayout: PAD_LAYOUTS[matchedPadLayoutIdx],
        cardLayout: CARD_LAYOUTS[matchedCardLayoutIdx],
        logoStyle: LOGO_STYLES[matchedLogoStyleIdx],
        gridStyle: GRID_STYLES[matchedGridStyleIdx],
        texture: 'none',
      });

      setCompanyData((prev) => ({
        ...prev,
        casing: designResult.designAttributes?.textCasing || 'title',
      }));

      showStatusMessage('Outstanding custom AI design loaded successfully!');
    } catch (err: any) {
      setError('AI generation failed: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Sync controls and companyData to activeState instantly on change
  useEffect(() => {
    const shapeIdx =
      controls.shape === 'random'
        ? activeState.shapeIdx
        : SHAPES.indexOf(controls.shape);

    const padLayoutIdx =
      controls.padLayout === 'random'
        ? activeState.padLayoutIdx
        : PAD_LAYOUTS.indexOf(controls.padLayout);

    const cardLayoutIdx =
      controls.cardLayout === 'random'
        ? activeState.cardLayoutIdx
        : CARD_LAYOUTS.indexOf(controls.cardLayout);

    const headlineIdx =
      controls.font === 'random'
        ? activeState.headlineIdx
        : Number(controls.font);

    const logoStyleIdx =
      controls.logoStyle === 'random'
        ? activeState.logoStyleIdx
        : LOGO_STYLES.indexOf(controls.logoStyle);

    const gridStyleIdx =
      controls.gridStyle === 'random'
        ? activeState.gridStyleIdx
        : GRID_STYLES.indexOf(controls.gridStyle);

    setActiveState((prev) => ({
      ...prev,
      data: { ...companyData },
      shapeIdx: shapeIdx !== -1 ? shapeIdx : prev.shapeIdx,
      padLayoutIdx: padLayoutIdx !== -1 ? padLayoutIdx : prev.padLayoutIdx,
      cardLayoutIdx: cardLayoutIdx !== -1 ? cardLayoutIdx : prev.cardLayoutIdx,
      headlineIdx: headlineIdx !== -1 ? headlineIdx : prev.headlineIdx,
      logoStyleIdx: logoStyleIdx !== -1 ? logoStyleIdx : prev.logoStyleIdx,
      gridStyleIdx: gridStyleIdx !== -1 ? gridStyleIdx : prev.gridStyleIdx,
    }));
  }, [controls, companyData]);

  // Generate completely random design
  const generateDesign = () => {
    const missing: string[] = [];
    if (!companyData.companyName) missing.push('Company Name');
    if (!companyData.address) missing.push('Address');
    if (!companyData.phone) missing.push('Phone');
    if (!companyData.email) missing.push('Email');

    if (missing.length > 0) {
      setError('Missing required field(s): ' + missing.join(', '));
      return;
    }

    setError(null);

    const themeIdx = Math.floor(Math.random() * THEMES.length);
    const shapeIdx =
      controls.shape === 'random'
        ? Math.floor(Math.random() * SHAPES.length)
        : SHAPES.indexOf(controls.shape);
    const padLayoutIdx =
      controls.padLayout === 'random'
        ? Math.floor(Math.random() * PAD_LAYOUTS.length)
        : PAD_LAYOUTS.indexOf(controls.padLayout);
    const cardLayoutIdx =
      controls.cardLayout === 'random'
        ? Math.floor(Math.random() * CARD_LAYOUTS.length)
        : CARD_LAYOUTS.indexOf(controls.cardLayout);
    const headlineIdx =
      controls.font === 'random'
        ? Math.floor(Math.random() * HEADLINE_FONTS.length)
        : Number(controls.font);
    const logoStyleIdx =
      controls.logoStyle === 'random'
        ? Math.floor(Math.random() * LOGO_STYLES.length)
        : LOGO_STYLES.indexOf(controls.logoStyle);
    const gridStyleIdx =
      controls.gridStyle === 'random'
        ? Math.floor(Math.random() * GRID_STYLES.length)
        : GRID_STYLES.indexOf(controls.gridStyle);
    const textureIdx =
      controls.texture === 'random'
        ? Math.floor(Math.random() * 4) // 4 textures: none, linen, vellum, canvas
        : ['none', 'linen', 'vellum', 'canvas'].indexOf(controls.texture);

    const casings: Array<'title' | 'upper'> = ['title', 'upper'];
    const randomCasing = casings[Math.floor(Math.random() * casings.length)];

    setCompanyData((prev) => ({
      ...prev,
      casing: randomCasing,
    }));

    setActiveState({
      data: {
        ...companyData,
        casing: randomCasing,
      },
      themeIdx,
      shapeIdx,
      padLayoutIdx,
      cardLayoutIdx,
      headlineIdx,
      logoStyleIdx,
      gridStyleIdx,
      textureIdx,
    });

    showStatusMessage('Design updated successfully.');
  };

  const handleRandomTheme = () => {
    const missing: string[] = [];
    if (!companyData.companyName) missing.push('Company Name');
    if (!companyData.address) missing.push('Address');
    if (!companyData.phone) missing.push('Phone');
    if (!companyData.email) missing.push('Email');

    if (missing.length > 0) {
      setError('Missing required field(s): ' + missing.join(', '));
      return;
    }

    setError(null);
    let themeIdx = activeState.themeIdx;
    do {
       themeIdx = Math.floor(Math.random() * THEMES.length);
    } while (THEMES.length > 1 && themeIdx === activeState.themeIdx);

    setActiveState((prev) => ({
      ...prev,
      data: { ...companyData },
      themeIdx,
    }));
    showStatusMessage('Theme transitioned smoothly.');
  };

  const handleResetAll = () => {
    setCompanyData(DEFAULT_COMPANY_DATA);
    setControls({
      font: 'random',
      shape: 'random',
      padLayout: 'random',
      cardLayout: 'random',
      logoStyle: 'random',
      gridStyle: 'none',
      texture: 'none',
    });
    showStatusMessage('Inputs and controls reset to default.');
  };

  const handleDownloadPadPDF = async () => {
    const wrapper = document.getElementById('printPad');
    const target = wrapper?.firstElementChild as HTMLElement;
    if (!target || !wrapper) {
      setError('Nothing to export yet — generate design first.');
      return;
    }
    showStatusMessage('Rendering Pad PDF…');
    try {

    const origElements = target.querySelectorAll('*');
    origElements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const comp = window.getComputedStyle(el);
        if (comp.color) el.setAttribute('data-comp-color', comp.color);
        if (comp.backgroundColor) el.setAttribute('data-comp-bg', comp.backgroundColor);
        if (comp.borderColor) el.setAttribute('data-comp-border', comp.borderColor);
        if (comp.fill) el.setAttribute('data-comp-fill', comp.fill);
        if (comp.stroke) el.setAttribute('data-comp-stroke', comp.stroke);
      }
    });

      
      const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (node) => {
          if (node instanceof SVGElement) {
            const rect = node.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return true;
          }
          return false;
        },
        onclone: 
        (doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const color = el.getAttribute('data-comp-color');
              const bg = el.getAttribute('data-comp-bg');
              const border = el.getAttribute('data-comp-border');
              const fill = el.getAttribute('data-comp-fill');
              const stroke = el.getAttribute('data-comp-stroke');
              
              if (color) el.style.setProperty('color', color, 'important');
              if (bg) el.style.setProperty('background-color', bg, 'important');
              if (border) el.style.setProperty('border-color', border, 'important');
              if (fill) el.style.setProperty('fill', fill, 'important');
              if (stroke) el.style.setProperty('stroke', stroke, 'important');
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const origElementsClean = target.querySelectorAll('*');
      origElementsClean.forEach((el) => {
        el.removeAttribute('data-comp-color');
        el.removeAttribute('data-comp-bg');
        el.removeAttribute('data-comp-border');
        el.removeAttribute('data-comp-fill');
        el.removeAttribute('data-comp-stroke');
      });

      const fn = `${baseFilename()}-pad.pdf`;
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const blob = new Blob([pdfArrayBuffer], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      await downloadFile(blobUrl, fn);
      window.URL.revokeObjectURL(blobUrl);
      showStatusMessage('Pad PDF downloaded.');
      addDownloadToHistory('pad-pdf', fn);
      if (user) {
        fetch('/api/history/log-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid
          },
          body: JSON.stringify({ userId: user.uid, type: 'pad-pdf' })
        }).catch(err => console.error('Failed to log download:', err));
      }
    } catch (err: any) {
      setError('PDF export failed: ' + err.message);
    }
  };

  const handleDownloadCardPDF = async () => {
    const wrapper = document.getElementById('printCardA4');
    const target = wrapper?.firstElementChild as HTMLElement;
    if (!target || !wrapper) {
      setError('Nothing to export yet — generate design first.');
      return;
    }
    showStatusMessage('Rendering A4 Card Sheet PDF…');
    try {

    const origElements = target.querySelectorAll('*');
    origElements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const comp = window.getComputedStyle(el);
        if (comp.color) el.setAttribute('data-comp-color', comp.color);
        if (comp.backgroundColor) el.setAttribute('data-comp-bg', comp.backgroundColor);
        if (comp.borderColor) el.setAttribute('data-comp-border', comp.borderColor);
        if (comp.fill) el.setAttribute('data-comp-fill', comp.fill);
        if (comp.stroke) el.setAttribute('data-comp-stroke', comp.stroke);
      }
    });

      
      const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (node) => {
          if (node instanceof SVGElement) {
            const rect = node.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return true;
          }
          return false;
        },
        onclone: 
        (doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const color = el.getAttribute('data-comp-color');
              const bg = el.getAttribute('data-comp-bg');
              const border = el.getAttribute('data-comp-border');
              const fill = el.getAttribute('data-comp-fill');
              const stroke = el.getAttribute('data-comp-stroke');
              
              if (color) el.style.setProperty('color', color, 'important');
              if (bg) el.style.setProperty('background-color', bg, 'important');
              if (border) el.style.setProperty('border-color', border, 'important');
              if (fill) el.style.setProperty('fill', fill, 'important');
              if (stroke) el.style.setProperty('stroke', stroke, 'important');
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const origElementsClean = target.querySelectorAll('*');
      origElementsClean.forEach((el) => {
        el.removeAttribute('data-comp-color');
        el.removeAttribute('data-comp-bg');
        el.removeAttribute('data-comp-border');
        el.removeAttribute('data-comp-fill');
        el.removeAttribute('data-comp-stroke');
      });

      const fn = `${baseFilename()}-card-a4.pdf`;
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const blob = new Blob([pdfArrayBuffer], { type: 'application/octet-stream' });
      const blobUrl = window.URL.createObjectURL(blob);
      await downloadFile(blobUrl, fn);
      window.URL.revokeObjectURL(blobUrl);
      showStatusMessage('A4 Card Sheet PDF downloaded.');
      addDownloadToHistory('card-pdf', fn);
      if (user) {
        fetch('/api/history/log-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.uid
          },
          body: JSON.stringify({ userId: user.uid, type: 'card-pdf' })
        }).catch(err => console.error('Failed to log download:', err));
      }
    } catch (err: any) {
      setError('PDF export failed: ' + err.message);
    }
  };

  // Run initial generation on mount
  useEffect(() => {
    generateDesign();
  }, []);

  const baseFilename = () => {
    return activeState.data.companyName.replace(/\s+/g, '-').toLowerCase() || 'company';
  };

  const handleDownloadCardPNG = async () => {
    const wrapper = document.getElementById('printCard');
    const target = wrapper?.firstElementChild as HTMLElement;
    if (!target || !wrapper) {
      setError('Nothing to export yet — generate design first.');
      return;
    }
    showStatusMessage('Rendering Card PNG…');
    try {

    const origElements = target.querySelectorAll('*');
    origElements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const comp = window.getComputedStyle(el);
        if (comp.color) el.setAttribute('data-comp-color', comp.color);
        if (comp.backgroundColor) el.setAttribute('data-comp-bg', comp.backgroundColor);
        if (comp.borderColor) el.setAttribute('data-comp-border', comp.borderColor);
        if (comp.fill) el.setAttribute('data-comp-fill', comp.fill);
        if (comp.stroke) el.setAttribute('data-comp-stroke', comp.stroke);
      }
    });

      
      const canvas = await html2canvas(target, {
        scale: 3, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (node) => {
          if (node instanceof SVGElement) {
            const rect = node.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return true;
          }
          return false;
        },
        onclone: 
        (doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const color = el.getAttribute('data-comp-color');
              const bg = el.getAttribute('data-comp-bg');
              const border = el.getAttribute('data-comp-border');
              const fill = el.getAttribute('data-comp-fill');
              const stroke = el.getAttribute('data-comp-stroke');
              
              if (color) el.style.setProperty('color', color, 'important');
              if (bg) el.style.setProperty('background-color', bg, 'important');
              if (border) el.style.setProperty('border-color', border, 'important');
              if (fill) el.style.setProperty('fill', fill, 'important');
              if (stroke) el.style.setProperty('stroke', stroke, 'important');
            }
          });
        }
      });
      
      const fn = `${baseFilename()}-card.png`;
      const link = document.createElement('a');
      link.download = fn;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showStatusMessage('Card PNG downloaded.');
      addDownloadToHistory('card-png', fn);
    } catch (err: any) {
      setError('PNG export failed: ' + err.message);
    }
  };

  const handleDownloadPadPNG = async () => {
    const wrapper = document.getElementById('printPad');
    const target = wrapper?.firstElementChild as HTMLElement;
    if (!target || !wrapper) {
      setError('Nothing to export yet — generate design first.');
      return;
    }
    showStatusMessage('Rendering Pad PNG…');
    try {

    const origElements = target.querySelectorAll('*');
    origElements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const comp = window.getComputedStyle(el);
        if (comp.color) el.setAttribute('data-comp-color', comp.color);
        if (comp.backgroundColor) el.setAttribute('data-comp-bg', comp.backgroundColor);
        if (comp.borderColor) el.setAttribute('data-comp-border', comp.borderColor);
        if (comp.fill) el.setAttribute('data-comp-fill', comp.fill);
        if (comp.stroke) el.setAttribute('data-comp-stroke', comp.stroke);
      }
    });

      
      const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (node) => {
          if (node instanceof SVGElement) {
            const rect = node.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return true;
          }
          return false;
        },
        onclone: 
        (doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const color = el.getAttribute('data-comp-color');
              const bg = el.getAttribute('data-comp-bg');
              const border = el.getAttribute('data-comp-border');
              const fill = el.getAttribute('data-comp-fill');
              const stroke = el.getAttribute('data-comp-stroke');
              
              if (color) el.style.setProperty('color', color, 'important');
              if (bg) el.style.setProperty('background-color', bg, 'important');
              if (border) el.style.setProperty('border-color', border, 'important');
              if (fill) el.style.setProperty('fill', fill, 'important');
              if (stroke) el.style.setProperty('stroke', stroke, 'important');
            }
          });
        }
      });
      
      const fn = `${baseFilename()}-pad.png`;
      const link = document.createElement('a');
      link.download = fn;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showStatusMessage('Pad PNG downloaded.');
      addDownloadToHistory('pad-png', fn);
    } catch (err: any) {
      setError('PNG export failed: ' + err.message);
    }
  };

  const handleExportPadSVG = () => {
    const printPadEl = document.getElementById('printPad');
    if (!printPadEl) return;
    const html = printPadEl.innerHTML;
    const fn = `${baseFilename()}-pad.svg`;
    downloadBlob(svgWrap(html, 210, 297), fn, 'image/svg+xml');
    showStatusMessage('Pad SVG downloaded.');
    addDownloadToHistory('pad-svg', fn);
  };

  const handleExportCardSVG = () => {
    const printCardEl = document.getElementById('printCard');
    if (!printCardEl) return;
    const html = printCardEl.innerHTML;
    const fn = `${baseFilename()}-card.svg`;
    downloadBlob(svgWrap(html, 89, 51), fn, 'image/svg+xml');
    showStatusMessage('Card SVG downloaded.');
    addDownloadToHistory('card-svg', fn);
  };

  const handleExportAI = () => {
    const printPadEl = document.getElementById('printPad');
    if (!printPadEl) return;
    const html = printPadEl.innerHTML;
    const vectorData = svgWrap(html, 210, 297);
    const fn = `${baseFilename()}-vector.ai`;
    downloadBlob(vectorData, fn, 'application/postscript');
    showStatusMessage('Adobe Illustrator vector (.ai) saved.');
    addDownloadToHistory('vector-ai', fn);
  };

  const handleExportPSD = async () => {
    const target = document.getElementById('printPad')?.firstElementChild as HTMLElement;
    if (!target) return;
    showStatusMessage('Preparing layered document stream…');
    try {

    const origElements = target.querySelectorAll('*');
    origElements.forEach((el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const comp = window.getComputedStyle(el);
        if (comp.color) el.setAttribute('data-comp-color', comp.color);
        if (comp.backgroundColor) el.setAttribute('data-comp-bg', comp.backgroundColor);
        if (comp.borderColor) el.setAttribute('data-comp-border', comp.borderColor);
        if (comp.fill) el.setAttribute('data-comp-fill', comp.fill);
        if (comp.stroke) el.setAttribute('data-comp-stroke', comp.stroke);
      }
    });

      const canvas = await html2canvas(target, {
        scale: 2, // reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: 
        (doc) => {
          const elements = doc.querySelectorAll('*');
          elements.forEach((el) => {
            if (el instanceof HTMLElement || el instanceof SVGElement) {
              const color = el.getAttribute('data-comp-color');
              const bg = el.getAttribute('data-comp-bg');
              const border = el.getAttribute('data-comp-border');
              const fill = el.getAttribute('data-comp-fill');
              const stroke = el.getAttribute('data-comp-stroke');
              
              if (color) el.style.setProperty('color', color, 'important');
              if (bg) el.style.setProperty('background-color', bg, 'important');
              if (border) el.style.setProperty('border-color', border, 'important');
              if (fill) el.style.setProperty('fill', fill, 'important');
              if (stroke) el.style.setProperty('stroke', stroke, 'important');
            }
          });
        }
      });
      
      const origElementsClean = target.querySelectorAll('*');
      origElementsClean.forEach((el) => {
        el.removeAttribute('data-comp-color');
        el.removeAttribute('data-comp-bg');
        el.removeAttribute('data-comp-border');
        el.removeAttribute('data-comp-fill');
        el.removeAttribute('data-comp-stroke');
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const fn = `${baseFilename()}-document.psd`;
        const file = new File([blob], fn, { type: 'image/vnd.adobe.photoshop' });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showStatusMessage('Photoshop document container (.psd) saved.');
        addDownloadToHistory('photoshop-psd', fn);
      }, 'image/png');
    } catch (err: any) {
      setError('PSD export failed: ' + err.message);
    }
  };

  const handleSaveTemplate = () => {
    const payload = {
      version: 1,
      data: activeState.data,
      themeIdx: activeState.themeIdx,
      shapeIdx: activeState.shapeIdx,
      padLayoutIdx: activeState.padLayoutIdx,
      cardLayoutIdx: activeState.cardLayoutIdx,
      headlineIdx: activeState.headlineIdx,
      logoStyleIdx: activeState.logoStyleIdx,
      gridStyleIdx: activeState.gridStyleIdx,
    };
    downloadBlob(JSON.stringify(payload, null, 2), `${baseFilename()}-template.json`, 'application/json');
    showStatusMessage('Template configuration saved.');
  };

  const handleLoadTemplate = (payload: any) => {
    if (!payload.data) {
      setError('Invalid template format.');
      return;
    }
    setCompanyData(payload.data);
    const newState: DesignState = {
      data: payload.data,
      themeIdx: payload.themeIdx ?? 0,
      shapeIdx: payload.shapeIdx ?? 0,
      padLayoutIdx: payload.padLayoutIdx ?? 0,
      cardLayoutIdx: payload.cardLayoutIdx ?? 0,
      headlineIdx: payload.headlineIdx ?? 0,
      logoStyleIdx: payload.logoStyleIdx ?? 0,
      gridStyleIdx: payload.gridStyleIdx ?? 0,
      textureIdx: payload.textureIdx ?? 0,
    };
    setActiveState(newState);
    setControls({
      font: String(newState.headlineIdx),
      shape: SHAPES[newState.shapeIdx],
      padLayout: PAD_LAYOUTS[newState.padLayoutIdx],
      cardLayout: CARD_LAYOUTS[newState.cardLayoutIdx],
      logoStyle: LOGO_STYLES[newState.logoStyleIdx],
      gridStyle: GRID_STYLES[newState.gridStyleIdx],
      texture: TEXTURES[newState.textureIdx] || 'none',
    });
    setError(null);
    showStatusMessage('Template configuration loaded.');
  };

  const activeTheme = activeState.themeIdx === -1 && customTheme ? customTheme : (THEMES[activeState.themeIdx] || THEMES[0]);
  const activeShape = SHAPES[activeState.shapeIdx];
  const activePadLayout = PAD_LAYOUTS[activeState.padLayoutIdx];
  const activeCardLayout = CARD_LAYOUTS[activeState.cardLayoutIdx];
  const activeFontStack = HEADLINE_FONTS[activeState.headlineIdx].stack;
  const activeFontLabel = HEADLINE_FONTS[activeState.headlineIdx].label;
  const activeLogoStyle = LOGO_STYLES[activeState.logoStyleIdx];
  const activeGridStyle = GRID_STYLES[activeState.gridStyleIdx];
  const activeTexture = TEXTURES[activeState.textureIdx] || 'none';

  const handleDataChange = (newData: typeof companyData) => {
    const industryChanged = newData.industry !== companyData.industry;
    setCompanyData(newData);
    
    if (industryChanged) {
      setTimeout(() => generateDesign(), 100);
    }
  };

  return (
    <div id="app" className="flex flex-col md:flex-row w-full min-h-[700px] rounded-xl overflow-hidden bg-[#EFEFED]">
      <ControlPanel
        companyData={companyData}
        onDataChange={handleDataChange}
        controls={controls}
        onControlsChange={setControls}
        onGenerate={generateDesign}
        onRandomTheme={handleRandomTheme}
        onResetAll={handleResetAll}
        onDownloadPadPDF={handleDownloadPadPDF}
        onDownloadCardPDF={handleDownloadCardPDF}
        onExportCardSVG={handleExportCardSVG}
        onExportPadSVG={handleExportPadSVG}
        onDownloadCardPNG={handleDownloadCardPNG}
        onDownloadPadPNG={handleDownloadPadPNG}
        onExportAI={handleExportAI}
        onExportPSD={handleExportPSD}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        error={error}
        status={status}
        onAiPremiumGenerate={handleAiPremiumGenerate}
        aiLoading={aiLoading}
        aiExplanation={aiExplanation}
        onOpenHistory={() => setHistoryDrawerOpen(true)}
        historyCount={downloadHistory.length}
      />

      <PreviewStage
        companyData={activeState.data}
        theme={activeTheme}
        shape={activeShape}
        padLayout={activePadLayout}
        cardLayout={activeCardLayout}
        headlineFont={activeFontStack}
        logoStyle={activeLogoStyle}
        gridStyle={activeGridStyle}
        texture={activeTexture as any}
        previewPadRef={previewPadRef}
        previewCardRef={previewCardRef}
        onDownloadPadPDF={handleDownloadPadPDF}
        onDownloadCardPDF={handleDownloadCardPDF}
      />

      {/* Off-screen/Print nodes (unscaled at 100% dimensions in mm) */}
      <div id="printPad" style={{ color: '#000000' }}>
        <PadPreview
          data={activeState.data}
          theme={activeTheme}
          shape={activeShape}
          layout={activePadLayout}
          headlineFont={activeFontStack}
          logoStyle={activeLogoStyle}
          gridStyle={activeGridStyle}
          texture={activeTexture as any}
        />
      </div>
      <div id="printCard" style={{ color: '#000000' }}>
        <CardPreview
          data={activeState.data}
          theme={activeTheme}
          shape={activeShape}
          layout={activeCardLayout}
          headlineFont={activeFontStack}
          logoStyle={activeLogoStyle}
          texture={activeTexture as any}
        />
      </div>
      <div id="printCardA4" style={{ color: '#000000' }}>
        <div style={{ width: '210mm', height: '297mm', background: '#ffffff', padding: '10mm', color: '#000000' }}>
          <div style={{ display: 'flex', gap: '5mm' }}>
            <div style={{ width: '89mm', height: '51mm', border: '1px solid #ccc' }}>
              <CardPreview
                data={activeState.data}
                theme={activeTheme}
                shape={activeShape}
                layout={activeCardLayout}
                headlineFont={activeFontStack}
                logoStyle={activeLogoStyle}
                texture={activeTexture as any}
              />
            </div>
            <div style={{ width: '89mm', height: '51mm', border: '1px solid #ccc' }}>
              <CardPreview
                data={activeState.data}
                theme={activeTheme}
                shape={activeShape}
                layout={activeCardLayout}
                headlineFont={activeFontStack}
                logoStyle={activeLogoStyle}
                texture={activeTexture as any}
              />
            </div>
          </div>
        </div>
      </div>

      <HistoryPanel
        isOpen={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        historyList={downloadHistory}
        onLoadItem={handleLoadHistoryItem}
        onDownloadItemAgain={handleDownloadHistoryItemAgain}
        onClearHistory={handleClearHistory}
        onDeleteItem={handleDeleteHistoryItem}
      />
    </div>
  );
}
