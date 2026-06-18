export interface PassportData {
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
  // Editable manual overrides
  email?: string;
  proprietorBusinessName?: string;
  businessAddressDhaka?: string;
  businessAddressLocal?: string;
  jobCompanyName?: string;
  jobRole?: string;
  officeAddressDhaka?: string;
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

