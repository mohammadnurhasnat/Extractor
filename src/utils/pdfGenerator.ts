import { jsPDF } from 'jspdf';
import { PassportData, UndertakingFormData } from '../types';
import {
  getPresentAddress,
  getPermanentAddress,
  getGeneratedEmail,
  getProprietorBusinessName,
  getBusinessAddressDhaka,
  getBusinessAddressLocal,
  getJobCompanyName,
  getOfficeAddressDhaka,
  getJobRole
} from './addressUtils';

export const getPDFDocument = (data: PassportData): jsPDF => {
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
  const permanentAddr = getPermanentAddress(data);
  drawFullWidthField('PRESENT ADDRESS (DHAKA RESIDENCY)', presentAddr);
  drawFullWidthField('PERMANENT ADDRESS', permanentAddr);
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
  drawFullWidthField('BUSINESS ADDRESS (LOCAL / PERMANENT)', getBusinessAddressLocal(permanentAddr, data));
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
  drawFullWidthField('OFFICE ADDRESS (LOCAL / PERMANENT)', getBusinessAddressLocal(permanentAddr, data));

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

  return doc;
};

export const generatePDF = (data: PassportData): void => {
  const doc = getPDFDocument(data);
  doc.save(`Passport_Report_${data.givenName || 'Summary'}.pdf`);
};

export const getUndertakingPDFDocument = (formData: UndertakingFormData): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 25;
  const leftMargin = 20;
  const contentWidth = 170;

  // Set Times font - elegant and formal
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('VISA UNDERTAKING FORM', 105, y, { align: 'center' });
  y += 12;

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  
  const introText = 'I, the undersigned, hereby submit this undertaking in support of my application for an Indian visa.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  splitIntro.forEach((line: string) => {
    doc.text(line, leftMargin, y);
    y += 6.5;
  });
  y += 4;

  // 1. Personal Details
  doc.setFont('times', 'bold');
  doc.text('1. Personal Details', leftMargin, y);
  y += 6.5;

  doc.setFont('times', 'normal');
  
  const details = [
    { label: 'Full Name:', value: formData.fullName || '______________________' },
    { label: 'Passport Number:', value: formData.passportNumber || '______________________' },
    { label: 'Nationality:', value: formData.nationality || '______________________' },
    { label: 'Date of Birth:', value: formData.dob || '______________________' },
    { label: 'Address:', value: formData.address || '______________________' }
  ];

  details.forEach((item) => {
    doc.setFont('times', 'bold');
    doc.text(item.label, leftMargin + 4, y);
    doc.setFont('times', 'normal');
    
    if (item.label === 'Address:') {
      const splitAddr = doc.splitTextToSize(item.value, contentWidth - 35);
      splitAddr.forEach((line: string, index: number) => {
        doc.text(line, leftMargin + 35, y);
        if (index < splitAddr.length - 1) {
          y += 5.5;
        }
      });
    } else {
      doc.text(item.value, leftMargin + 35, y);
    }
    y += 6.5;
  });
  y += 1.5;

  // 2. Purpose of Visit
  doc.setFont('times', 'bold');
  doc.text('2. Purpose of Visit', leftMargin, y);
  y += 6.5;

  doc.setFont('times', 'normal');
  const purposeText = `I wish to visit India for the purpose of ${formData.purpose || '____________________________________________'}.`;
  const splitPurpose = doc.splitTextToSize(purposeText, contentWidth);
  splitPurpose.forEach((line: string) => {
    doc.text(line, leftMargin + 4, y);
    y += 6.5;
  });
  y += 1.5;

  // 3. Duration of Stay
  doc.setFont('times', 'bold');
  doc.text('3. Duration of Stay', leftMargin, y);
  y += 6.5;

  doc.setFont('times', 'normal');
  const durationText = `I intend to stay in India from ${formData.travelFrom || '______________________'} to ${formData.travelTo || '______________________'}, for a total period of ${formData.duration || '______________________'}.`;
  const splitDuration = doc.splitTextToSize(durationText, contentWidth);
  splitDuration.forEach((line: string) => {
    doc.text(line, leftMargin + 4, y);
    y += 6.5;
  });
  y += 1.5;

  // 4. Return to Home Country
  doc.setFont('times', 'bold');
  doc.text('4. Return to Home Country', leftMargin, y);
  y += 6.5;

  doc.setFont('times', 'normal');
  const returnText = `I undertake to return to my home country immediately upon the completion of my visit, and I confirm that I have no intention of overstaying my visa in India. I will return to ${formData.returnCountry || '______________________'}.`;
  const splitReturn = doc.splitTextToSize(returnText, contentWidth);
  splitReturn.forEach((line: string) => {
    doc.text(line, leftMargin + 4, y);
    y += 6.5;
  });
  y += 1.5;

  // 5. Compliance with Indian Laws
  doc.setFont('times', 'bold');
  doc.text('5. Compliance with Indian Laws', leftMargin, y);
  y += 6.5;

  doc.setFont('times', 'normal');
  const complianceText1 = `I hereby pledge to fully comply with the laws, regulations, and customs of India during my stay.`;
  const complianceText2 = `I acknowledge that I will not engage in any activity that is prohibited under Indian law and will respect the local customs and culture.`;
  
  const splitComp1 = doc.splitTextToSize(complianceText1, contentWidth);
  splitComp1.forEach((line: string) => {
    doc.text(line, leftMargin + 4, y);
    y += 5.5;
  });
  const splitComp2 = doc.splitTextToSize(complianceText2, contentWidth);
  splitComp2.forEach((line: string) => {
    doc.text(line, leftMargin + 4, y);
    y += 5.5;
  });
  y += 1.5;

  // 6. Acknowledgment and Declaration
  doc.setFont('times', 'bold');
  doc.text('6. Acknowledgment and Declaration', leftMargin, y);
  y += 6.5;

  doc.setFont('times', 'normal');
  const declarTexts = [
    `I understand that any violation of Indian laws or regulations may lead to the cancellation of my visa and may affect my future eligibility for a visa to India.`,
    `I declare that all information provided in my visa application is accurate and truthful to the best of my knowledge. I understand that providing false or misleading information may result in the denial of my visa application.`,
    `I undertake to adhere to all the terms and conditions of my visa and will ensure that I leave India before the expiration of my authorized stay.`
  ];

  declarTexts.forEach((text) => {
    const splitText = doc.splitTextToSize(text, contentWidth);
    splitText.forEach((line: string) => {
      doc.text(line, leftMargin + 4, y);
      y += 5.5;
    });
    y += 1.5;
  });

  y += 6;

  // Signature Block & Date
  doc.setFont('times', 'bold');
  doc.text('Signature of Applicant: __________________________', leftMargin, y);
  y += 8;
  doc.text(`Date: ${formData.date || '__________________________'}`, leftMargin, y);

  return doc;
};

export const generateUndertakingPDF = (formData: UndertakingFormData): void => {
  const doc = getUndertakingPDFDocument(formData);
  doc.save(`Indian_Visa_Undertaking_${formData.fullName.replace(/\s+/g, '_') || 'Applicant'}.pdf`);
};
