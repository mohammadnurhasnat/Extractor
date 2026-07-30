export interface PdfInfo {
  isValid: boolean;
  pageCount: number;
  fileSizeFormatted: string;
  pdfVersion?: string;
  error?: string;
}

export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const fileSizeFormatted = file.size >= 1024 * 1024 
    ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    : (file.size / 1024).toFixed(1) + ' KB';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1');
    const text = decoder.decode(bytes);

    if (!text.startsWith('%PDF-')) {
      return {
        isValid: false,
        pageCount: 0,
        fileSizeFormatted,
        error: 'Invalid PDF magic header signature'
      };
    }

    // Version parsing e.g. %PDF-1.4 -> 1.4
    const versionMatch = text.match(/^%PDF-(\d+\.\d+)/);
    const pdfVersion = versionMatch ? `PDF v${versionMatch[1]}` : 'PDF Document';

    // Page count extraction
    const pageMatches = text.match(/\/Type\s*\/Page\b/g);
    let pageCount = pageMatches ? pageMatches.length : 1;

    const countMatch = text.match(/\/Count\s+(\d+)/);
    if (countMatch && countMatch[1]) {
      const parsedCount = parseInt(countMatch[1], 10);
      if (parsedCount > 0 && parsedCount < 500) {
        pageCount = parsedCount;
      }
    }

    return {
      isValid: true,
      pageCount: Math.max(1, pageCount),
      fileSizeFormatted,
      pdfVersion
    };
  } catch (err) {
    return {
      isValid: false,
      pageCount: 0,
      fileSizeFormatted,
      error: 'Unable to parse PDF content'
    };
  }
}
