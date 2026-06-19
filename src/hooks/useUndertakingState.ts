import { useState, useEffect } from 'react';
import { PassportData, UndertakingFormData } from '../types';

export function useUndertakingState(data: PassportData | null) {
  const [utPurpose, setUtPurpose] = useState(() => localStorage.getItem('ut_purpose') || '');
  const [utFromDate, setUtFromDate] = useState(() => localStorage.getItem('ut_from_date') || '');
  const [utToDate, setUtToDate] = useState(() => localStorage.getItem('ut_to_date') || '');
  const [utReturnCountry, setUtReturnCountry] = useState(() => localStorage.getItem('ut_return_country') || 'Bangladesh');
  const [utHospitalName, setUtHospitalName] = useState(() => localStorage.getItem('ut_hospital_name') || '');
  const [utDoctorName, setUtDoctorName] = useState(() => {
    const saved = localStorage.getItem('ut_doctor_name') || '';
    if (saved === 'Dr. K. S. Murthy') {
      localStorage.removeItem('ut_doctor_name');
      return '';
    }
    return saved;
  });
  const [utEmbassyCity, setUtEmbassyCity] = useState(() => localStorage.getItem('ut_embassy_city') || 'Delhi');
  const [utEmbassyDate, setUtEmbassyDate] = useState(() => localStorage.getItem('ut_embassy_date') || '');
  const [isUndertakingEditable, setIsUndertakingEditable] = useState(() => localStorage.getItem('is_undertaking_editable') !== 'false');

  const [undertakingData, setUndertakingData] = useState<UndertakingFormData | null>(() => {
    try {
      const saved = localStorage.getItem('active_undertaking_data');
      if (saved && saved !== 'undefined' && saved.trim() !== '') return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('ut_purpose', utPurpose);
    localStorage.setItem('ut_from_date', utFromDate);
    localStorage.setItem('ut_to_date', utToDate);
    localStorage.setItem('ut_return_country', utReturnCountry);
  }, [utPurpose, utFromDate, utToDate, utReturnCountry]);

  useEffect(() => {
    localStorage.setItem('ut_hospital_name', utHospitalName);
    localStorage.setItem('ut_doctor_name', utDoctorName);
    localStorage.setItem('ut_embassy_city', utEmbassyCity);
    localStorage.setItem('ut_embassy_date', utEmbassyDate);
  }, [utHospitalName, utDoctorName, utEmbassyCity, utEmbassyDate]);

  useEffect(() => {
    localStorage.setItem('is_undertaking_editable', String(isUndertakingEditable));
  }, [isUndertakingEditable]);

  useEffect(() => {
    if (undertakingData) {
      localStorage.setItem('active_undertaking_data', JSON.stringify(undertakingData));
    } else {
      localStorage.removeItem('active_undertaking_data');
    }
  }, [undertakingData]);

  const isUndertakingConfigured = !!(utPurpose || utFromDate || utToDate);

  useEffect(() => {
    if (data && isUndertakingConfigured) {
      let durationStr = '';
      if (utFromDate && utToDate) {
        const from = new Date(utFromDate);
        const to = new Date(utToDate);
        const diffTime = to.getTime() - from.getTime();
        if (diffTime >= 0) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
          durationStr = `${diffDays} days`;
        }
      }
      
      const todayStr = new Date().toLocaleDateString('en-GB');

      // Check if we have loaded or saved undertaking data in localStorage for this passport
      let savedData: UndertakingFormData | null = null;
      try {
        const saved = localStorage.getItem('active_undertaking_data');
        if (saved && saved !== 'undefined' && saved.trim() !== '') {
          const parsed = JSON.parse(saved) as UndertakingFormData;
          if (parsed && parsed.passportNumber === (data.passportNumber || '')) {
            if (parsed.doctorName === 'Dr. K. S. Murthy') {
              parsed.doctorName = '';
            }
            savedData = parsed;
          }
        }
      } catch (e) {
        console.error("Failed to load saved undertaking data", e);
      }

      if (savedData) {
        // We have saved data. Check if date option settings changed to sync them, otherwise preserve custom user inputs
        const updatedTravelFrom = utFromDate ? new Date(utFromDate).toLocaleDateString('en-GB') : '';
        const updatedTravelTo = utToDate ? new Date(utToDate).toLocaleDateString('en-GB') : '';
        
        let hasConfigChanges = false;
        const merged = { ...savedData };

        if (utPurpose && merged.purpose !== utPurpose) {
          merged.purpose = utPurpose;
          hasConfigChanges = true;
        }
        if (updatedTravelFrom && merged.travelFrom !== updatedTravelFrom) {
          merged.travelFrom = updatedTravelFrom;
          hasConfigChanges = true;
        }
        if (updatedTravelTo && merged.travelTo !== updatedTravelTo) {
          merged.travelTo = updatedTravelTo;
          hasConfigChanges = true;
        }
        if (durationStr && merged.duration !== durationStr) {
          merged.duration = durationStr;
          hasConfigChanges = true;
        }
        if (utReturnCountry && merged.returnCountry !== utReturnCountry) {
          merged.returnCountry = utReturnCountry;
          hasConfigChanges = true;
        }
        if (utHospitalName && merged.hospitalName !== utHospitalName) {
          merged.hospitalName = utHospitalName;
          hasConfigChanges = true;
        }
        if (utDoctorName && merged.doctorName !== utDoctorName) {
          merged.doctorName = utDoctorName;
          hasConfigChanges = true;
        }
        if (utEmbassyCity && merged.embassyCity !== utEmbassyCity) {
          merged.embassyCity = utEmbassyCity;
          hasConfigChanges = true;
        }
        if (utEmbassyDate && merged.embassyDate !== utEmbassyDate) {
          merged.embassyDate = utEmbassyDate;
          hasConfigChanges = true;
        }
        if (data.gender && merged.gender !== data.gender) {
          merged.gender = data.gender;
          hasConfigChanges = true;
        }

        if (hasConfigChanges) {
          setUndertakingData(merged);
        } else {
          setUndertakingData(savedData);
        }
      } else {
        setUndertakingData({
          fullName: `${data.givenName || ''} ${data.surname || ''}`.trim().toUpperCase(),
          passportNumber: data.passportNumber || '',
          nationality: 'Bangladeshi',
          dob: data.dob || '',
          gender: data.gender || '',
          address: data.presentAddress || '',
          purpose: utPurpose || '',
          travelFrom: utFromDate ? new Date(utFromDate).toLocaleDateString('en-GB') : '',
          travelTo: utToDate ? new Date(utToDate).toLocaleDateString('en-GB') : '',
          duration: durationStr,
          returnCountry: utReturnCountry || 'Bangladesh',
          date: todayStr,
          hospitalName: utHospitalName,
          doctorName: utDoctorName,
          embassyCity: utEmbassyCity,
          embassyDate: utEmbassyDate
        });
      }
    } else {
      setUndertakingData(null);
    }
  }, [data, utPurpose, utFromDate, utToDate, utReturnCountry, isUndertakingConfigured, utHospitalName, utDoctorName, utEmbassyCity, utEmbassyDate]);


  return {
    utPurpose, setUtPurpose,
    utFromDate, setUtFromDate,
    utToDate, setUtToDate,
    utReturnCountry, setUtReturnCountry,
    utHospitalName, setUtHospitalName,
    utDoctorName, setUtDoctorName,
    utEmbassyCity, setUtEmbassyCity,
    utEmbassyDate, setUtEmbassyDate,
    isUndertakingEditable, setIsUndertakingEditable,
    undertakingData, setUndertakingData
  };
}
