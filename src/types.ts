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
