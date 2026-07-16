import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Download, Trash2, X, FileImage, FileCode, Sliders, Palette, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { HistoryItem } from '../types';
import { PAD_LAYOUT_LABELS, CARD_LAYOUT_LABELS } from '../data';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryItem[];
  onLoadItem: (item: HistoryItem) => void;
  onDownloadItemAgain: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  historyList,
  onLoadItem,
  onDownloadItemAgain,
  onClearHistory,
  onDeleteItem,
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const formatTypeLabel = (type: string) => {
    switch (type) {
      case 'pad-pdf': return 'Letterhead PDF';
      case 'card-pdf': return 'Business Card PDF';
      case 'pad-png': return 'Letterhead PNG';
      case 'card-png': return 'Business Card PNG';
      case 'pad-svg': return 'Letterhead Vector (SVG)';
      case 'card-svg': return 'Business Card Vector (SVG)';
      case 'vector-ai': return 'Illustrator Vector (.AI)';
      case 'photoshop-psd': return 'Photoshop Container (.PSD)';
      default: return 'Exported Asset';
    }
  };

  const getFormatBadgeColor = (type: string) => {
    switch (type) {
      case 'pad-pdf':
      case 'card-pdf':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pad-png':
      case 'card-png':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pad-svg':
      case 'card-svg':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'vector-ai':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'photoshop-psd':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 transition-opacity"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white border-l border-[#DDDEDC] shadow-[0_0_40px_rgba(0,0,0,0.15)] z-50 flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-[#DDDEDC] bg-[#FBFBFA] flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-bold text-[#1C1E22] flex items-center gap-2 m-0">
                  <span>Download History</span>
                  <span className="text-[10px] font-bold bg-[#3B4658] text-white px-1.5 py-0.5 rounded-full">
                    {historyList.length}
                  </span>
                </h2>
                <div className="text-[10px] font-mono text-[#6B7076] tracking-wider uppercase mt-1">
                  Click on a company name to expand details
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 text-[#6B7076] hover:text-[#1C1E22] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {historyList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4">
                  <h3 className="text-[13px] font-bold text-[#1C1E22]">No Downloads Yet</h3>
                </div>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="border border-[#DDDEDC] rounded-lg bg-white overflow-hidden shadow-xs"
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    >
                      <h4 className="text-[13px] font-bold text-[#1C1E22] m-0">
                        {item.data.companyName}
                      </h4>
                      {expandedItemId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    
                    <AnimatePresence>
                      {expandedItemId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 flex flex-col gap-3"
                        >
                          <div className="text-[11px] text-gray-600 space-y-1 border-t pt-2">
                             <div><strong>Timestamp:</strong> {item.timestamp}</div>
                             <div><strong>Format:</strong> {formatTypeLabel(item.type)}</div>
                             <div><strong>Design:</strong> {item.theme.name}</div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => onLoadItem(item)}
                              className="flex-1 bg-gray-100 text-gray-800 rounded py-1.5 text-[11px] font-semibold"
                            >
                              Load State
                            </button>
                            <button
                              onClick={() => onDownloadItemAgain(item)}
                              className="flex-1 bg-[#3B4658] text-white rounded py-1.5 text-[11px] font-semibold"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="bg-red-50 text-red-600 p-2 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>

            {historyList.length > 0 && (
              <div className="p-4 bg-[#FBFBFA] border-t border-[#DDDEDC] flex justify-center">
                <button
                  onClick={onClearHistory}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete All History</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
