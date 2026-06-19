import { PassportData } from '../types';

export const getGeneratedEmail = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.email) return itemData.email;
  const nameStr = ((itemData.givenName || '') + (itemData.surname || '')).replace(/[^a-zA-Z]/g, '').toLowerCase();
  const dobStr = itemData.dob || '';
  const yearMatch = dobStr.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '';
  if (!nameStr) return '';
  return `${nameStr}${year}@gmail.com`;
};

export const isHinduName = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  const hinduKeywords = [
    'das', 'ghosh', 'sen', 'bose', 'datta', 'dutta', 'nandi', 'pal', 'paul', 'raha', 'roy', 'saha', 
    'shill', 'sil', 'sarkar', 'majumder', 'nath', 'barman', 'karmakar', 'deb', 'bhowmik', 'poddar', 
    'banik', 'dev', 'guha', 'bhattacharya', 'mukherjee', 'banerjee', 'chatterjee', 'ganguly', 'ray', 
    'biswas', 'haldar', 'mandal', 'bera', 'mitra', 'sharma', 'chandra', 'kumar', 'mondal', 'shil', 'chakraborty'
  ];
  return hinduKeywords.some(keyword => lowerName.includes(keyword));
};

export const generateRandomEnterpriseName = (name: string, isJob = false): string => {
  const firstName = name.split(' ').filter(p => p.length > 2)[0] || name.split(' ')[0] || 'Unknown';
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  
  if (isHinduName(name)) {
    const hinduSuffixes = isJob 
      ? ['Jewellers', 'Sweetmeat', 'Mistanno Vandar', 'Bastraloy'] 
      : ['Hair Cutting Salon', 'Mistanno Vandar', 'Sweet Store', 'Jewellers', 'Bastraloy', 'Mishti Ghor'];
    const suffix = hinduSuffixes[name.length % hinduSuffixes.length];
    const prefix = name.length % 2 === 0 ? 'MS ' : '';
    return `${prefix}${capitalizedName} ${suffix}`.trim();
  }
  
  const suffixes = suffixesToGet(name, isJob);
  const suffix = suffixes[name.length % suffixes.length];
  
  const prefixes = ['MS ', '', ''];
  const prefix = prefixes[name.length % prefixes.length];
  
  return `${prefix}${capitalizedName} ${suffix}`.trim();
};

const suffixesToGet = (name: string, isJob: boolean): string[] => {
  return isJob 
    ? ['Enterprise', 'Traders', 'Corporation', 'Agency', 'Trading', 'Limited'] 
    : ['Enterprise', 'Traders', 'Telecom', 'Motors', 'Fabrics', 'Electronics'];
};

export const getProprietorBusinessName = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.proprietorBusinessName) return itemData.proprietorBusinessName;
  const nameToUse = itemData.givenName || itemData.surname || itemData.fatherName || itemData.motherName || 'Unknown';
  const fullName = `${itemData.givenName || ''} ${itemData.surname || ''} ${itemData.fatherName || ''} ${itemData.motherName || ''}`;
  return generateRandomEnterpriseName(isHinduName(fullName) ? fullName : nameToUse);
};

export const getJobCompanyName = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.jobCompanyName) return itemData.jobCompanyName;
  const nameToUse = itemData.fatherName || itemData.motherName || itemData.surname || 'Unknown';
  const fullName = `${itemData.givenName || ''} ${itemData.surname || ''} ${itemData.fatherName || ''} ${itemData.motherName || ''}`;
  return generateRandomEnterpriseName(isHinduName(fullName) ? fullName : nameToUse, true);
};

export const getJobRole = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.jobRole) return itemData.jobRole;
  const nameLen = (itemData.givenName || itemData.surname || 'a').length;
  const roles = ['Manager', 'Assistant Manager', 'Office Assistant', 'Salesman', 'Executive'];
  return roles[nameLen % roles.length];
};

export const normalizeGender = (gender: string | undefined): string => {
  if (!gender) return '';
  const lower = gender.toLowerCase().trim();
  if (lower === 'm' || lower === 'male') return 'MALE';
  if (lower === 'f' || lower === 'female') return 'FEMALE';
  return gender.toUpperCase();
};

export const generateDataText = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  
  const normalizedGender = normalizeGender(itemData.gender);

  return `=== PASSPORT DATA ===
EMAIL: ${getGeneratedEmail(itemData)}
DOB: ${itemData.dob}
Surname: ${itemData.surname}
Given Name: ${itemData.givenName}
Town/City of birth/BIRTH PLACE: ${itemData.birthPlace}
National Id No/BIRTH CERTIFICATE NO: ${itemData.nidOrBirthCertNumber}
Gender: ${normalizedGender}
Blood Group: Unknown
Date of Issue: ${itemData.issueDate}
Date of Expiry: ${itemData.expiryDate}
Place of Issue: ${itemData.placeOfIssue || "DHAKA"}

=== ADDRESS PROFILE ===
Present Address: ${itemData.presentAddress || 'N/A'}
Permanent Address: ${itemData.permanentAddress || 'N/A'}

=== ADDITIONAL INFORMATION ===
Father's Name: ${itemData.fatherName}
Mother's Name: ${itemData.motherName}
Spouse's Name: ${itemData.spouseName || "N/A"}
Mobile Number: ${itemData.mobileNumber ? itemData.mobileNumber.replace(/^\+88\s*/, '') : ''}
Town/City of birth/BIRTH PLACE: ${itemData.birthPlaceDistrict || itemData.birthPlace || 'N/A'}

=== BUSINESS DETAILS (PROPRIETORSHIP) ===
Business Name: ${getProprietorBusinessName(itemData)}
Role: Proprietor
Business Address (Present): ${itemData.businessAddressDhaka || 'N/A'}
Business Address (Permanent): ${itemData.businessAddressLocal || 'N/A'}

=== PRIVATE SERVICE / JOB ===
Company Name: ${getJobCompanyName(itemData)}
Role: ${getJobRole(itemData)}
Office Address (Present): ${itemData.officeAddressDhaka || 'N/A'}
Office Address (Permanent): ${itemData.officeAddressLocal || 'N/A'}
`;
};
