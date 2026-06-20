import { useState } from 'react';

export function useSavedOptions() {
  const [savedHospitals, setSavedHospitals] = useState<string[]>(() => {
    const defaults = [
      'Apollo Hospital, Chennai',
      'Max Super Speciality Hospital Noida',
      'Rabindranath Tagore Hospital Kolkata',
      'AIG Hospitals',
      'Manipal Hospitals Mukundapur',
      'Fortis Hospital, Kolkata',
      'Medanta Hospital, Gurgaon',
      'Narayana Health, Bangalore',
      'Christian Medical College, Vellore',
      'Tata Memorial Hospital, Mumbai',
      'Peerless Hospitex Hospital And Research Center Ltd',
      'Caree Fertility Pvt Ltd'
    ];
    try {
      const saved = localStorage.getItem('saved_hospital_names');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const defaultLower = new Set(defaults.map(d => d.toLowerCase().trim()));
          const filteredParsed = parsed.filter(p => !defaultLower.has(p.toLowerCase().trim()));
          return Array.from(new Set([...defaults, ...filteredParsed]));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaults;
  });

  const [savedDepartments, setSavedDepartments] = useState<string[]>(() => {
    const defaults = [
      'Cardiology',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Nephrology',
      'Gastroenterology',
      'Urology',
      'Internal Medicine',
      'IVF Problem',
      'General Surgery',
      'Pediatrics',
      'Gynecology'
    ];
    try {
      const saved = localStorage.getItem('saved_department_names');
      if (saved && saved !== 'undefined' && saved.trim() !== '') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((d: string) => d !== 'Dr. K. S. Murthy');
          return Array.from(new Set([...defaults, ...filtered]));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaults;
  });

  const handleAddHospitalSuggestion = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !savedHospitals.some(h => h.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...savedHospitals, trimmed];
      setSavedHospitals(updated);
      localStorage.setItem('saved_hospital_names', JSON.stringify(updated));
    }
  };

  const handleAddDepartmentSuggestion = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !savedDepartments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...savedDepartments, trimmed];
      setSavedDepartments(updated);
      localStorage.setItem('saved_department_names', JSON.stringify(updated));
    }
  };

  return {
    savedHospitals,
    savedDepartments,
    handleAddHospitalSuggestion,
    handleAddDepartmentSuggestion
  };
}
