import { PassportData } from '../types';

export const getPresentAddress = (itemData: PassportData | null): string => {
  if (!itemData) return "House 12, Road 5, Dhanmondi, Dhaka-1209";
  if (itemData.presentAddress) return itemData.presentAddress;

  const permLower = (itemData.permanentAddress || "").toLowerCase();
  const presLower = (itemData.presentAddress || "").toLowerCase();
  const emergLower = (itemData.emergencyContactAddress || "").toLowerCase();

  const isDhaka = (addr: string) => 
    addr.includes("dhaka") || 
    addr.includes("savar") || 
    addr.includes("keraniganj") || 
    addr.includes("dohar") || 
    addr.includes("nawabganj") || 
    addr.includes("dhamrai");

  if (itemData.presentAddress && isDhaka(presLower)) return itemData.presentAddress;
  if (itemData.emergencyContactAddress && isDhaka(emergLower)) return itemData.emergencyContactAddress;
  if (itemData.permanentAddress && isDhaka(permLower)) return itemData.permanentAddress;

  const dhakaAddresses = [
    "House 45, Road 12, Sector 10, Uttara, Dhaka-1230",
    "House 12, Road 5, Dhanmondi, Dhaka-1209",
    "House 28, Road 2, Block C, Mirpur-2, Dhaka-1216",
    "House 8, Road 14, Gulshan-1, Dhaka-1212",
    "House 33, Road 7, Block F, Banani, Dhaka-1213"
  ];
  const hashStr = itemData.permanentAddress || "fallback_dhaka";
  const hash = hashStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return dhakaAddresses[hash % dhakaAddresses.length];
};

export const getDistrictFromAddress = (address: string | undefined | null, itemData?: PassportData | null): string => {
  if (itemData && itemData.birthPlaceDistrict) return itemData.birthPlaceDistrict;
  if (!address) return '';
  const parts = address.split(/[,\-]/).map(s => s.trim()).filter(Boolean);
  const textParts = parts.filter(p => !/^\d+$/.test(p));
  if (textParts.length > 0) {
    return textParts[textParts.length - 1].replace(/(district|zilla)/i, '').trim().toUpperCase();
  }
  return '';
};

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
  
  const suffixes = isJob 
    ? ['Enterprise', 'Traders', 'Corporation', 'Agency', 'Trading', 'Group'] 
    : ['Enterprise', 'Traders', 'Telecom', 'Motors', 'Fabrics', 'Electronics'];
  const suffix = suffixes[name.length % suffixes.length];
  
  const prefixes = ['MS ', '', ''];
  const prefix = prefixes[name.length % prefixes.length];
  
  return `${prefix}${capitalizedName} ${suffix}`.trim();
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

export const getBusinessAddressDhaka = (presentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.businessAddressDhaka) return itemData.businessAddressDhaka;
  const presentLower = presentAddress.toLowerCase();
  const seed = presentAddress.length + (presentAddress.charCodeAt(0) || 0);
  const shopNum = (seed % 150) + 1;
  
  const areas = [
    { key: "uttara", match: "Uttara", zip: "1230" },
    { key: "dhanmondi", match: "Dhanmondi", zip: "1209" },
    { key: "mirpur", match: "Mirpur", zip: "1216" },
    { key: "gulshan", match: "Gulshan", zip: "1212" },
    { key: "banani", match: "Banani", zip: "1213" },
    { key: "bashundhara", match: "Bashundhara", zip: "1229" },
    { key: "mohammadpur", match: "Mohammadpur", zip: "1207" },
    { key: "motijheel", match: "Motijheel", zip: "1000" },
    { key: "badda", match: "Badda", zip: "1212" },
    { key: "ramna", match: "Ramna", zip: "1000" }
  ];

  const matchedArea = areas.find(a => presentLower.includes(a.key));
  const getFormat = seed % 3;
  
  if (matchedArea) {
    if (getFormat === 0) {
      return `Shop ${shopNum}, ${matchedArea.match}, Dhaka-${matchedArea.zip}`;
    } else if (getFormat === 1) {
      return `Plot ${shopNum + 10}, ${matchedArea.match}, Dhaka-${matchedArea.zip}`;
    } else {
      return `House ${shopNum}, Rd ${(seed % 12) + 1}, ${matchedArea.match}, Dhaka`;
    }
  }
  
  const districtMatch = presentAddress.split(',').slice(-1)[0]?.trim() || "Dhaka";
  
  if (getFormat === 0) {
    return `Shop ${shopNum}, City Center, ${districtMatch}`;
  } else if (getFormat === 1) {
    return `Holding No. ${shopNum * 2}, ${districtMatch}`;
  } else {
    return `House ${shopNum}, Main Road, ${districtMatch}`;
  }
};

export const getOfficeAddressDhaka = (presentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.officeAddressDhaka) return itemData.officeAddressDhaka;
  const presentLower = presentAddress.toLowerCase();
  const seed = presentAddress.length + (presentAddress.charCodeAt(1) || 0) + 5; 
  const suiteNum = (seed % 500) + 100;
  const floorNum = Math.floor(suiteNum / 100);

  const towers = ["Navana Tower", "City Center", "Trade Center", "ABC Tower", "Rupayan Tower"];
  const randomTower = towers[seed % towers.length];

  const areas = [
    { key: "uttara", match: "Uttara", zip: "1230", tower: "Zamzam Tower" },
    { key: "dhanmondi", match: "Dhanmondi", zip: "1209", tower: "Rapa Plaza" },
    { key: "mirpur", match: "Mirpur", zip: "1216", tower: "Shah Ali Plaza" },
    { key: "gulshan", match: "Gulshan", zip: "1212", tower: "Shoppers World" },
    { key: "banani", match: "Banani", zip: "1213", tower: "Awal Centre" },
    { key: "bashundhara", match: "Bashundhara", zip: "1229", tower: "GP Center" },
    { key: "mohammadpur", match: "Mohammadpur", zip: "1207", tower: "Tokyo Square" },
    { key: "motijheel", match: "Motijheel", zip: "1000", tower: "City Centre" },
    { key: "badda", match: "Badda", zip: "1212", tower: "Hossain Tower" },
    { key: "ramna", match: "Ramna", zip: "1000", tower: "Baily Tower" }
  ];

  const matchedArea = areas.find(a => presentLower.includes(a.key));
  const getFormat = seed % 3;

  if (matchedArea) {
    const towerName = matchedArea.tower || randomTower;
    if (getFormat === 0) {
      return `${towerName}, ${matchedArea.match}, Dhaka`;
    } else if (getFormat === 1) {
      return `Level ${floorNum}, ${towerName}, ${matchedArea.match}, Dhaka`;
    } else {
      return `Office ${suiteNum}, ${towerName}, ${matchedArea.match}, Dhaka`;
    }
  }
  
  const districtMatch = presentAddress.split(',').slice(-1)[0]?.trim() || "Dhaka";
  
  if (getFormat === 0) {
    return `${randomTower}, ${districtMatch}`;
  } else if (getFormat === 1) {
    return `Office ${suiteNum}, ${randomTower}, ${districtMatch}`;
  } else {
    return `Holding ${suiteNum}, ${randomTower}, ${districtMatch}`;
  }
};

export const getBusinessAddressLocal = (permanentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.businessAddressLocal) return itemData.businessAddressLocal;
  if (!permanentAddress) return '';
  const district = getDistrictFromAddress(permanentAddress);
  if (!district) return permanentAddress;
  
  const properDistrict = district.charAt(0).toUpperCase() + district.slice(1).toLowerCase();
  const seed = permanentAddress.length + (permanentAddress.charCodeAt(0) || 0);
  const shopNum = (seed % 100) + 1;
  
  const markets = ["Bazar", "Super Market", "Municipal Market", "Trade Center", "Chowrasta"];
  const randomMarket = markets[seed % markets.length];
  
  const getFormat = seed % 3;
  
  if (getFormat === 0) {
    return `Shop ${shopNum}, ${properDistrict} ${randomMarket}`;
  } else if (getFormat === 1) {
    return `Holding No. ${shopNum + 10}, ${properDistrict} Sadar`;
  } else {
    return `Plot ${shopNum}, ${properDistrict} ${randomMarket}`;
  }
};

export const generateDataText = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  
  const presentAddr = getPresentAddress(itemData);
  const dhakaBizAddr = getBusinessAddressDhaka(presentAddr, itemData);
  const officeAddr = getOfficeAddressDhaka(presentAddr, itemData);
  const localBizAddr = getBusinessAddressLocal(itemData.permanentAddress, itemData);

  return `=== PASSPORT DATA ===
EMAIL: ${getGeneratedEmail(itemData)}
DOB: ${itemData.dob}
Surname: ${itemData.surname}
Given Name: ${itemData.givenName}
Town/City of birth/BIRTH PLACE: ${itemData.birthPlace}
National Id No/BIRTH CERTIFICATE NO: ${itemData.nidOrBirthCertNumber}
Gender: ${itemData.gender}
Blood Group: Unknown
Date of Issue: ${itemData.issueDate}
Date of Expiry: ${itemData.expiryDate}
Place of Issue: ${itemData.placeOfIssue || "DHAKA"}

=== ADDRESS ===
PRESENT ADDRESS: ${presentAddr}
PERMANENT ADDRESS: ${itemData.permanentAddress}

=== ADDITIONAL INFORMATION ===
Father's Name: ${itemData.fatherName}
Mother's Name: ${itemData.motherName}
Spouse's Name: ${itemData.spouseName || "N/A"}
Mobile Number: ${itemData.mobileNumber ? itemData.mobileNumber.replace(/^\+88\s*/, '') : ''}
Town/City of birth/BIRTH PLACE: ${getDistrictFromAddress(itemData.permanentAddress, itemData)}

=== BUSINESS DETAILS (PROPRIETORSHIP) ===
Business Name: ${getProprietorBusinessName(itemData)}
Role: Proprietor
Business Address (Present): ${dhakaBizAddr}
Business Address (Permanent): ${localBizAddr}

=== PRIVATE SERVICE / JOB ===
Company Name: ${getJobCompanyName(itemData)}
Role: ${getJobRole(itemData)}
Office Address (Present): ${officeAddr}
Office Address (Permanent): ${localBizAddr}
`;
};
