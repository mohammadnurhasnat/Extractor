export interface User {
  id: string;
  email: string;
  name: string;
  mobileNumber: string;
}

export interface PassportData {
  givenName: string;
  surname: string;
  gender: string;
  dob: string;
  birthPlace: string;
  fatherName: string;
  motherName: string;
  spouseName: string;
  passportNumber: string;
  nidOrBirthCertNumber: string;
  issueDate: string;
  expiryDate: string;
  mobileNumber: string;
  permanentAddress?: string;
  presentAddress?: string;
  businessAddressDhaka?: string;
  businessAddressLocal?: string;
  officeAddressDhaka?: string;
  officeAddressLocal?: string;

  // Editable manual overrides
  email?: string;
  proprietorBusinessName?: string;
  jobCompanyName?: string;
  jobRole?: string;
  placeOfIssue?: string;
  birthPlaceDistrict?: string;
  extractionTime?: number;

  // Hotel details
  hotelName?: string;
  hotelAddress?: string;
  hotelPinCode?: string;
  hotelState?: string;
  hotelDistrict?: string;
  hotelPhone?: string;
  
  // Hospital Details
  hospitalName?: string;
  hospitalAddress?: string;

  // Multi-Agent System Insights
  agentLog?: string;
  discrepancyList?: string[];
  customUndertakingDraft?: string;
  fieldConfidence?: {
    givenName?: number;
    surname?: number;
    gender?: number;
    dob?: number;
    birthPlace?: number;
    fatherName?: number;
    motherName?: number;
    spouseName?: number;
    passportNumber?: number;
    nidOrBirthCertNumber?: number;
    issueDate?: number;
    expiryDate?: number;
    mobileNumber?: number;
    permanentAddress?: number;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: PassportData;
  extractionTime?: number;
  imageBase64?: string;
}

export interface UndertakingFormData {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dob: string;
  address: string;
  purpose: string;
  travelFrom: string;
  travelTo: string;
  duration: string;
  returnCountry: string;
  date: string;
  hospitalName?: string;
  doctorName?: string;
  departmentName?: string;
  embassyCity?: string;
  gender?: string;
  embassyDate?: string;
}

export interface QueueItem {
  id: string;
  file: File;
  preview: string;
  loading: boolean;
  error: string | null;
  status: 'queued' | 'extracting' | 'completed' | 'failed';
  data?: PassportData;
  lastUsedAt?: number;
  compressionRatio?: string;
  documentType?: 'passport' | 'visa_application';
}
