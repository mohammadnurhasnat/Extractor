import { PassportData } from '../types';

export function applyOcrCorrections(data: PassportData): PassportData {
  const corrected = { ...data };

  // For NID or numeric sequences: fix Os and Is read as 0s and 1s
  if (corrected.nidOrBirthCertNumber) {
    corrected.nidOrBirthCertNumber = corrected.nidOrBirthCertNumber
      .replace(/O/gi, '0')
      .replace(/I/gi, '1')
      .replace(/l/g, '1');
  }

  // Passport number: typically [Letters][Numbers]. E.g., A01234567
  if (corrected.passportNumber) {
    let pNum = corrected.passportNumber.toUpperCase();
    
    // Separate alphabetic prefix from numeric suffix
    const match = pNum.match(/^([A-Z0-9]{1,2})([A-Z0-9]+)$/);
    if (match) {
      let prefix = match[1];
      let suffix = match[2];
      
      // Prefix should generally be letters
      prefix = prefix.replace(/0/g, 'O').replace(/1/g, 'I');
      // Suffix should be numbers
      suffix = suffix.replace(/O/g, '0').replace(/I/g, '1');
      
      corrected.passportNumber = prefix + suffix;
    } else {
      // General fallback if no clear prefix/suffix
      // Just swap O to 0 and I to 1 assuming numbers are more prevalent inside it
      corrected.passportNumber = pNum
        .replace(/O/gi, '0')
        .replace(/I/gi, '1');
    }
  }

  // Mobile numbers are strictly numeric/symbols
  if (corrected.mobileNumber) {
    corrected.mobileNumber = corrected.mobileNumber
      .replace(/O/gi, '0')
      .replace(/I/gi, '1')
      .replace(/l/g, '1');
  }

  // Date fixes - only if format is fully numeric like DD/MM/YYYY
  const fixDate = (dateStr: string) => {
    if (!dateStr) return dateStr;
    if (/^[0-9OIl\/.-]+$/i.test(dateStr)) {
      return dateStr.replace(/O/gi, '0').replace(/I/gi, '1').replace(/l/g, '1');
    }
    return dateStr;
  };

  corrected.dob = fixDate(corrected.dob);
  corrected.issueDate = fixDate(corrected.issueDate);
  corrected.expiryDate = fixDate(corrected.expiryDate);

  // Names should not have numbers
  const fixName = (nameStr: string) => {
    if (!nameStr) return nameStr;
    return nameStr.replace(/0/g, 'O').replace(/1/g, 'I');
  };

  corrected.givenName = fixName(corrected.givenName);
  corrected.surname = fixName(corrected.surname);
  corrected.fatherName = fixName(corrected.fatherName);
  corrected.motherName = fixName(corrected.motherName);
  corrected.spouseName = fixName(corrected.spouseName);
  corrected.birthPlace = fixName(corrected.birthPlace);

  return corrected;
}
