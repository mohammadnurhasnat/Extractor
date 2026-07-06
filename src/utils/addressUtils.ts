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
  if (!itemData) return "";
  if (itemData.proprietorBusinessName) return itemData.proprietorBusinessName;
  if (!itemData.isPdf) {
    const fullName = `${itemData.givenName || ''} ${itemData.surname || ''}`.trim();
    if (fullName) {
      return generateRandomEnterpriseName(fullName);
    }
  }
  return "";
};

export const getJobCompanyName = (itemData: PassportData | null): string => {
  if (!itemData) return "";
  if (itemData.jobCompanyName) return itemData.jobCompanyName;
  if (!itemData.isPdf) {
    const fullName = `${itemData.givenName || ''} ${itemData.surname || ''}`.trim();
    if (fullName) {
      return generateRandomEnterpriseName(fullName);
    }
  }
  return "";
};

export const getJobRole = (itemData: PassportData | null): string => {
  if (!itemData) return "";
  if (itemData.jobRole) return itemData.jobRole;
  return "";
};

export const normalizeGender = (gender: string | undefined): string => {
  if (!gender) return '';
  const lower = gender.toLowerCase().trim();
  if (lower === 'm' || lower === 'male') return 'MALE';
  if (lower === 'f' || lower === 'female') return 'FEMALE';
  return gender.toUpperCase();
};

export interface KolkataHotel {
  name: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  phone: string;
}

export const KOLKATA_HOTELS: KolkataHotel[] = [
  {
    name: 'The Peerless Inn Kolkata',
    address: '12, Jawaharlal Nehru Rd, Esplanade, Dharmatala',
    pincode: 'Kolkata - 700013',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '7066643322'
  },
  {
    name: 'The Oberoi Grand',
    address: '15, Jawaharlal Nehru Rd, New Market Area, Dharmatala',
    pincode: 'Kolkata - 700013',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '1169110606'
  },
  {
    name: 'The Park Hotel',
    address: '17, Park St, Taltala',
    pincode: 'Kolkata - 700016',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3322499000'
  },
  {
    name: 'JW Marriott Hotel Kolkata',
    address: '4A, JBS Haldane Ave, Tangra',
    pincode: 'Kolkata - 700105',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3366330000'
  },
  {
    name: 'Taj Bengal',
    address: 'No. 34-B, Belvedere Road, Alipore',
    pincode: 'Kolkata - 700027',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3366123939'
  },
  {
    name: 'ITC Sonar',
    address: '1, JBS Haldane Ave, Tangra',
    pincode: 'Kolkata - 700105',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3323454545'
  },
  {
    name: 'Novotel Kolkata Hotel and Residences',
    address: 'Action Area 1C, Rajarhat, New Town',
    pincode: 'Kolkata - 700156',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3340323333'
  },
  {
    name: 'Broadway Hotel',
    address: '27A, Ganesh Chandra Ave, Bowbazar',
    pincode: 'Kolkata - 700013',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '9830478430'
  },
  {
    name: 'Hotel Lytton',
    address: '14 & 14/1, Sudder St, New Market Area, Dharmatala',
    pincode: 'Kolkata - 700016',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3322491875'
  },
  {
    name: 'The Astor Kolkata',
    address: '15, Shakespeare Sarani Rd, Kankaria Estates, Park Street area',
    pincode: 'Kolkata - 700071',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '3322829957'
  }
];

export const getKolkataHotelForPassport = (passportNumber: string | undefined): KolkataHotel => {
  const seed = passportNumber || 'hotel_default_seed';
  const hash = getDeterministicHash(seed);
  return KOLKATA_HOTELS[hash % KOLKATA_HOTELS.length];
};

export const DELHI_HOTELS: KolkataHotel[] = [
  {
    name: 'The Oberoi, New Delhi',
    address: 'Dr. Zakir Hussain Marg, Delhi Golf Club, Golf Links',
    pincode: 'Delhi - 110003',
    state: 'DELHI',
    district: 'NEW DELHI',
    phone: '+91 11 6911 0606'
  },
  {
    name: 'Taj Palace, New Delhi',
    address: '2, Sardar Patel Marg, Chanakyapuri',
    pincode: 'Delhi - 110021',
    state: 'DELHI',
    district: 'NEW DELHI',
    phone: '+91 11 2611 0202'
  },
  {
    name: 'The Lalit New Delhi',
    address: 'Fire Brigade Lane, Barakhamba',
    pincode: 'Delhi - 110001',
    state: 'DELHI',
    district: 'NEW DELHI',
    phone: '+91 11 4444 7777'
  },
  {
    name: 'Shangri-La Eros New Delhi',
    address: '19, Ashoka Road, Janpath, Connaught Place',
    pincode: 'Delhi - 110001',
    state: 'DELHI',
    district: 'NEW DELHI',
    phone: '+91 11 4119 1919'
  },
  {
    name: 'Le Méridien New Delhi',
    address: 'Windsor Place, Connaught Place',
    pincode: 'Delhi - 110001',
    state: 'DELHI',
    district: 'NEW DELHI',
    phone: '+91 11 4502 0200'
  },
  {
    name: 'The Leela Palace New Delhi',
    address: 'Africa Avenue, Diplomatic Enclave, Chanakyapuri',
    pincode: 'Delhi - 110023',
    state: 'DELHI',
    district: 'NEW DELHI',
    phone: '+91 11 3933 1234'
  }
];

export const getDelhiHotelForPassport = (passportNumber: string | undefined): KolkataHotel => {
  const seed = passportNumber || 'hotel_delhi_default_seed';
  const hash = getDeterministicHash(seed);
  return DELHI_HOTELS[hash % DELHI_HOTELS.length];
};

export const KOLKATA_BUSINESSES: KolkataHotel[] = [
  {
    name: 'M R Enterprise',
    address: '111, Kabiguru Sarani (A. G. Road)',
    pincode: 'Kolkata - 700038',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '+91 98308 18359'
  },
  {
    name: 'MS Mallika Enterprise',
    address: 'Anandanagar, Jhautala',
    pincode: 'Liluah - 711203',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '+91 87770 34708'
  },
  {
    name: 'R M International',
    address: '2/72, Near Uddyogi Club, Azadgarh, Tollygunge',
    pincode: 'Kolkata - 700040',
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    phone: '+91 82749 50443'
  }
];

export const getKolkataBusinessForPassport = (passportNumber: string | undefined): KolkataHotel => {
  const seed = passportNumber || 'business_default_seed';
  const hash = getDeterministicHash(seed);
  return KOLKATA_BUSINESSES[hash % KOLKATA_BUSINESSES.length];
};

export const generateDataText = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  
  const normalizedGender = normalizeGender(itemData.gender);

  let text = `=== PASSPORT DATA ===
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

  if (itemData.hotelName) {
    text += `
=== INDIAN REFERENCE ===
Reference Name in India: ${itemData.hotelName}
Address: ${itemData.hotelAddress || 'N/A'}
Address line 2 / Pincode: ${itemData.hotelPinCode || 'N/A'}
State: ${itemData.hotelState || 'N/A'}
District: ${itemData.hotelDistrict || 'N/A'}
Phone: ${itemData.hotelPhone || 'N/A'}
`;
  }

  return text;
};

export const formatIndianVisaAddress = (address: string): string => {
  if (!address) return '';
  let cleaned = address.trim();

  // Find a 6-digit number representing the pincode
  const pinMatch = cleaned.match(/\b\d{6}\b/);
  if (pinMatch) {
    const pincode = pinMatch[0];
    // Remove the pincode from its current position
    let baseAddress = cleaned.replace(pincode, '').trim();
    // Remove any trailing commas, dashes, and extra spaces
    baseAddress = baseAddress.replace(/,\s*-\s*$/, '').replace(/[\s,;\-]+$/, '').trim();

    // Determine the city if possible
    const isDelhi = /delhi/i.test(baseAddress);
    const isKolkata = /kolkata/i.test(baseAddress);

    if (isKolkata && !/kolkata\s*-\s*$/i.test(baseAddress)) {
      // Clean up existing trailing Kolkata to avoid duplicate
      baseAddress = baseAddress.replace(/(,\s*)?kolkata$/i, '').trim();
      baseAddress = baseAddress.replace(/[\s,;\-]+$/, '').trim();
      return `${baseAddress}, Kolkata - ${pincode}`;
    } else if (isDelhi && !/delhi\s*-\s*$/i.test(baseAddress)) {
      baseAddress = baseAddress.replace(/(,\s*)?delhi$/i, '').trim();
      baseAddress = baseAddress.replace(/[\s,;\-]+$/, '').trim();
      return `${baseAddress}, Delhi - ${pincode}`;
    } else {
      // Just append the pincode cleanly if no explicit city match or already ends with it
      return `${baseAddress} - ${pincode}`;
    }
  }

  return cleaned;
};

export const DISTRICT_POSTAL_CODES: Record<string, string> = {
  dhaka: '1200',
  kishoreganj: '2300',
  sylhet: '3100',
  chittagong: '4000',
  chattogram: '4000',
  gazipur: '1700',
  narayanganj: '1400',
  tangail: '1900',
  faridpur: '7800',
  manikganj: '1800',
  munshiganj: '1500',
  narsingdi: '1600',
  madaripur: '7900',
  gopalganj: '8100',
  rajbari: '7700',
  shariatpur: '8000',
  mymensingh: '2200',
  rajshahi: '6000',
  rangpur: '5400',
  khulna: '9100',
  barisal: '8200',
  barishal: '8200',
  bogra: '5800',
  bogura: '5800',
  jessore: '7400',
  jashore: '7400',
  comilla: '3500',
  cumilla: '3500',
  noakhali: '3800',
  feni: '3900',
  coxsbazar: '4700',
  cox: '4700',
  brahmanbaria: '3400',
  dinajpur: '5200',
  pabna: '6600',
  kushtia: '7000',
  sirajganj: '6700',
  jamalpur: '2000',
  netrokona: '2400',
  sherpur: '2100',
  naogaon: '6500',
  natore: '6400',
  joypurhat: '5900',
  chapainawabganj: '6300',
  gaibandha: '5700',
  kurigram: '5600',
  lalmonirhat: '5500',
  nilphamari: '5300',
  panchagarh: '5000',
  thakurgaon: '5100',
  bagerhat: '9300',
  chuadanga: '7200',
  jhenaidah: '7300',
  magura: '7600',
  meherpur: '7100',
  narail: '7500',
  satkhira: '9400',
  barguna: '8700',
  bhola: '8300',
  jhalokati: '8400',
  patuakhali: '8600',
  pirojpur: '8500',
  bandarban: '4600',
  khagrachhari: '4400',
  rangamati: '4500',
  habiganj: '3300',
  moulvibazar: '3200',
  sunamganj: '3000',
  chandpur: '3600',
  lakshmipur: '3700'
};

export const appendPostalCodeToAddress = (address: string | undefined): string => {
  if (!address) return '';
  let cleaned = address.trim();

  // If it already has a 4-digit postcode (e.g. Kishoreganj-2370 or Dhaka-1212)
  const hasPostcode = /\b\d{4}\b/.test(cleaned);
  if (hasPostcode) {
    return cleaned;
  }

  const words = cleaned.toLowerCase().split(/[\s,;-]+/);
  let detectedPostcode = '1000';
  let matchedDistrictKey = '';

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (DISTRICT_POSTAL_CODES[cleanWord]) {
      detectedPostcode = DISTRICT_POSTAL_CODES[cleanWord];
      matchedDistrictKey = cleanWord;
      break;
    }
  }

  if (matchedDistrictKey) {
    const regex = new RegExp(`\\b(${matchedDistrictKey})\\b`, 'i');
    const match = cleaned.match(regex);
    if (match) {
      const index = cleaned.toLowerCase().lastIndexOf(matchedDistrictKey);
      if (index !== -1) {
        const originalCaseDistrict = cleaned.substring(index, index + matchedDistrictKey.length);
        cleaned = cleaned.substring(0, index) + `${originalCaseDistrict}-${detectedPostcode}` + cleaned.substring(index + matchedDistrictKey.length);
        return cleaned;
      }
    }
  }

  if (!matchedDistrictKey) {
    let hash = 0;
    for (let i = 0; i < cleaned.length; i++) {
      hash = cleaned.charCodeAt(i) + ((hash << 5) - hash);
    }
    const fallbackCodes = ['1200', '2300', '3100', '4000', '1700', '1400', '1900', '7800', '2200', '6000', '5400', '9100', '8200'];
    const fallbackCode = fallbackCodes[Math.abs(hash) % fallbackCodes.length];
    if (cleaned.endsWith(',')) {
      cleaned = cleaned.substring(0, cleaned.length - 1).trim();
    }
    cleaned = `${cleaned}-${fallbackCode}`;
  }

  return cleaned;
};
