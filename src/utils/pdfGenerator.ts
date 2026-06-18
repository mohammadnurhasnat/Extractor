import { jsPDF } from 'jspdf';
import { PassportData } from '../types';
import {
  getPresentAddress,
  getGeneratedEmail,
  getProprietorBusinessName,
  getBusinessAddressDhaka,
  getBusinessAddressLocal,
  getJobCompanyName,
  getOfficeAddressDhaka,
  getJobRole
} from './addressUtils';

export const generatePDF = (data: PassportData): void => {
  // Create new PDF layout (A4 size: 210mm x 297mm)
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 15;

  // Preventive Page-Break Guard
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 20;
      
      // Render running header on subsequent pages
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Passport Data Summary (Continued)', 15, 12);
      
      doc.setDrawColor(200, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(15, 14, 195, 14);
    }
  };

  // Beautiful Structured Side-Accent Sections
  const drawSectionHeading = (title: string) => {
    checkPageBreak(25);
    doc.setFillColor(233, 255, 252); // #E9FFFC (Soft Brand Pastel)
    doc.rect(15, y, 180, 8, 'F');
    
    doc.setDrawColor(12, 132, 147); // #0C8493 (Brand Accent Side Rail)
    doc.setLineWidth(1.5);
    doc.line(15, y, 15, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(12, 132, 147); // #0C8493
    doc.text(title, 20, y + 5.5);
    y += 14;
  };

  // Column Data Field Drawer with Custom Auto-Wrap Engine
  const drawField = (label: string, value: string, x: number, width: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120); // Muted Label Color
    doc.text(label, x, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30); // Rich text color
    
    const lines = doc.splitTextToSize(value || 'N/A', width);
    let currentY = y + 4.5;
    lines.forEach((line: string) => {
      doc.text(line, x, currentY);
      currentY += 4.5;
    });
    
    return currentY - y;
  };

  // Row layout grid helper (Double column)
  const drawRow = (leftLabel: string, leftVal: string, rightLabel: string, rightVal: string) => {
    checkPageBreak(18);
    const heightLeft = drawField(leftLabel, leftVal, 15, 85);
    const heightRight = drawField(rightLabel, rightVal, 110, 85);
    const maxHeight = Math.max(heightLeft, heightRight);
    y += maxHeight + 3; // Keep compact padding
  };

  // Full Width Paragraph Drawer for Addresses
  const drawFullWidthField = (label: string, value: string) => {
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label, 15, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    
    const lines = doc.splitTextToSize(value || 'N/A', 180);
    let currentY = y + 4.5;
    lines.forEach((line: string) => {
      doc.text(line, 15, currentY);
      currentY += 4.5;
    });
    y = currentY + 3;
  };

  // Top Brand Accent bar
  doc.setFillColor(255, 128, 6); // #FF8006 (Brand Primary Highlight)
  doc.rect(15, y, 180, 4, 'F');
  y += 12;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(12, 132, 147); // #0C8493
  doc.text('PASSPORT DATA REPORT', 15, y);
  
  // Meta / Date Information
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const dateStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB');
  doc.text(`Report Generated: ${dateStr}`, 195, y, { align: 'right' });
  y += 6;

  // Secondary Accent Line divider
  doc.setDrawColor(0, 196, 209); // #00C4D1
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 10;

  // SECTION 1: Personal & Passport Profile
  drawSectionHeading('1. PERSONAL & PASSPORT PROFILE');
  drawRow('GIVEN NAME', data.givenName || 'N/A', 'SURNAME', data.surname || 'N/A');
  drawRow('GENDER', data.gender || 'N/A', 'DATE OF BIRTH', data.dob || 'N/A');
  drawRow('PASSPORT NUMBER', data.passportNumber || 'N/A', 'NATIONAL ID / BIRTH CERT NO', data.nidOrBirthCertNumber || 'N/A');
  drawRow('DATE OF ISSUE', data.issueDate || 'N/A', 'DATE OF EXPIRY', data.expiryDate || 'N/A');
  drawRow('FATHER\'S NAME', data.fatherName || 'N/A', 'MOTHER\'S NAME', data.motherName || 'N/A');
  drawRow('SPOUSE\'S NAME', data.spouseName || 'N/A', 'EMAIL ADDRESS', getGeneratedEmail(data));
  drawRow('MOBILE NUMBER', data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : 'N/A', 'PLACE OF ISSUE', 'DHAKA');
  drawRow('PLACE OF BIRTH', data.birthPlace || 'N/A', 'EMERGENCY CONTACT', data.emergencyContactAddress ? 'Available' : 'N/A');
  y += 4;

  // SECTION 2: Address Information
  drawSectionHeading('2. ADDRESS INFORMATION');
  const presentAddr = getPresentAddress(data);
  drawFullWidthField('PRESENT ADDRESS (DHAKA RESIDENCY)', presentAddr);
  drawFullWidthField('PERMANENT ADDRESS', data.permanentAddress || 'N/A');
  if (data.emergencyContactAddress) {
    drawFullWidthField('EMERGENCY CONTACT ADDRESS', data.emergencyContactAddress);
  }
  y += 4;

  // SECTION 3: Business & Professional Details
  drawSectionHeading('3. BUSINESS & PROFESSIONAL DETAILS');
  
  // A. Proprietorship Details
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 128, 6); // #FF8006 (Brand Highlights)
  doc.text('A. BUSINESS (PROPRIETORSHIP)', 15, y);
  y += 6;
  drawRow('BUSINESS NAME', getProprietorBusinessName(data), 'DESIGNATION', 'Proprietor');
  drawFullWidthField('BUSINESS ADDRESS (DHAKA / PRESENT)', getBusinessAddressDhaka(presentAddr, data));
  drawFullWidthField('BUSINESS ADDRESS (LOCAL / PERMANENT)', getBusinessAddressLocal(data.permanentAddress, data));
  y += 4;

  // B. Job Details
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 128, 6); // #FF8006 (Brand Highlights)
  doc.text('B. PRIVATE SERVICE / EMPLOYMENT', 15, y);
  y += 6;
  drawRow('COMPANY NAME', getJobCompanyName(data), 'DESIGNATION', getJobRole(data));
  drawFullWidthField('OFFICE ADDRESS (DHAKA / PRESENT)', getOfficeAddressDhaka(presentAddr, data));
  drawFullWidthField('OFFICE ADDRESS (LOCAL / PERMANENT)', getBusinessAddressLocal(data.permanentAddress, data));

  // Professional Footer decorator loops on all generated pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(15, 282, 195, 282);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Confidential Document - Generated via Auto Passport Data Extractor Platform', 15, 287);
    doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' });
  }

  // Save document
  doc.save(`Passport_Report_${data.givenName || 'Summary'}.pdf`);
};
