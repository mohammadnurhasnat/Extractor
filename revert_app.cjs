const fs = require('fs');

let appFile = fs.readFileSync('src/App.tsx', 'utf8');
appFile = appFile.replace(/        selectedHospital=\{undertakingData\?\.hospitalName \|\| data\?\.hospitalName \|\| utHospitalName \|\| ''\}\n/g, '');
fs.writeFileSync('src/App.tsx', appFile);

let modalFile = fs.readFileSync('src/components/AppModals.tsx', 'utf8');
modalFile = modalFile.replace(/  selectedHospital\?: string;\n/g, '');
modalFile = modalFile.replace(/  selectedHospital,\n/g, '');
modalFile = modalFile.replace(/          selectedHospital=\{selectedHospital\}\n/g, '');
fs.writeFileSync('src/components/AppModals.tsx', modalFile);

let helperFile = fs.readFileSync('src/components/IndianReferenceHelperModal.tsx', 'utf8');
helperFile = helperFile.replace(/  selectedHospital\?: string;\n/g, '');
helperFile = helperFile.replace(/, selectedHospital /g, ' ');

// revert the useMemo
const useMemoBlock = `  const items = React.useMemo(() => {
    const originalItems = REFERECE_DATA[purpose] || [];
    if (purpose === 'Medical' && selectedHospital) {
      const lowerSelected = selectedHospital.toLowerCase().trim();
      if (lowerSelected) {
        const matchIndex = originalItems.findIndex(item => {
          const lowerName = item.name.toLowerCase().trim();
          if (lowerName === lowerSelected) return true;
          if (lowerName.includes(lowerSelected) || lowerSelected.includes(lowerName)) return true;
          
          // Token-based matching for words longer than 3 characters
          const selectedTokens = lowerSelected.split(/[\\s,.-]+/).filter(t => t.length > 3);
          const nameTokens = lowerName.split(/[\\s,.-]+/).filter(t => t.length > 3);
          return selectedTokens.some(st => nameTokens.some(nt => nt === st));
        });

        if (matchIndex > -1) {
          const matched = originalItems[matchIndex];
          const rest = originalItems.filter((_, idx) => idx !== matchIndex);
          return [matched, ...rest];
        }
      }
    }
    return originalItems;
  }, [purpose, selectedHospital]);`;

helperFile = helperFile.replace(useMemoBlock, `  const items = REFERECE_DATA[purpose] || [];`);

fs.writeFileSync('src/components/IndianReferenceHelperModal.tsx', helperFile);
