import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Pencil, X } from 'lucide-react';

interface DataFieldProps {
  label: string;
  value: string;
  highlight?: boolean;
  onValueChange?: (newValue: string) => void;
}

export function DataField({ label, value, highlight = false, onValueChange }: DataFieldProps) {
  const [copied, setCopied] = useState(false);
  const [persistentCopied, setPersistentCopied] = useState(() => {
    if (typeof window !== 'undefined') {
      const fieldKey = `${label}_${value}`;
      (window as any).__copiedFields = (window as any).__copiedFields || [];
      return (window as any).__copiedFields.includes(fieldKey);
    }
    return false;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Sync state if parent value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end of text
      const len = editValue.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 8000);

    if (typeof window !== 'undefined') {
      const fieldKey = `${label}_${value}`;
      (window as any).__copiedFields = (window as any).__copiedFields || [];
      if (!(window as any).__copiedFields.includes(fieldKey)) {
        (window as any).__copiedFields.push(fieldKey);
      }
      setPersistentCopied(true);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(value || '');
    setIsEditing(true);
  };

  const handleSave = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = editValue.trim();
    if (onValueChange) {
      onValueChange(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // For textareas, Enter shifts line, unless it's a single line or we want auto-save
      const isTextArea = label.toUpperCase().includes('ADDRESS') || value.length > 40;
      if (!isTextArea) {
        e.preventDefault();
        handleSave();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const isTextArea = label.toUpperCase().includes('ADDRESS') || (value && value.length > 40);
  const hasValidationError = (value && value.includes("Verification Required"));
  const errorMessage = "Verification Required: Details are unverified.";

  return (
    <div className="flex flex-col group/field">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">{label}</span>
        {onValueChange && !isEditing && value && (
          <span className="text-[10px] text-blue-500 font-medium opacity-0 group-hover/field:opacity-100 transition-opacity whitespace-nowrap hidden sm:inline">
            Editable field
          </span>
        )}
      </div>

      <div className={`
        relative rounded-lg text-sm font-medium border transition-all duration-300 flex items-stretch overflow-hidden min-h-[40px]
        ${copied || persistentCopied
          ? 'bg-green-100/90 dark:bg-orange-950/40 border-green-500 dark:border-orange-500 text-green-955 dark:text-orange-200 shadow-sm font-semibold'
          : hasValidationError
            ? 'bg-rose-500/5 dark:bg-rose-500/10 border-red-500/70 dark:border-red-500/40 text-red-900 dark:text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.06)]'
            : highlight 
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100 shadow-inner' 
              : 'bg-slate-50 dark:bg-black border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100'}
        ${!value && !isEditing ? 'italic opacity-60' : ''}
      `}>
        {isEditing ? (
          <form onSubmit={handleSave} className="flex-1 flex items-stretch w-full min-w-0">
            {isTextArea ? (
              <textarea
                ref={inputRef as React.Ref<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="flex-1 w-full min-w-0 px-3.5 py-2 text-sm font-medium bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none resize-none"
              />
            ) : (
              <input
                ref={inputRef as React.Ref<HTMLInputElement>}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 w-full min-w-0 px-3.5 py-2 text-sm font-medium bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none"
              />
            )}
            
            <div className="flex items-center gap-1.5 px-2 bg-slate-100/90 dark:bg-zinc-800/90 border-l border-slate-200 dark:border-zinc-700 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer shrink-0"
                title="Save changes"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded bg-slate-300 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-400 dark:hover:bg-zinc-600 transition-colors cursor-pointer shrink-0"
                title="Cancel edit"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex items-start justify-between gap-2 p-3 w-full min-w-0">
            <span className={`break-all whitespace-normal text-left flex-1 min-w-0 w-full ${hasValidationError ? 'text-red-800 dark:text-red-400 font-semibold' : ''}`} title={value || ''}>
              {value || 'Not Found'}
            </span>
            
            <div className="flex items-center gap-1 self-start shrink-0">
              {onValueChange && (
                <button
                  onClick={handleStartEdit}
                  className="p-1.5 rounded-md transition-all text-slate-400 opacity-100 sm:opacity-0 group-hover/field:opacity-100 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40"
                  title="Edit Field"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {value && (
                <button
                  onClick={handleCopy}
                  className={`
                    p-1.5 rounded-md transition-all
                    ${copied || persistentCopied
                      ? 'text-emerald-700 bg-emerald-100/50 dark:text-orange-350 dark:bg-orange-950/40' 
                      : 'text-slate-400 opacity-100 sm:opacity-0 group-hover/field:opacity-100 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-zinc-300 dark:hover:bg-zinc-800'}
                  `}
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {hasValidationError && value && (
        <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 animate-pulse">
          ⚠️ {errorMessage}
        </span>
      )}
    </div>
  );
}
