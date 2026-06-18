import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, ShieldCheck, History, Trash2, Zap, ZapOff, Search, Sun, Moon, Copy, Download, Check, AlertTriangle, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import imageCompression from 'browser-image-compression';
import { jsPDF } from 'jspdf';
// @ts-ignore
import ExtractorLogo from './assets/images/extractor_logo_1779343193402.png';

// Interface matching the backend schema
interface PassportData {
  givenName: string;
  surname: string;
  gender: string;
  dob: string;
  birthPlace: string;
  permanentAddress: string;
  presentAddress?: string;
  emergencyContactAddress?: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  passportNumber: string;
  nidOrBirthCertNumber: string;
  issueDate: string;
  expiryDate: string;
  mobileNumber: string;
}

interface HistoryItem {
  id: string;
  timestamp: number;
  data: PassportData;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PassportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  
  // History state initialize from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('passport_core_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load history", e);
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('passport_app_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('passport_app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('passport_app_theme', 'light');
    }
  }, [isDarkMode]);

  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('passport_core_history', JSON.stringify(history));
  }, [history]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG).');
      return;
    }
    
    // For preview only, not what we send to backend yet
    setFile(selectedFile);
    setError(null);
    setData(null);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const addToHistory = (newData: PassportData) => {
    setHistory(prev => {
      // Prevent duplicates: filter out existing entry with the same passport number
      const filtered = prev.filter(item => item.data.passportNumber !== newData.passportNumber);
      const uniqueId = Date.now().toString() + Math.random().toString(36).substring(2);
      return [{ id: uniqueId, timestamp: Date.now(), data: newData }, ...filtered];
    });
  };

  const loadFromHistory = (item: HistoryItem) => {
    setData(item.data);
    setPreview(null);
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItemToDelete(id);
  };

  const executeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (itemToDelete) {
      setHistory(prev => prev.filter(h => h.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete(null);
  };

  const extractData = async () => {
    if (!isOnline) {
      setError("Cannot extract data while offline. Please restore your internet connection and try again.");
      return;
    }
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // ⚡️ BROWSER-SIDE COMPRESSION: Optimize image before sending
      const options = {
        maxSizeMB: 1.5, // Force under 1.5MB to save bandwidth and compute
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);

      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        try {
          const res = await fetch('/api/extract-passport', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64String,
              mimeType: file.type
            }),
          });
          
          const result = await res.json();
          
          if (res.ok && result.success) {
            setData(result.data);
            addToHistory(result.data);
          } else {
            setError(result.error || 'Failed to extract data.');
          }
        } catch (err) {
          setError('Network error: Could not reach the server.');
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read the file.');
        setLoading(false);
      };
    } catch (err) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setPreview(null);
    setData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const getPresentAddress = (itemData: PassportData | null) => {
    if (!itemData) return "House 12, Road 5, Dhanmondi, Dhaka-1209";

    const permLower = (itemData.permanentAddress || "").toLowerCase();
    const presLower = (itemData.presentAddress || "").toLowerCase();
    const emergLower = (itemData.emergencyContactAddress || "").toLowerCase();

    const isDhaka = (addr: string) => addr.includes("dhaka") || addr.includes("savar") || addr.includes("keraniganj") || addr.includes("dohar") || addr.includes("nawabganj") || addr.includes("dhamrai");

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

  const getDistrictFromAddress = (address: string | undefined | null) => {
    if (!address) return '';
    const parts = address.split(/[,\-]/).map(s => s.trim()).filter(Boolean);
    const textParts = parts.filter(p => !/^\d+$/.test(p));
    if (textParts.length > 0) {
      return textParts[textParts.length - 1].replace(/(district|zilla)/i, '').trim().toUpperCase();
    }
    return '';
  };

  const getGeneratedEmail = (itemData: PassportData | null) => {
    if (!itemData) return '';
    const nameStr = ((itemData.givenName || '') + (itemData.surname || '')).replace(/[^a-zA-Z]/g, '').toLowerCase();
    const dobStr = itemData.dob || '';
    const yearMatch = dobStr.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : '';
    if (!nameStr) return '';
    return `${nameStr}${year}@gmail.com`;
  };

  const isHinduName = (name: string) => {
    const lowerName = name.toLowerCase();
    const hinduKeywords = ['das', 'ghosh', 'sen', 'bose', 'datta', 'dutta', 'nandi', 'pal', 'paul', 'raha', 'roy', 'saha', 'shill', 'sil', 'sarkar', 'majumder', 'nath', 'barman', 'karmakar', 'deb', 'bhowmik', 'poddar', 'banik', 'dev', 'guha', 'bhattacharya', 'mukherjee', 'banerjee', 'chatterjee', 'ganguly', 'ray', 'biswas', 'haldar', 'mandal', 'bera', 'mitra', 'sharma', 'chandra', 'kumar', 'mondal', 'shil', 'chakraborty'];
    return hinduKeywords.some(keyword => lowerName.includes(keyword));
  };

  const generateRandomEnterpriseName = (name: string, isJob = false) => {
    const firstName = name.split(' ').filter(p => p.length > 2)[0] || name.split(' ')[0] || 'Unknown';
    const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    
    if (isHinduName(name)) {
      const hinduSuffixes = isJob ? ['Jewellers', 'Sweetmeat', 'Mistanno Vandar', 'Bastraloy'] : ['Hair Cutting Salon', 'Mistanno Vandar', 'Sweet Store', 'Jewellers', 'Bastraloy', 'Mishti Ghor'];
      const suffix = hinduSuffixes[name.length % hinduSuffixes.length];
      const prefix = name.length % 2 === 0 ? 'MS ' : '';
      return `${prefix}${capitalizedName} ${suffix}`.trim();
    }
    
    const suffixes = isJob ? ['Enterprise', 'Traders', 'Corporation', 'Agency', 'Trading', 'Group'] : ['Enterprise', 'Traders', 'Telecom', 'Motors', 'Fabrics', 'Electronics'];
    const suffix = suffixes[name.length % suffixes.length];
    
    const prefixes = ['MS ', '', ''];
    const prefix = prefixes[name.length % prefixes.length];
    
    return `${prefix}${capitalizedName} ${suffix}`.trim();
  };

  const getProprietorBusinessName = (itemData: PassportData | null) => {
    if (!itemData) return '';
    const nameToUse = itemData.givenName || itemData.surname || itemData.fatherName || itemData.motherName || 'Unknown';
    const fullName = `${itemData.givenName || ''} ${itemData.surname || ''} ${itemData.fatherName || ''} ${itemData.motherName || ''}`;
    return generateRandomEnterpriseName(isHinduName(fullName) ? fullName : nameToUse);
  };

  const getJobCompanyName = (itemData: PassportData | null) => {
    if (!itemData) return '';
    const nameToUse = itemData.fatherName || itemData.motherName || itemData.surname || 'Unknown';
    const fullName = `${itemData.givenName || ''} ${itemData.surname || ''} ${itemData.fatherName || ''} ${itemData.motherName || ''}`;
    return generateRandomEnterpriseName(isHinduName(fullName) ? fullName : nameToUse, true);
  };

  const getJobRole = (itemData: PassportData | null) => {
    if (!itemData) return '';
    const nameLen = (itemData.givenName || itemData.surname || 'a').length;
    const roles = ['Manager', 'Assistant Manager', 'Office Assistant', 'Salesman', 'Executive'];
    return roles[nameLen % roles.length];
  };

  const getBusinessAddressDhaka = (presentAddress: string) => {
    const presentLower = presentAddress.toLowerCase();
    
    // Seed for generating pseudo-random details based on the address string
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
    
    // Generic fallback that looks more realistic if no specific area match
    const districtMatch = presentAddress.split(',').slice(-1)[0]?.trim() || "Dhaka";
    
    if (getFormat === 0) {
      return `Shop ${shopNum}, City Center, ${districtMatch}`;
    } else if (getFormat === 1) {
      return `Holding No. ${shopNum * 2}, ${districtMatch}`;
    } else {
      return `House ${shopNum}, Main Road, ${districtMatch}`;
    }
  };

  const getOfficeAddressDhaka = (presentAddress: string) => {
    const presentLower = presentAddress.toLowerCase();
    
    // Seed for generating pseudo-random details based on the address string
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
    
    // Generic fallback that looks more realistic if no specific area match
    const districtMatch = presentAddress.split(',').slice(-1)[0]?.trim() || "Dhaka";
    
    if (getFormat === 0) {
      return `${randomTower}, ${districtMatch}`;
    } else if (getFormat === 1) {
      return `Office ${suiteNum}, ${randomTower}, ${districtMatch}`;
    } else {
      return `Holding ${suiteNum}, ${randomTower}, ${districtMatch}`;
    }
  };

  const getBusinessAddressLocal = (permanentAddress: string) => {
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

  const generateDataText = (itemData: PassportData | null) => {
    if (!itemData) return '';
    
    const presentAddr = getPresentAddress(itemData);
    const dhakaBizAddr = getBusinessAddressDhaka(presentAddr);
    const officeAddr = getOfficeAddressDhaka(presentAddr);
    const localBizAddr = getBusinessAddressLocal(itemData.permanentAddress);

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

=== ADDRESS ===
PRESENT ADDRESS: ${presentAddr}
PERMANENT ADDRESS: ${itemData.permanentAddress}

=== ADDITIONAL INFORMATION ===
Father's Name: ${itemData.fatherName}
Mother's Name: ${itemData.motherName}
Spouse's Name: ${itemData.spouseName || "N/A"}
Mobile Number: ${itemData.mobileNumber ? itemData.mobileNumber.replace(/^\+88\s*/, '') : ''}
Town/City of birth/BIRTH PLACE: ${getDistrictFromAddress(itemData.permanentAddress)}

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

  const handleCopyAll = async () => {
    if (!data) return;
    const text = generateDataText(data);
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownloadText = () => {
    if (!data) return;
    const text = generateDataText(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Passport_Data_${data.givenName || 'Extracted'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    
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
    drawFullWidthField('BUSINESS ADDRESS (DHAKA / PRESENT)', getBusinessAddressDhaka(presentAddr));
    drawFullWidthField('BUSINESS ADDRESS (LOCAL / PERMANENT)', getBusinessAddressLocal(data.permanentAddress));
    y += 4;

    // B. Job Details
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 128, 6); // #FF8006 (Brand Highlights)
    doc.text('B. PRIVATE SERVICE / EMPLOYMENT', 15, y);
    y += 6;
    drawRow('COMPANY NAME', getJobCompanyName(data), 'DESIGNATION', getJobRole(data));
    drawFullWidthField('OFFICE ADDRESS (DHAKA / PRESENT)', getOfficeAddressDhaka(presentAddr));
    drawFullWidthField('OFFICE ADDRESS (LOCAL / PERMANENT)', getBusinessAddressLocal(data.permanentAddress));

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

    // Save and Trigger prompt
    doc.save(`Passport_Report_${data.givenName || 'Summary'}.pdf`);
  };


  const filteredHistory = history.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${item.data.givenName || ''} ${item.data.surname || ''}`.toLowerCase();
    const passportNumber = (item.data.passportNumber || '').toLowerCase();
    const email = getGeneratedEmail(item.data).toLowerCase();
    
    return fullName.includes(searchLower) || 
           passportNumber.includes(searchLower) || 
           email.includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans text-slate-900 dark:text-zinc-50 pb-12 selection:bg-blue-100 dark:selection:bg-blue-900/50 transition-colors">
      {/* Header */}
        <header className="bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 px-6 py-4 shadow-sm sticky top-0 z-10 flex justify-between items-start transition-colors print:hidden">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-inner border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <img src={ExtractorLogo} alt="Extractor Logo" className="w-8 h-8 rounded shadow-sm object-cover" />
          </div>
          <div className="pt-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-zinc-100">Extractor</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Smart Identity Extraction System</p>
          </div>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            <ShieldCheck className="w-4 h-4" /> Secure & In-Memory Processing
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Offline Warning Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-400 font-medium text-sm overflow-hidden sticky top-[73px] z-10 print:hidden shadow-inner backdrop-blur-md"
          >
            <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold tracking-tight">Offline Mode:</span>
                <span className="text-xs opacity-90 leading-tight">
                  You have lost your network connection. Data extraction is temporarily disabled.
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Waiting for link
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 mt-10 print:mt-2 print:max-w-full print:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          
          {/* UPLOAD & HISTORY SECTION (Left side) */}
          <div className="lg:col-span-5 flex flex-col gap-6 print:hidden">
            <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 transition-colors">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2 dark:text-zinc-100">
                <FileText className="w-5 h-5 text-blue-500" />
                Upload Document
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">Upload a clear photo of the passport data page.</p>
              
              {!preview ? (
                <>
                  <div 
                    className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-black/50 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors group flex flex-col items-center justify-center text-center h-64 relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/jpeg, image/png, image/webp" 
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center cursor-pointer p-6" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-zinc-200">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">JPEG, PNG, WEBP (Max 20MB)</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-black aspect-[4/3] flex items-center justify-center">
                    <img src={preview} alt="Passport Preview" className="max-w-full max-h-full object-contain" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl" />
                  </div>
                  
                  <div className="flex gap-3">
                     <button 
                      onClick={clearAll}
                      disabled={loading}
                      className="flex-1 py-2.5 px-4 rounded-lg font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      Clear
                    </button>
                    {!data && (
                      <div className="flex-[2] flex flex-col gap-2">
                        <button 
                          onClick={extractData}
                          disabled={loading || !isOnline}
                          className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 shadow-sm border border-transparent ${
                            !isOnline 
                              ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-70 cursor-pointer'
                          }`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" /> Extracting...
                            </>
                          ) : !isOnline ? (
                            <>
                              <ZapOff className="w-5 h-5 text-red-500" /> Offline: Disabled
                            </>
                          ) : (
                            'Extract Data'
                          )}
                        </button>
                        {!isOnline && (
                          <span className="text-[10px] text-red-500 font-semibold text-center animate-pulse">
                            Internet connection required
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-3 border border-red-100"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* HISTORY SECTION (Now below upload on left side) */}
            <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 min-h-[300px] flex flex-col transition-colors">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2 text-slate-800 dark:text-zinc-100">
                    <History className="w-6 h-6 text-blue-500" /> Recent Extractions
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Access previously scanned passports.</p>
                </div>
                
                <div className="flex z-10 items-center justify-between xl:justify-end gap-3 w-full xl:w-auto">
                  <div className="relative flex-1 xl:w-[150px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm bg-slate-50 dark:bg-black/50 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-zinc-100 transition-colors placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                  </div>

                  {history.length > 0 && (
                    <button 
                      onClick={() => setHistory([])}
                      className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-semibold px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shrink-0 border border-transparent whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
                  <History className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-4" />
                  <p className="text-base font-medium text-slate-600 dark:text-zinc-300">No history yet</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center opacity-50 flex-1 py-8">
                  <Search className="w-10 h-10 text-slate-300 dark:text-zinc-600 mb-4" />
                  <p className="text-base font-medium text-slate-600 dark:text-zinc-300">No matching results</p>
                </div>
              ) : (
                <div className="overflow-y-auto pr-2 space-y-3 pb-2 scrollbar-thin max-h-[300px]">
                  {filteredHistory.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => loadFromHistory(item)}
                      className="cursor-pointer group relative flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-black/50 hover:bg-blue-50 dark:hover:bg-zinc-800/50 hover:border-blue-200 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-col mr-6 overflow-hidden">
                        <span className="font-bold text-[15px] leading-tight text-slate-800 dark:text-zinc-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                          {item.data.givenName} {item.data.surname}
                        </span>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                           <span className="text-[11px] font-semibold px-2 py-0.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 rounded">
                            {item.data.passportNumber || "Unknown ID"}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded truncate max-w-[150px]">
                            {getGeneratedEmail(item.data)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => confirmDelete(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 absolute right-4 p-2 text-slate-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 shrink-0"
                        title="Delete from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RESULTS SECTION (Right side on large screens) */}
          <div className="lg:col-span-7 print:w-full print:col-span-12">
            {data ? (
              <div id="printable-results-card" className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-zinc-800/60 transition-all sticky top-6 print:relative print:top-0 print:border-none print:shadow-none print:bg-transparent print:p-0 print:m-0 w-full">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* PRINT-ONLY PROFESSIONAL HEADER/LETTERHEAD */}
                  <div className="hidden print:block mb-8 border-b-2 border-[#0C8493] pb-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h1 className="text-2xl font-black text-[#0C8493]">PASSPORT DATA EXTRACTION REPORT</h1>
                        <p className="text-xs text-[#FF8006] font-bold mt-1 uppercase tracking-wider">Smart Automated Identity Processor</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 font-medium">Date Printed: {new Date().toLocaleDateString('en-GB')}</p>
                        <p className="text-xs text-slate-500 font-medium">Status: <span className="text-emerald-600 font-semibold">Verified Extract</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-zinc-800/50 gap-4 print:hidden">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-100">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        Passport Data
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                      <button 
                        onClick={handleCopyAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-transparent dark:border-zinc-700 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Copied" : "Copy All"}
                      </button>
                      <button 
                        onClick={handleDownloadText}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download TXT
                      </button>
                      <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8006] hover:bg-[#FF8006]/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Download PDF Summary
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C8493] hover:bg-[#0C8493]/90 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-sm active:scale-95 duration-100 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Report
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                    <DataField label="EMAIL" value={getGeneratedEmail(data)} highlight />
                    <DataField label="DOB" value={data.dob} />
                    <DataField label="Surname" value={data.surname} />
                    <DataField label="Given Name" value={data.givenName} />
                    <DataField label="Town/City of birth/BIRTH PLACE" value={data.birthPlace} />
                    <DataField label="National Id No/BIRTH CERTIFICATE NO" value={data.nidOrBirthCertNumber} />
                    <DataField label="Passport Number" value={data.passportNumber} highlight />
                    <DataField label="Place of Issue" value="DHAKA" />
                    <DataField label="Date of Issue" value={data.issueDate} />
                    <DataField label="Date of Expiry" value={data.expiryDate} />
                    
                    <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800/50"></div>
                    
                    <div className="col-span-2">
                       <DataField label="PRESENT ADDRESS" value={getPresentAddress(data)} />
                    </div>
                    <div className="col-span-2">
                      <DataField label="PERMANENT ADDRESS" value={data.permanentAddress} />
                    </div>

                    <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Additional Information</h4>
                    </div>
                    
                    <DataField label="Father's Name" value={data.fatherName} />
                    <DataField label="Mother's Name" value={data.motherName} />
                    <DataField label="Spouse's Name" value={data.spouseName || "N/A"} />
                    <DataField label="Mobile Number" value={data.mobileNumber ? data.mobileNumber.replace(/^\+88\s*/, '') : ''} />
                    <DataField label="Town/City of birth/BIRTH PLACE" value={getDistrictFromAddress(data.permanentAddress)} />

                    <div className="col-span-2 pt-3 border-t border-slate-100 dark:border-zinc-800/50 mt-2">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">Business & Profession Details</h4>
                    </div>
                    
                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      {/* Proprietorship */}
                      <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Business (Proprietorship)</h5>
                        <DataField label="Business Name" value={getProprietorBusinessName(data)} />
                        <DataField label="Designation" value="Proprietor" />
                        <div className="pt-2">
                          <DataField label="Business Address (Present)" value={getBusinessAddressDhaka(getPresentAddress(data))} />
                        </div>
                        <div className="pt-2">
                          <DataField label="Business Address (Permanent)" value={getBusinessAddressLocal(data.permanentAddress)} />
                        </div>
                      </div>

                      {/* Private Service / Job */}
                      <div className="space-y-3 bg-slate-50/50 dark:bg-black/30 p-4 rounded-xl border border-slate-100 dark:border-zinc-800/50">
                        <h5 className="text-sm font-semibold text-slate-700 dark:text-zinc-300 border-b border-slate-200 dark:border-zinc-800/50 pb-2 mb-1">Private Service / Job</h5>
                        <DataField label="Company Name" value={getJobCompanyName(data)} />
                        <DataField label="Designation" value={getJobRole(data)} />
                         <div className="pt-2">
                          <DataField label="Office Address (Present)" value={getOfficeAddressDhaka(getPresentAddress(data))} />
                        </div>
                        <div className="pt-2">
                          <DataField label="Office Address (Permanent)" value={getBusinessAddressLocal(data.permanentAddress)} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
                <div className="bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 border-dashed rounded-2xl h-[500px] flex flex-col items-center justify-center text-center p-8 sticky top-6">
                    <FileText className="w-16 h-16 text-slate-200 dark:text-zinc-700 mb-4" />
                    <p className="text-lg font-medium text-slate-500 dark:text-zinc-400">No Data Extracted Yet</p>
                    <p className="text-sm text-slate-400 dark:text-zinc-500 mt-2 max-w-sm">Upload a passport image on the left and click "Extract Data" to see the extracted fields here.</p>
                </div>
            )}
          </div>

        </div>
      </main>



      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50"
              onClick={cancelDelete}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">Delete History Item?</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  Are you sure you want to delete this extracted passport from your history? This action cannot be undone.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component for rendering a single data field
function DataField({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col group/field">
      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide mb-1">{label}</span>
      <div className={`
        relative px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors flex items-start justify-between gap-2 overflow-hidden
        ${highlight 
          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 shadow-inner' 
          : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100'}
        ${!value ? 'italic opacity-60' : ''}
      `}>
        <span className="break-words whitespace-normal pt-0.5 text-left flex-1 w-full" title={value || ''}>{value || 'Not Found'}</span>
        {value && (
          <button
            onClick={handleCopy}
            className={`
              p-1.5 rounded-md transition-all shrink-0
              ${copied 
                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/20' 
                : 'text-slate-400 opacity-100 sm:opacity-0 group-hover/field:opacity-100 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-zinc-300 dark:hover:bg-zinc-800'}
            `}
            title="Copy"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

