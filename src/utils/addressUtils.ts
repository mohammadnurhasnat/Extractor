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

const GENERIC_NAMES = [
  'md', 'md.', 'mohammad', 'mohammed', 'muhammad', 'mst', 'mst.', 'mosammat', 
  'mr', 'mr.', 'mrs', 'mrs.', 'miss', 'sree', 'shree', 'abdul', 'abdur', 'late', 'late.'
];

const AUTHENTIC_PERSONAL_NAMES = [
  'Rahman', 'Islam', 'Ahmed', 'Hasan', 'Khan', 'Ali', 'Uddin', 'Chowdhury', 'Hossain',
  'Sarker', 'Alam', 'Akter', 'Begum', 'Sultana', 'Jahan', 'Yasmin', 'Khatun',
  'Anwar', 'Kamal', 'Jamal', 'Rafiq', 'Shafiq', 'Tareq', 'Mizan', 'Masud',
  'Kabir', 'Zaman', 'Iqbal', 'Faruk', 'Selim', 'Russel', 'Ripon', 'Sohel',
  'Sajid', 'Nayeem', 'Arif', 'Fahim', 'Tanvir', 'Imran', 'Rayhan', 'Arafat',
  'Biswas', 'Saha', 'Roy', 'Das', 'Ghosh', 'Dutta', 'Paul', 'Sarkar', 'Banik',
  'Siddique', 'Talukder', 'Bhuiyan', 'Mazumder', 'Patwary', 'Dewan', 'Munshi'
];

const ALLOWED_SUFFIXES = [
  'Traders',
  'Enterprise',
  'Holdings',
  'International',
  'Distribution',
  'Trading',
  'Logistics',
  'Builders',
  'Construction',
  'Engineering Works',
  'Textile',
  'Garments',
  'Agro',
  'Furniture',
  'Import Export'
];

export const getCleanPersonalName = (name: string): string => {
  if (!name || name === 'Unknown' || name.trim() === '') return '';
  const tokens = name.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter(t => !GENERIC_NAMES.includes(t.toLowerCase()));
  const selected = filtered[0] || tokens[0] || '';
  if (!selected) return '';
  return selected.charAt(0).toUpperCase() + selected.slice(1).toLowerCase();
};

function getDeterministicHash(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export const generateRandomEnterpriseName = (name: string): string => {
  const hash = getDeterministicHash(name);
  const personalName = getCleanPersonalName(name) || AUTHENTIC_PERSONAL_NAMES[hash % AUTHENTIC_PERSONAL_NAMES.length];
  const suffix = ALLOWED_SUFFIXES[hash % ALLOWED_SUFFIXES.length];
  return `${personalName} ${suffix}`;
};

export const getProprietorBusinessName = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.proprietorBusinessName) return itemData.proprietorBusinessName;
  
  const seed = itemData.passportNumber || itemData.givenName || 'business';
  const hash = getDeterministicHash(seed);
  
  let personalName = '';
  if (itemData.fatherName && itemData.fatherName !== 'Unknown') {
    personalName = getCleanPersonalName(itemData.fatherName);
  }
  if (!personalName && itemData.motherName && itemData.motherName !== 'Unknown') {
    personalName = getCleanPersonalName(itemData.motherName);
  }
  if (!personalName) {
    personalName = AUTHENTIC_PERSONAL_NAMES[hash % AUTHENTIC_PERSONAL_NAMES.length];
  }

  const suffix = ALLOWED_SUFFIXES[hash % ALLOWED_SUFFIXES.length];
  return `${personalName} ${suffix}`;
};

export const getJobCompanyName = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  if (itemData.jobCompanyName) return itemData.jobCompanyName;
  
  const seed = itemData.passportNumber || itemData.surname || 'company';
  const hash = getDeterministicHash(seed + '_company');
  
  let personalName = '';
  if (itemData.motherName && itemData.motherName !== 'Unknown') {
    personalName = getCleanPersonalName(itemData.motherName);
  }
  
  const fatherNameClean = itemData.fatherName ? getCleanPersonalName(itemData.fatherName) : '';
  if (!personalName || personalName === fatherNameClean) {
    let nameIndex = hash % AUTHENTIC_PERSONAL_NAMES.length;
    personalName = AUTHENTIC_PERSONAL_NAMES[nameIndex];
    if (personalName === fatherNameClean) {
      personalName = AUTHENTIC_PERSONAL_NAMES[(nameIndex + 1) % AUTHENTIC_PERSONAL_NAMES.length];
    }
  }

  const businessSeed = itemData.passportNumber || itemData.givenName || 'business';
  const businessHash = getDeterministicHash(businessSeed);
  const businessSuffixIndex = businessHash % ALLOWED_SUFFIXES.length;
  
  let companySuffixIndex = hash % ALLOWED_SUFFIXES.length;
  if (companySuffixIndex === businessSuffixIndex) {
    companySuffixIndex = (companySuffixIndex + 1) % ALLOWED_SUFFIXES.length;
  }
  const suffix = ALLOWED_SUFFIXES[companySuffixIndex];
  
  return `${personalName} ${suffix}`;
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
