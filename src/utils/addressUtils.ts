import { PassportData } from '../types';

export const getGeneratedEmail = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.email) return itemData.email;
  
  const fullGivenName = (itemData.givenName || '').trim();
  const surname = (itemData.surname || '').trim();
  const nameTokens = `${fullGivenName} ${surname}`.split(/\s+/).filter(Boolean);
  
  const prefixesToIgnore = ['md', 'md.', 'mohammad', 'mohammed', 'muhammad', 'mst', 'mst.', 'mosammat', 'mr', 'mr.', 'mrs', 'mrs.', 'miss'];
  const meaningfulTokens = nameTokens.filter(token => !prefixesToIgnore.includes(token.toLowerCase()));
  
  const mainPart = meaningfulTokens[0] || nameTokens[0] || 'user';
  
  const nameStr = mainPart.replace(/[^a-zA-Z]/g, '').toLowerCase();
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

export const extractMainNamePart = (name: string): string => {
  if (!name || name === 'Unknown') return 'Unknown';
  
  const prefixesToIgnore = ['md', 'md.', 'mohammad', 'mohammed', 'muhammad', 'mst', 'mst.', 'mosammat', 'mr', 'mr.', 'mrs', 'mrs.', 'miss', 'sree', 'shree'];
  const nameTokens = name.split(/\s+/).filter(Boolean);
  const meaningfulTokens = nameTokens.filter(token => !prefixesToIgnore.includes(token.toLowerCase()));
  
  const mainPart = meaningfulTokens[0] || nameTokens[0] || 'Unknown';
  return mainPart.charAt(0).toUpperCase() + mainPart.slice(1).toLowerCase();
};

export const generateRandomEnterpriseName = (name: string): string => {
  const mainName = extractMainNamePart(name);
  
  const suffixes = ['International', 'Store', 'Traders', 'Fashion House', 'Boutique House', 'Limited', 'Stationary'];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const suffixIndex = Math.abs(hash) % suffixes.length;
  const suffix = suffixes[suffixIndex];
  
  return `${mainName} ${suffix}`;
};

export const getProprietorBusinessName = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.proprietorBusinessName) return itemData.proprietorBusinessName;
  const nameToUse = itemData.givenName || itemData.surname || 'Unknown';
  return generateRandomEnterpriseName(nameToUse);
};

export const getJobCompanyName = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.jobCompanyName) return itemData.jobCompanyName;
  const nameToUse = itemData.fatherName || itemData.motherName || 'Unknown';
  return generateRandomEnterpriseName(nameToUse);
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
