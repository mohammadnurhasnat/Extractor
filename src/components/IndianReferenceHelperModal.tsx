import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Building, Landmark, Hotel, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReferenceItem {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export const REFERECE_DATA: Record<string, ReferenceItem[]> = {
  Tourism: [
    {
      name: 'The Peerless Inn Kolkata',
      address: '12, Jawaharlal Nehru Road, Esplanade, Dharmatala, Kolkata, West Bengal 700013',
      phone: '+913344003900',
      email: 'pik@peerlesshotels.com'
    },
    {
      name: 'The Oberoi Grand Kolkata',
      address: '15, Jawaharlal Nehru Road, New Market Area, Dharmatala, Kolkata, West Bengal 700013',
      phone: '+913322492323',
      email: 'reservations@oberoigroup.com'
    },
    {
      name: 'The Park Hotel Kolkata',
      address: '17, Park Street, Taltala, Kolkata, West Bengal 700016',
      phone: '+913322499000',
      email: 'resv.cal@theparkhotels.com'
    },
    {
      name: 'JW Marriott Hotel Kolkata',
      address: '4A, JBS Haldane Avenue, Tangra, Kolkata, West Bengal 700105',
      phone: '+913366330000',
      email: 'jw.ccujw.reservations@marriotthotels.com'
    },
    {
      name: 'Taj Bengal Kolkata',
      address: '34-B, Belvedere Road, Alipore, Kolkata, West Bengal 700027',
      phone: '+913366123939',
      email: 'bengal.kolkata@tajhotels.com'
    }
  ],
  Medical: [
    {
      name: 'Apollo Hospital, Chennai',
      address: '21, Greams Lane, Off Greams Road, Chennai, Tamil Nadu 600006',
      phone: '+914428290200',
      email: 'infochennai@apollohospitals.com'
    },
    {
      name: 'Max Super Speciality Hospital Noida',
      address: 'A-364, Sector 19, Noida, Uttar Pradesh 201301',
      phone: '+911206629999',
      email: 'contact.noida@maxhealthcare.com'
    },
    {
      name: 'Rabindranath Tagore Hospital Kolkata',
      address: '124, Mukundapur Main Road, Mukundapur, Kolkata, West Bengal 700099',
      phone: '+918067506860',
      email: 'info.rtiics@narayanahealth.org'
    },
    {
      name: 'AIG Hospitals',
      address: '1-100/1/CCH, Mindspace Road, Gachibowli, Hyderabad, Telangana 500032',
      phone: '+914023378888',
      email: 'info@aighospitals.com'
    },
    {
      name: 'Manipal Hospitals Mukundapur',
      address: '141, Barakhola, Mukundapur, Kolkata, West Bengal 700099',
      phone: '+913366405000',
      email: 'info.mukundapur@manipalhospitals.com'
    },
    {
      name: 'Fortis Hospital, Kolkata',
      address: '730, Eastern Metropolitan Bypass, Anandapur, Kolkata, West Bengal 700107',
      phone: '+913366284444',
      email: 'contactus.kolkata@fortishealthcare.com'
    },
    {
      name: 'Medanta Hospital, Gurgaon',
      address: 'CH Baktawar Singh Road, Sector 38, Gurgaon, Haryana 122001',
      phone: '+911244141414',
      email: 'info@medanta.org'
    },
    {
      name: 'Narayana Health, Bangalore',
      address: '258/A, Bommasandra Industrial Area, Anekal Taluk, Bangalore, Karnataka 560099',
      phone: '+918071222222',
      email: 'info.msr@narayanahealth.org'
    },
    {
      name: 'Christian Medical College, Vellore',
      address: 'Ida Scudder Road, Vellore, Tamil Nadu 632004',
      phone: '+914162281000',
      email: 'directorate@cmcvellore.ac.in'
    },
    {
      name: 'Tata Memorial Hospital, Mumbai',
      address: 'Dr. Ernest Borges Road, Parel, Mumbai, Maharashtra 400012',
      phone: '+912224177000',
      email: 'info@tmc.gov.in'
    },
    {
      name: 'Peerless Hospitex Hospital And Research Center Ltd',
      address: '360, Panchasayar, Garia, Kolkata, West Bengal 700094',
      phone: '+913340111222',
      email: 'peerless@peerlesshospital.com'
    },
    {
      name: 'Caree Fertility Pvt Ltd',
      address: '151A, Broad Street, Park Circus, Ballygunge, Kolkata, West Bengal 700019',
      phone: '+919830501133',
      email: 'info@careefertilitycentre.com'
    }
  ],
  DoubleEntry: [
    {
      name: 'The Oberoi New Delhi',
      address: 'Dr. Zakir Hussain Marg, Delhi Golf Club, Golf Links, New Delhi, Delhi 110003',
      phone: '+911124363030',
      email: 'reservations.delhi@oberoigroup.com'
    },
    {
      name: 'Taj Palace New Delhi',
      address: '2, Sardar Patel Marg, Diplomatic Enclave, Chanakyapuri, New Delhi, Delhi 110021',
      phone: '+911126110202',
      email: 'palace.delhi@tajhotels.com'
    },
    {
      name: 'The Lalit New Delhi',
      address: 'Fire Brigade Lane, Barakhamba, Connaught Place, New Delhi, Delhi 110001',
      phone: '+911144447777',
      email: 'delhi@thelalit.com'
    },
    {
      name: 'Shangri-La Eros New Delhi',
      address: '19, Ashoka Road, Janpath, Connaught Place, New Delhi, Delhi 110001',
      phone: '+911141191919',
      email: 'newdelhi@shangri-la.com'
    },
    {
      name: 'Le Méridien New Delhi',
      address: 'Windsor Place, Janpath, Connaught Place, New Delhi, Delhi 110001',
      phone: '+911145020200',
      email: 'info@lemeridiennewdelhi.com'
    }
  ],
  Business: [
    {
      name: 'M R Enterprise',
      address: '111, Kabiguru Sarani, A. G. Road, Kolkata, West Bengal 700038',
      phone: '+919830818359',
      email: 'mrenterprise.cal@gmail.com'
    },
    {
      name: 'MS Mallika Enterprise',
      address: 'Anandanagar, Jhautala, Liluah, Howrah, West Bengal 711203',
      phone: '+918777034708',
      email: 'mallikaent.sales@gmail.com'
    },
    {
      name: 'R M International',
      address: '2/72, Azadgarh, Tollygunge, Kolkata, West Bengal 700040',
      phone: '+918274950443',
      email: 'rminternational.kol@yahoo.com'
    },
    {
      name: 'Bengal Global Trade Link',
      address: '15, Netaji Subhas Road, Fairley Place, B.B.D. Bagh, Kolkata, West Bengal 700001',
      phone: '+913322304567',
      email: 'contact@bengalglobaltrade.com'
    },
    {
      name: 'Horizon Impex India',
      address: '4th Floor, 8, Camac Street, Elgin, Kolkata, West Bengal 700017',
      phone: '+913340058922',
      email: 'import.export@horizonimpex.in'
    }
  ]
};

interface IndianReferenceHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  purpose: 'Tourism' | 'Medical' | 'DoubleEntry' | 'Business';
}

export function IndianReferenceHelperModal({ isOpen, onClose, purpose }: IndianReferenceHelperModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null); // itemId-fieldKey

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const items = REFERECE_DATA[purpose] || [];

  const handleCopy = (text: string, fieldId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedText(null);
      setCopiedField(null);
    }, 1500);
  };

  const handleMouseUpCopy = (fieldId: string) => {
    const selectedText = window.getSelection()?.toString() || '';
    if (selectedText.trim().length > 0) {
      navigator.clipboard.writeText(selectedText);
      setCopiedText(selectedText);
      setCopiedField(fieldId);
      setTimeout(() => {
        setCopiedText(null);
        setCopiedField(null);
      }, 1500);
    }
  };

  const getTitle = () => {
    switch (purpose) {
      case 'Tourism':
        return 'Kolkata Hotels List (Tourism Reference)';
      case 'Medical':
        return 'Indian Hospitals List (Medical Reference)';
      case 'DoubleEntry':
        return 'Delhi Hotels List (Double Entry Reference)';
      case 'Business':
        return 'Kolkata Businesses List (Business Reference)';
      default:
        return 'Indian Reference Helper';
    }
  };

  const getIcon = () => {
    switch (purpose) {
      case 'Medical':
        return <Landmark className="w-5 h-5 text-rose-500 animate-pulse" />;
      case 'Business':
        return <Building className="w-5 h-5 text-teal-500" />;
      default:
        return <Hotel className="w-5 h-5 text-amber-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-black/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-lg">
                {getIcon()}
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-zinc-100">
                  {getTitle()}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  Double-click field or Select text to copy index data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Toast Notification inside modal */}
          <AnimatePresence>
            {copiedText && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 dark:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-xs py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 border border-emerald-500"
              >
                <Check className="w-3.5 h-3.5 font-black" />
                <span>Copied! ({copiedText.length > 25 ? copiedText.slice(0, 25) + '...' : copiedText})</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans bg-slate-50/20 dark:bg-black/5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 p-4 rounded-xl hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Item Serial Index */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                      <span className="text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-500 px-1.5 py-0.5 rounded">
                        Index: {index + 1 < 10 ? '0' + (index + 1) : index + 1}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">
                        {purpose === 'Medical' ? 'Hospital' : purpose === 'Business' ? 'Business' : 'Hotel'}
                      </span>
                    </div>

                    {/* Copyable Fields */}
                    <div className="space-y-2.5 text-left">
                      {/* Name Field */}
                      <div className="group/field relative">
                        <label className="block text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                          Name (Double-click to copy)
                        </label>
                        <div
                          className={`px-2 py-1 text-xs font-semibold rounded bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/40 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900 transition-all duration-150 min-h-[24px] select-text break-words ${
                            copiedField === `${index}-name` ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                          }`}
                          onDoubleClick={() => handleCopy(item.name, `${index}-name`)}
                          onMouseUp={() => handleMouseUpCopy(`${index}-name`)}
                        >
                          {item.name}
                        </div>
                      </div>

                      {/* Address Field */}
                      <div className="group/field relative">
                        <label className="block text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                          Address (Double-click to copy)
                        </label>
                        <div
                          className={`px-2 py-1 text-[11px] font-medium rounded bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/40 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900 transition-all duration-150 min-h-[36px] select-text break-words ${
                            copiedField === `${index}-address` ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                          }`}
                          onDoubleClick={() => handleCopy(item.address, `${index}-address`)}
                          onMouseUp={() => handleMouseUpCopy(`${index}-address`)}
                        >
                          {item.address}
                        </div>
                      </div>

                      {/* Phone Field */}
                      <div className="group/field relative">
                        <label className="block text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                          Phone (Double-click to copy)
                        </label>
                        <div
                          className={`px-2 py-1 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 rounded bg-indigo-50/20 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-950/40 cursor-pointer hover:bg-indigo-100/30 dark:hover:bg-indigo-950/40 transition-all duration-150 min-h-[24px] select-text ${
                            copiedField === `${index}-phone` ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                          }`}
                          onDoubleClick={() => handleCopy(item.phone, `${index}-phone`)}
                          onMouseUp={() => handleMouseUpCopy(`${index}-phone`)}
                        >
                          {item.phone}
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="group/field relative">
                        <label className="block text-[8px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                          Email (Double-click to copy)
                        </label>
                        <div
                          className={`px-2 py-1 text-[11px] font-mono text-slate-600 dark:text-zinc-300 rounded bg-slate-50/50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/40 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900 transition-all duration-150 min-h-[24px] select-text break-all ${
                            copiedField === `${index}-email` ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                          }`}
                          onDoubleClick={() => handleCopy(item.email, `${index}-email`)}
                          onMouseUp={() => handleMouseUpCopy(`${index}-email`)}
                        >
                          {item.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase">
                      Serial #{index + 1 < 10 ? '0' + (index + 1) : index + 1}
                    </span>
                    <button
                      onClick={() => handleCopy(`${item.name}\n${item.address}\nPhone: ${item.phone}\nEmail: ${item.email}`, `${index}-all`)}
                      className="text-[9px] font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copy All Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/30 dark:bg-black/10 flex justify-end">
            <button
              onClick={onClose}
              className="slide-btn slide-btn-slate px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Close Helper
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
