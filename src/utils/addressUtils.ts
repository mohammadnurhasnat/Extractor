import { PassportData } from '../types';

const REAL_DISTRICTS: Record<string, {
  name: string;
  defaultPostcode: string;
  thanas: {
    name: string;
    postcode: string;
    areas: string[];
    roads: string[];
    villages: string[];
  }[];
}> = {
  DHAKA: {
    name: "Dhaka",
    defaultPostcode: "1200",
    thanas: [
      {
        name: "Gulshan",
        postcode: "1212",
        areas: ["Gulshan-1", "Gulshan-2", "Badda"],
        roads: ["Madani Avenue", "Gulshan Avenue", "Road 12", "Road 23", "Road 79"],
        villages: ["Gulshan", "Shahjadpur", "Badda"]
      },
      {
        name: "Banani",
        postcode: "1213",
        areas: ["Banani", "Chairman Bari", "Kakoli"],
        roads: ["Kemal Ataturk Avenue", "Road 11", "Road 4", "Road 8", "Road 18"],
        villages: ["Banani", "Amtoli"]
      },
      {
        name: "Dhanmondi",
        postcode: "1209",
        areas: ["Dhanmondi R/A", "Lalmatia", "Sobhanbagh"],
        roads: ["Mirpur Road", "Satmasjid Road", "Road 2/A", "Road 8/A", "Road 27"],
        villages: ["Dhanmondi", "Lalmatia"]
      },
      {
        name: "Mirpur",
        postcode: "1216",
        areas: ["Mirpur-1", "Mirpur-10", "Mirpur-12", "Pallabi"],
        roads: ["Begum Rokeya Sarani", "Zoo Road", "Main Road", "Road 6", "Road 3"],
        villages: ["Mirpur", "Kallayanpur", "Pallabi"]
      },
      {
        name: "Uttara",
        postcode: "1230",
        areas: ["Sector 1", "Sector 3", "Sector 4", "Sector 11", "Sector 13"],
        roads: ["Jashimuddin Avenue", "Garib-e-Newaj Avenue", "Road 6", "Road 12", "Road 18"],
        villages: ["Uttara", "Abdullahpur"]
      },
      {
        name: "Savar",
        postcode: "1340",
        areas: ["Savar Bazaar", "Hemayetpur", "Ashulia"],
        roads: ["Dhaka-Aricha Highway", "Savar College Road", "Radio Colony Road"],
        villages: ["Bank Town", "Rejupur", "Nidhin"]
      }
    ]
  },
  GOPALGANJ: {
    name: "Gopalganj",
    defaultPostcode: "8100",
    thanas: [
      {
        name: "Gopalganj Sadar",
        postcode: "8100",
        areas: ["Mandartala", "Ghatakchar", "Bedgram"],
        roads: ["Sadar Road", "Hospital Road", "Court Road", "College Road"],
        villages: ["Mandartala", "Bedgram", "Suktail Uttarpara", "Gopinathpur"]
      },
      {
        name: "Tungipara",
        postcode: "8120",
        areas: ["Patgati", "Tungipara Bazaar", "Gimadanga"],
        roads: ["Tungipara Main Road", "Patgati Bypass", "Shorifpara Road"],
        villages: ["Gimadanga", "Patgati", "Karchalia", "Tungipara"]
      },
      {
        name: "Kotalipara",
        postcode: "8110",
        areas: ["Pinjuri", "Ramsheel", "Sikarpur"],
        roads: ["Kotalipara-Gopalganj Road", "Bazaar Road"],
        villages: ["Pinjuri", "Sukhail", "Ramshil", "Chitra"]
      },
      {
        name: "Muksudpur",
        postcode: "8130",
        areas: ["Majhigati", "Nanikhial", "Tekerhat"],
        roads: ["Muksudpur-Tekerhat Highway", "Muksudpur Station Road"],
        villages: ["Majhigati", "Nanikhiar", "Raghurampur", "Bonogram"]
      },
      {
        name: "Kashiani",
        postcode: "8140",
        areas: ["Kashiani Sadar", "Bhatiapara", "Fukra"],
        roads: ["Bhatiapara Bypass", "Kashiani Station Road"],
        villages: ["Kashiani", "Bhatiapara", "Fukra", "Ramdia"]
      }
    ]
  },
  MUNSHIGANJ: {
    name: "Munshiganj",
    defaultPostcode: "1500",
    thanas: [
      {
        name: "Sreenagar",
        postcode: "1550",
        areas: ["Sreenagar Bazaar", "Bhagyakul", "Kukutia"],
        roads: ["Sreenagar Main Road", "Bhagyakul Bazar Road"],
        villages: ["Harpara", "Kukutia", "Baghra", "Bhagyakul"]
      },
      {
        name: "Louhajang",
        postcode: "1530",
        areas: ["Medinimandal", "Louhajang Sadar", "Maowa"],
        roads: ["Louhajang Highway", "Maowa Ferry Ghat Road"],
        villages: ["Medinimandal", "Kaltia", "Gandharbapur"]
      },
      {
        name: "Sirajdikhan",
        postcode: "1540",
        areas: ["Balushur", "Sirajdikhan Bazaar", "Roshunia"],
        roads: ["Sirajdikhan Road", "Balushur Bazar Road"],
        villages: ["Balushur", "Chhationtal", "Rushidia"]
      }
    ]
  },
  BARGUNA: {
    name: "Barguna",
    defaultPostcode: "8700",
    thanas: [
      {
        name: "Barguna Sadar",
        postcode: "8700",
        areas: ["Barguna Town", "Krok", "Adatola"],
        roads: ["Sadar Road", "Launch Ghat Road", "Bazaar Road", "Zilla Council Road"],
        villages: ["Phuljhuri", "Krok", "Baraikhali", "Gozkhali"]
      },
      {
        name: "Amtali",
        postcode: "8710",
        areas: ["Amtali Town", "Chowra", "Kukuya"],
        roads: ["Amtali-Patuakhali Highway", "Bazaar Main Road"],
        villages: ["Amtali", "Chowra", "Kukuya", "Gazipur"]
      },
      {
        name: "Patharghata",
        postcode: "8720",
        areas: ["Patharghata Town", "Kakchira", "Chhania"],
        roads: ["Patharghata Bypass Road", "Launch Terminal Road"],
        villages: ["Patharghata", "Kakchira", "Chhania"]
      }
    ]
  },
  GAZIPUR: {
    name: "Gazipur",
    defaultPostcode: "1700",
    thanas: [
      {
        name: "Gazipur Sadar",
        postcode: "1700",
        areas: ["Chowrasta", "Board Bazar", "Joydebpur"],
        roads: ["Dhaka-Mymensingh Highway", "Joydebpur Road", "College Road"],
        villages: ["Vogra", "Harinachala", "Chondra"]
      },
      {
        name: "Tongi",
        postcode: "1710",
        areas: ["Tongi Bazaar", "Cherag Ali", "Station Road"],
        roads: ["Tongi-Savar Road", "Tongi Station Road", "Anarkali Road"],
        villages: ["Tongi", "Cherag Ali", "Auchpara"]
      },
      {
        name: "Sreepur",
        postcode: "1740",
        areas: ["Mawna", "Barmi", "Teliati"],
        roads: ["Mawna Chowrasta Road", "Sreepur Highway"],
        villages: ["Mawna", "Barmi", "Teliati"]
      }
    ]
  }
};

const getMatchedDistrict = (distName: string): typeof REAL_DISTRICTS[keyof typeof REAL_DISTRICTS] => {
  const norm = (distName || '').trim().toUpperCase().replace(/(DISTRICT|ZILLA|ZILLA\s+OF)/gi, '').trim();
  if (norm.includes("DHAKA") || norm.includes("METRO")) return REAL_DISTRICTS.DHAKA;
  if (norm.includes("GOPALGANJ") || norm.includes("GOPAL")) return REAL_DISTRICTS.GOPALGANJ;
  if (norm.includes("MUNSHIGANJ") || norm.includes("MUNSHI")) return REAL_DISTRICTS.MUNSHIGANJ;
  if (norm.includes("BARGUNA") || norm.includes("BARG")) return REAL_DISTRICTS.BARGUNA;
  if (norm.includes("GAZIPUR") || norm.includes("GAZI")) return REAL_DISTRICTS.GAZIPUR;
  
  // Fallback to a deterministic real district if an invalid/artificial district like "Ghutabasa" is entered
  const keys = Object.keys(REAL_DISTRICTS);
  const pickedKey = keys[norm.length % keys.length];
  return REAL_DISTRICTS[pickedKey];
};

export const generateBangladeshiAddress = (
  districtName: string, 
  seedString: string, 
  type: 'present' | 'office' | 'business' | 'local'
): string => {
  const matchedDistrict = getMatchedDistrict(districtName);
  const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + type.length;
  
  const thanaObj = matchedDistrict.thanas[seed % matchedDistrict.thanas.length];
  const houseNum = ((seed % 95) + 1).toString();
  const plotNum = ((seed % 140) + 12).toString();
  const roadName = thanaObj.roads[(seed + 1) % thanaObj.roads.length];
  
  // Convert "Dhanmondi R/A" or other variables to simplified readable names
  let areaName = thanaObj.areas[(seed + 2) % thanaObj.areas.length];
  if (areaName === "Dhanmondi R/A") areaName = "Dhanmondi";
  const villageName = thanaObj.villages[(seed + 3) % thanaObj.villages.length];
  
  const isUrban = matchedDistrict.name === 'Dhaka' || matchedDistrict.name === 'Gazipur';
  
  if (type === 'present' || type === 'local') {
    if (isUrban) {
      if (seed % 2 === 0) {
        return `House ${houseNum}, ${roadName}, ${areaName}, ${matchedDistrict.name}-${thanaObj.postcode}`;
      } else {
        // Hyphen pattern like House-22, Kolwalapara, Mirpur, Dhaka-1216
        const subArea = seed % 3 === 0 ? 'Kolwalapara, ' : '';
        return `House-${houseNum}, ${subArea}${areaName}, ${matchedDistrict.name}-${thanaObj.postcode}`;
      }
    } else {
      // Must have Holding in non-Dhaka districts
      return `Holding-${houseNum}, ${villageName}, ${thanaObj.name}, ${matchedDistrict.name}-${thanaObj.postcode}`;
    }
  } else {
    // Office/Business
    const level = ((seed % 8) + 1).toString();
    if (isUrban) {
      if (seed % 2 === 0) {
        return `Level ${level}, Plot ${plotNum}, ${roadName}, ${areaName}, ${matchedDistrict.name}-${thanaObj.postcode}`;
      } else {
        return `Level ${level}, House ${houseNum}, ${roadName}, ${areaName}, ${matchedDistrict.name}-${thanaObj.postcode}`;
      }
    } else {
      return `Level ${level}, Holding-${houseNum}, ${roadName}, ${thanaObj.name}, ${matchedDistrict.name}-${thanaObj.postcode}`;
    }
  }
};

export const getPresentAddress = (itemData: PassportData | null): string => {
  if (!itemData) return "House 12, Road 5, Dhanmondi, Dhaka-1205";
  
  if (itemData.presentAddress && itemData.presentAddress !== itemData.permanentAddress) {
    const commaCount = (itemData.presentAddress.match(/,/g) || []).length;
    if (commaCount >= 2) {
      return itemData.presentAddress;
    }
  }

  const permanentAddr = getPermanentAddress(itemData);
  const district = getDistrictFromAddress(permanentAddr, itemData);
  
  // Rule 1: If permanent address is Dhaka district, present address is same as permanent
  if (district.toUpperCase() === 'DHAKA') {
    return permanentAddr;
  }

  // Rules 2 & 3: If permanent address is not Dhaka district, present address is random Dhaka address
  return generateBangladeshiAddress("Dhaka", itemData.passportNumber || itemData.givenName || 'present', 'present');
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

export const getBusinessAddressDhaka = (presentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.businessAddressDhaka) return itemData.businessAddressDhaka;
  const seedStr = presentAddress + (itemData?.passportNumber || itemData?.givenName || 'seeder');
  return generateBangladeshiAddress("Dhaka", seedStr, 'business');
};

export const getOfficeAddressDhaka = (presentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.officeAddressDhaka) return itemData.officeAddressDhaka;
  const seedStr = presentAddress + (itemData?.passportNumber || itemData?.givenName || 'seeder');
  return generateBangladeshiAddress("Dhaka", seedStr, 'office');
};

const thanaSadarFormat = (name: string): string => {
  if (name.toLowerCase().includes("sadar") || name.toLowerCase().includes("gulshan") || name.toLowerCase().includes("banani") || name.toLowerCase().includes("dhanmondi") || name.toLowerCase().includes("mirpur") || name.toLowerCase().includes("uttara") || name.toLowerCase().includes("savar") || name.toLowerCase().includes("tongi")) return name;
  return `${name} Upazila`;
};

export const getThanaSadarAddress = (permanentAddress: string | undefined | null, seed: number): string => {
  const dist = permanentAddress ? getDistrictFromAddress(permanentAddress) : 'Gopalganj';
  const matchedDistrict = getMatchedDistrict(dist);
  
  const thanaObj = matchedDistrict.thanas[seed % matchedDistrict.thanas.length];
  const road = thanaObj.roads[(seed + 1) % thanaObj.roads.length];
  const houseNum = ((seed % 95) + 1).toString();
  
  const isUrban = matchedDistrict.name === 'Dhaka' || matchedDistrict.name === 'Gazipur';
  if (isUrban) {
    return `House ${houseNum}, ${road}, ${thanaSadarFormat(thanaObj.name)}, ${matchedDistrict.name}-${thanaObj.postcode}`;
  } else {
    return `Holding-${houseNum}, ${road}, ${thanaSadarFormat(thanaObj.name)}, ${matchedDistrict.name}-${thanaObj.postcode}`;
  }
};

export const getBusinessAddressLocal = (permanentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.businessAddressLocal) return itemData.businessAddressLocal;
  if (!permanentAddress) {
    return "Holding-12, College Road, Gopalganj Sadar, Gopalganj-8100";
  }
  const seed = (itemData?.passportNumber || itemData?.givenName || 'seeder_local')
    .split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return getThanaSadarAddress(permanentAddress, seed);
};

export const getOfficeAddressLocal = (permanentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.officeAddressLocal) return itemData.officeAddressLocal;
  if (!permanentAddress) {
    return "Holding-24, College Road, Gopalganj Sadar, Gopalganj-8100";
  }
  const seed = (itemData?.passportNumber || itemData?.givenName || 'seeder_office_local')
    .split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + 17;
  return getThanaSadarAddress(permanentAddress, seed);
};

export const generatePermanentAddressForDistrict = (district: string, seedString: string): string => {
  const matchedDistrict = getMatchedDistrict(district);
  const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const thanaObj = matchedDistrict.thanas[seed % matchedDistrict.thanas.length];
  const villageName = thanaObj.villages[(seed + 3) % thanaObj.villages.length];
  const houseNum = ((seed % 95) + 1).toString();
  
  const isUrban = matchedDistrict.name === 'Dhaka' || matchedDistrict.name === 'Gazipur';
  if (isUrban) {
    const road = thanaObj.roads[(seed + 1) % thanaObj.roads.length];
    return `House-${houseNum}, ${road}, ${thanaObj.name} - ${thanaObj.postcode}, ${matchedDistrict.name.toUpperCase()}`;
  } else {
    return `Holding-${houseNum}, ${villageName}, ${thanaObj.name} - ${thanaObj.postcode}, ${matchedDistrict.name.toUpperCase()}`;
  }
};

export const getPermanentAddress = (itemData: PassportData | null): string => {
  if (!itemData) return "Holding-12, HARPARA, SREENAGAR, SREENAGAR - 1550, MUNSHIGANJ";
  
  if (itemData.permanentAddress) {
    const commaCount = (itemData.permanentAddress.match(/,/g) || []).length;
    if (commaCount >= 2) {
      return itemData.permanentAddress;
    }
    // If it has permanentAddress but not in a clean 3+ part format, reformat it
    const dist = getDistrictFromAddress(itemData.permanentAddress, itemData) || "Munshiganj";
    return generatePermanentAddressForDistrict(dist, itemData.passportNumber || itemData.givenName || 'seeder_perm');
  }

  const dist = itemData.birthPlaceDistrict || itemData.birthPlace || "Munshiganj";
  return generatePermanentAddressForDistrict(dist, itemData.passportNumber || itemData.givenName || 'seeder_perm');
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
  
  const presentAddr = getPresentAddress(itemData);
  const permanentAddr = getPermanentAddress(itemData);
  const dhakaBizAddr = getBusinessAddressDhaka(presentAddr, itemData);
  const officeAddr = getOfficeAddressDhaka(presentAddr, itemData);
  const localBizAddr = getBusinessAddressLocal(permanentAddr, itemData);
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

=== ADDRESS ===
PRESENT ADDRESS: ${presentAddr}
PERMANENT ADDRESS: ${permanentAddr}

=== ADDITIONAL INFORMATION ===
Father's Name: ${itemData.fatherName}
Mother's Name: ${itemData.motherName}
Spouse's Name: ${itemData.spouseName || "N/A"}
Mobile Number: ${itemData.mobileNumber ? itemData.mobileNumber.replace(/^\+88\s*/, '') : ''}
Town/City of birth/BIRTH PLACE: ${getDistrictFromAddress(permanentAddr, itemData)}

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
