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
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: PassportData;
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
}

