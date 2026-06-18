import { PassportData } from '../types';

export const generateBangladeshiAddress = (
  districtName: string, 
  seedString: string, 
  type: 'present' | 'office' | 'business' | 'local'
): string => {
  const normDistrict = (districtName || 'Dhaka')
    .trim()
    .replace(/(district|zilla|zilla\s+of)/i, '')
    .trim();
  const districtUpper = normDistrict.toUpperCase() || 'DHAKA';
  const districtProper = districtUpper.charAt(0).toUpperCase() + districtUpper.slice(1).toLowerCase();

  const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + type.length;

  // Pools of realistic address component names to construct deterministic varieties (seed-based)
  const bananis = ["Banani", "Gulshan", "Mohakhali", "Baridhara", "Dhanmondi"];
  const dhanmondis = ["Dhanmondi", "Lalmatia", "Tejgaon", "Green Road", "Kalabagan"];
  const mirpurs = ["Mirpur", "Kallayanpur", "Gabtoli", "Adabor", "Pallabi"];
  
  const houseNums = ["14", "25", "12", "8", "90", "5", "102", "33", "88", "42"];
  const roadNums = ["6", "12", "9", "4", "15/A", "22", "8", "10", "3", "7"];
  const blocks = ["C", "A", "B", "D", "E", "F"];
  const flats = ["3B", "4A", "2C", "5D", "1A", "3C", "11B", "8F"];
  const plots = ["45/2", "12/A", "28/1", "33", "88/B", "41/2", "9/3", "4/2"];
  const roadNames = ["Mirpur Road", "Station Road", "College Road", "Airport Road", "Kandirpar Road", "Main Road"];
  const areas = ["Banani", "Dhanmondi", "Mirpur", "Gulshan", "Uttara", "Kandirpar", "Agrabad", "Zindabazar"];
  const levels = ["4", "7", "2", "9", "1", "5", "8"];
  const dohsNames = ["Mirpur", "Mohakhali", "Baridhara", "Banani"];

  const getPostCode = (areaName: string): string => {
    const areaLower = areaName.toLowerCase();
    if (areaLower.includes("banani")) return "1213";
    if (areaLower.includes("dhanmondi")) return "1209";
    if (areaLower.includes("mirpur")) return "1216";
    if (areaLower.includes("gulshan")) return "1212";
    if (areaLower.includes("uttara")) return "1230";
    if (areaLower.includes("savar")) return "1340";
    if (areaLower.includes("tongi")) return "1710";
    if (areaLower.includes("rangpur")) return "5400";
    if (areaLower.includes("gopalganj")) return "8100";
    if (areaLower.includes("comilla") || areaLower.includes("cumilla")) return "3500";
    
    // Fallbacks
    if (districtUpper === "DHAKA") return "1212";
    if (districtUpper === "GOPALGANJ") return "8100";
    if (districtUpper === "RANGPUR") return "5400";
    if (districtUpper === "GAZIPUR") return "1710";
    if (districtUpper === "COMILLA" || districtUpper === "CUMILLA") return "3500";
    if (districtUpper === "BARISAL" || districtUpper === "BARISHAL") return "8200";
    if (districtUpper === "KHULNA") return "9100";
    if (districtUpper === "RAJSHAHI") return "6000";
    return "1000";
  };

  const isGopalganj = districtUpper.includes("GOPALGANJ");

  if (type === 'present' || type === 'local') {
    // 5 House/Village Address Formats
    let formatIndex = seed % 5;
    
    // For Gopalganj, strictly cycle rural village address forms to respect the spec
    if (isGopalganj) {
      formatIndex = (seed % 2 === 0) ? 3 : 4;
    }

    if (formatIndex === 0) {
      // Form 1: House 14, Road 6, Block C, Banani, Dhaka-1213
      // OR Form 1b: House 45, Road 12, Sector 10, Uttara, Dhaka-1230
      const h = houseNums[seed % houseNums.length];
      const r = roadNums[(seed + 1) % roadNums.length];
      if (seed % 2 === 0) {
        const sec = (seed % 14) + 1;
        const pc = "1230"; // Uttara postcode
        return `House ${h}, Road ${r}, Sector ${sec}, Uttara, ${districtProper}-${pc}`;
      } else {
        const b = blocks[(seed + 2) % blocks.length];
        const a = bananis[(seed + 3) % bananis.length];
        const pc = getPostCode(a);
        return `House ${h}, Road ${r}, Block ${b}, ${a}, ${districtProper}-${pc}`;
      }
      
    } else if (formatIndex === 1) {
      // Form 2: 3B, 45/2 Mirpur Road, Dhanmondi, Dhaka-1209
      const fl = flats[seed % flats.length];
      const pl = plots[(seed + 1) % plots.length];
      const rn = "Mirpur Road";
      const a = dhanmondis[(seed + 2) % dhanmondis.length];
      const pc = getPostCode(a);
      return `${fl}, ${pl} ${rn}, ${a}, ${districtProper}-${pc}`;
      
    } else if (formatIndex === 2) {
      // Form 3: 28 Station Road, Rangpur Sadar, Rangpur-5400
      const pl = plots[seed % plots.length].split('/')[0] || "28"; 
      const rn = "Station Road";
      const pc = getPostCode(districtProper);
      return `${pl} ${rn}, ${districtProper} Sadar, ${districtProper}-${pc}`;
      
    } else if (formatIndex === 3) {
      // Form 4: Majhigati, Majhigati-8131, Muksudpur, Gopalganj
      return `Majhigati, Majhigati-8131, Muksudpur, ${districtProper}`;
      
    } else {
      // Form 5: Maligram, Bonogram-8151, Muksudpur, Gopalganj
      return `Maligram, Bonogram-8151, Muksudpur, ${districtProper}`;
    }
  } else {
    // 5 Office/Business Address Formats
    const formatIndex = seed % 5;

    if (formatIndex === 0) {
      // Form 1: House 25, Road 12, Banani, Dhaka-1213
      const h = houseNums[seed % houseNums.length];
      const r = roadNums[(seed + 1) % roadNums.length];
      const a = bananis[(seed + 2) % bananis.length];
      const pc = getPostCode(a);
      return `House ${h}, Road ${r}, ${a}, ${districtProper}-${pc}`;
      
    } else if (formatIndex === 1) {
      // Form 2: Level 4, Mirpur DOHS, Mirpur, Dhaka-1216
      const lvl = levels[seed % levels.length];
      const dohs = dohsNames[(seed + 1) % dohsNames.length];
      const a = "Mirpur";
      const pc = getPostCode(a);
      return `Level ${lvl}, ${dohs} DOHS, ${a}, ${districtProper}-${pc}`;
      
    } else if (formatIndex === 2) {
      // Form 3: Holding 15, Ward 5, Savar Upazila, Dhaka-1340
      const hp = (seed % 90) + 10;
      const wd = (seed % 12) + 1;
      const dist = (districtProper.toUpperCase() === 'DHAKA' || districtProper.toUpperCase() === 'GOPALGANJ') ? 'Dhaka' : districtProper;
      const pc = getPostCode('savar');
      return `Holding ${hp}, Ward ${wd}, Savar Upazila, ${dist}-${pc}`;
      
    } else if (formatIndex === 3) {
      // Form 4: Main Market Road, Tongi Upazila, Gazipur-1710
      const mr = "Main Market Road";
      const dist = (districtProper.toUpperCase() === 'DHAKA' || districtProper.toUpperCase() === 'GOPALGANJ') ? 'Gazipur' : districtProper;
      const pc = getPostCode("tongi");
      return `${mr}, Tongi Upazila, ${dist}-${pc}`;
      
    } else {
      // Form 5: College Road, Sadar South Upazila, Comilla-3500
      const cr = "College Road";
      const dist = (districtProper.toUpperCase() === 'DHAKA' || districtProper.toUpperCase() === 'GOPALGANJ') ? 'Comilla' : districtProper;
      const pc = getPostCode("comilla");
      return `${cr}, Sadar South Upazila, ${dist}-${pc}`;
    }
  }
};

export const getPresentAddress = (itemData: PassportData | null): string => {
  if (!itemData) return "House 12, Road 5, Dhanmondi Post Office, Dhanmondi Thana, Dhaka";
  
  // Check if presentAddress already matches are strict 5-part format (having 4 or more commas)
  if (itemData.presentAddress) {
    const commaCount = (itemData.presentAddress.match(/,/g) || []).length;
    if (commaCount >= 4) {
      return itemData.presentAddress;
    }
    // If it has presentAddress but not in strict format, augment/reformat it
    const dist = getDistrictFromAddress(itemData.presentAddress, itemData) || "Dhaka";
    return generateBangladeshiAddress(dist, itemData.passportNumber || itemData.givenName, 'present');
  }

  const permLower = (itemData.permanentAddress || "").toLowerCase();
  const emergLower = (itemData.emergencyContactAddress || "").toLowerCase();

  const isDhaka = (addr: string) => 
    addr.includes("dhaka") || 
    addr.includes("savar") || 
    addr.includes("keraniganj") || 
    addr.includes("dohar") || 
    addr.includes("nawabganj") || 
    addr.includes("dhamrai");

  let districtToUse = "Dhaka";
  if (itemData.emergencyContactAddress && isDhaka(emergLower)) {
    districtToUse = getDistrictFromAddress(itemData.emergencyContactAddress, itemData) || "Dhaka";
  } else if (itemData.permanentAddress && isDhaka(permLower)) {
    districtToUse = getDistrictFromAddress(itemData.permanentAddress, itemData) || "Dhaka";
  } else if (itemData.permanentAddress) {
    districtToUse = getDistrictFromAddress(itemData.permanentAddress, itemData) || "Dhaka";
  }

  return generateBangladeshiAddress(districtToUse, itemData.passportNumber || itemData.givenName, 'present');
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
    ? ['Enterprise', 'Traders', 'Corporation', 'Agency', 'Trading', 'Group'] 
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
  const district = getDistrictFromAddress(presentAddress, itemData) || "Dhaka";
  const seedStr = presentAddress + (itemData?.passportNumber || itemData?.givenName || 'seeder');
  return generateBangladeshiAddress(district, seedStr, 'business');
};

export const getOfficeAddressDhaka = (presentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.officeAddressDhaka) return itemData.officeAddressDhaka;
  const district = getDistrictFromAddress(presentAddress, itemData) || "Dhaka";
  const seedStr = presentAddress + (itemData?.passportNumber || itemData?.givenName || 'seeder');
  return generateBangladeshiAddress(district, seedStr, 'office');
};

export const getBusinessAddressLocal = (permanentAddress: string, itemData?: PassportData | null): string => {
  if (itemData && itemData.businessAddressLocal) return itemData.businessAddressLocal;
  if (!permanentAddress) {
    return generateBangladeshiAddress('Gopalganj', 'fallback', 'local');
  }
  const district = getDistrictFromAddress(permanentAddress, itemData) || "Gopalganj";
  const seedStr = permanentAddress + (itemData?.passportNumber || itemData?.givenName || 'seeder_local');
  return generateBangladeshiAddress(district, seedStr, 'local');
};

export const generatePermanentAddressForDistrict = (district: string, seedString: string): string => {
  const normDistrict = (district || 'Munshiganj')
    .trim()
    .replace(/(district|zilla|zilla\s+of)/i, '')
    .trim();
  const districtUpper = normDistrict.toUpperCase() || 'MUNSHIGANJ';
  
  const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Real Thanas & Post Offices & Villages per District for realism
  const db: Record<string, { thana: string; po: string; pc: string; villages: string[] }[]> = {
    'MUNSHIGANJ': [
      { thana: "SREENAGAR", po: "SREENAGAR", pc: "1550", villages: ["HARPARA", "KUKUTIA", "BAGHRA", "BHAGYAKUL"] },
      { thana: "LOUHAJANG", po: "LOUHAJANG", pc: "1530", villages: ["MEDINIMANDAL", "KALTIA", "GANDHARBAPUR"] },
      { thana: "SIRAJDIKHAN", po: "SIRAJDIKHAN", pc: "1540", villages: ["BALUSHUR", "CHHATIANTAL", "RUSHIDIA"] }
    ],
    'GOPALGANJ': [
      { thana: "MUKSUDPUR", po: "MAJHIGATI", pc: "8131", villages: ["MAJHIGATI", "NANIKHIAL", "RAGHURAMPUR"] },
      { thana: "MUKSUDPUR", po: "BONOGRAM", pc: "8151", villages: ["MALIGRAM", "BONOGRAM", "CHARPRASANNAPUR"] },
      { thana: "TUNGIPARA", po: "TUNGIPARA", pc: "8120", villages: ["GIMADANGA", "PATGATI", "KARCHALIA"] },
      { thana: "KOTALIPARA", po: "KOTALIPARA", pc: "8110", villages: ["PINJURI", "SUKHAIL", "RAMSHIL"] }
    ],
    'DHAKA': [
      { thana: "SAVAR", po: "SAVAR", pc: "1340", villages: ["BANKTOWN", "REJUPUR", "NIDHIN"] },
      { thana: "KERANIGANJ", po: "KERANIGANJ", pc: "1310", villages: ["ZINZIRA", "KALATIA", "ROHITPUR"] },
      { thana: "DHAMRAI", po: "DHAMRAI", pc: "1350", villages: ["SUAPUR", "KUSHURA", "SUTIPARA"] }
    ],
    'COMILLA': [
      { thana: "LAKSHAM", po: "LAKSHAM", pc: "3570", villages: ["GABTALI", "HEMAMPUR", "KANDIRPAR"] },
      { thana: "CHAUDDAGRAM", po: "CHAUDDAGRAM", pc: "3510", villages: ["ALIPUR", "BATISA", "JAGANNATHPUR"] }
    ],
    'CUMILLA': [
      { thana: "LAKSHAM", po: "LAKSHAM", pc: "3570", villages: ["GABTALI", "HEMAMPUR", "KANDIRPAR"] },
      { thana: "CHAUDDAGRAM", po: "CHAUDDAGRAM", pc: "3510", villages: ["ALIPUR", "BATISA", "JAGANNATHPUR"] }
    ],
    'RANGPUR': [
      { thana: "MITHAPUKUR", po: "MITHAPUKUR", pc: "5460", villages: ["SHALTI", "BALUA", "RAMNATHPUR"] },
      { thana: "PIRGANJ", po: "PIRGANJ", pc: "5470", villages: ["KHALISPUR", "LALDIGHI", "DAUDPRASAD"] }
    ],
    'GAZIPUR': [
      { thana: "KALIGANJ", po: "KALIGANJ", pc: "1720", villages: ["BALIGAON", "JANGALIA", "TUMILIA"] },
      { thana: "SREEPUR", po: "SREEPUR", pc: "1740", villages: ["MAWNA", "BARMI", "TELIATI"] }
    ]
  };
  
  // Choose standard fallback if no key matched
  const options = db[districtUpper] || [
    { 
      thana: `${districtUpper} SADAR`, 
      po: `${districtUpper} SADAR`, 
      pc: (1000 + (seed % 8000)).toString(), 
      villages: ["HARIPUR", "ROYPUR", "KRISHNAPUR", "SUNDARPUR", "UTTARPARA", "SOUTHPARA"] 
    }
  ];
  
  const chosenArea = options[seed % options.length];
  const chosenVillage = chosenArea.villages[(seed + 3) % chosenArea.villages.length];
  
  // Format strictly like: HARPARA, SREENAGAR, SREENAGAR - 1550, MUNSHIGANJ
  return `${chosenVillage}, ${chosenArea.po}, ${chosenArea.thana} - ${chosenArea.pc}, ${districtUpper}`;
};

export const getPermanentAddress = (itemData: PassportData | null): string => {
  if (!itemData) return "HARPARA, SREENAGAR, SREENAGAR - 1550, MUNSHIGANJ";
  
  if (itemData.permanentAddress) {
    const commaCount = (itemData.permanentAddress.match(/,/g) || []).length;
    if (commaCount >= 2) {
      return itemData.permanentAddress;
    }
    // If it has permanentAddress but not in a clean 3+ part format, reformat it
    const dist = getDistrictFromAddress(itemData.permanentAddress, itemData) || "Munshiganj";
    return generatePermanentAddressForDistrict(dist, itemData.passportNumber || itemData.givenName || 'seeder_perm');
  }

  const dist = getDistrictFromAddress(itemData.presentAddress, itemData) || itemData.birthPlaceDistrict || itemData.birthPlace || "Munshiganj";
  return generatePermanentAddressForDistrict(dist, itemData.passportNumber || itemData.givenName || 'seeder_perm');
};

export const generateDataText = (itemData: PassportData | null): string => {
  if (!itemData) return '';
  
  const presentAddr = getPresentAddress(itemData);
  const permanentAddr = getPermanentAddress(itemData);
  const dhakaBizAddr = getBusinessAddressDhaka(presentAddr, itemData);
  const officeAddr = getOfficeAddressDhaka(presentAddr, itemData);
  const localBizAddr = getBusinessAddressLocal(permanentAddr, itemData);

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
