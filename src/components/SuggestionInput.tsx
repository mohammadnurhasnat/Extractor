import React, { useState, useRef, useEffect } from 'react';
import { History, Check } from 'lucide-react';

interface SuggestionInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  suggestions: string[];
  onAddSuggestion: (val: string) => void;
  className?: string;
}

export function SuggestionInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions,
  onAddSuggestion,
  className = ''
}: SuggestionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter existing list based on current typed value
  const query = value.trim();
  const filtered = suggestions.filter(item => {
    if (!query) return true; // show all when empty but focused
    return item.toLowerCase().includes(query.toLowerCase());
  });

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Automatically save current non-empty value on outside click / blur
        if (value.trim().length >= 3) {
          onAddSuggestion(value);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [value, onAddSuggestion]);

  const handleBlur = () => {
    // Standard timeout to allow list selection to click first if not handled by onMouseDown
    setTimeout(() => {
      if (value.trim().length >= 3) {
        onAddSuggestion(value);
      }
    }, 200);
  };

  const selectItem = (item: string) => {
    onChange(item);
    onAddSuggestion(item);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans ${className}`}
        autoComplete="off"
      />
      
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-900 animate-in fade-in duration-100">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1 bg-slate-50 dark:bg-zinc-900/40">
            <History className="w-3 h-3" /> Previous / Suggestion Matches
          </div>
          {filtered.map((item, index) => {
            const isSelected = item.toLowerCase() === value.trim().toLowerCase();
            return (
              <button
                key={index}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevents input blur before selection
                  selectItem(item);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-sans transition-colors flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white ${
                  isSelected 
                    ? 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-semibold' 
                    : 'text-slate-650 dark:text-zinc-350'
                }`}
              >
                <span className="truncate pr-2">{item}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
