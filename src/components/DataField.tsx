import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Pencil, X } from 'lucide-react';

interface DataFieldProps {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
  onValueChange?: (newValue: string) => void;
}

export function DataField({ label, value, highlight = false, warning = false, onValueChange }: DataFieldProps) {
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
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">{label}</span>
        {onValueChange && !isEditing && value && (
          <span className="text-[9px] text-blue-500 font-semibold opacity-0 group-hover/field:opacity-100 transition-opacity whitespace-nowrap hidden sm:inline-flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> Editable field
          </span>
        )}
      </div>

      <div className={`
        relative rounded-xl text-sm font-medium border transition-all duration-300 flex items-stretch overflow-hidden min-h-[38px] shadow-sm hover:shadow-md
        ${copied || persistentCopied
          ? 'bg-emerald-500/10 dark:bg-emerald-550/10 border-emerald-500 dark:border-emerald-500 text-emerald-950 dark:text-emerald-250 ring-1 ring-emerald-500/20'
          : warning
            ? 'bg-rose-500/5 dark:bg-rose-950/20 border-red-500 dark:border-red-400 text-red-950 dark:text-red-200'
            : hasValidationError
              ? 'bg-rose-500/5 dark:bg-rose-500/10 border-red-500/70 dark:border-red-500/40 text-red-900 dark:text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.06)]'
              : highlight 
                ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-250 dark:border-blue-900/40 text-blue-950 dark:text-blue-150 ring-1 ring-blue-500/5' 
                : 'bg-white dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 text-slate-800 dark:text-zinc-100'}
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
                className="flex-1 w-full min-w-0 px-3 py-2 text-xs sm:text-sm font-medium bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none resize-none"
              />
            ) : (
              <input
                ref={inputRef as React.Ref<HTMLInputElement>}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 w-full min-w-0 px-3 py-1 text-xs sm:text-sm font-medium bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none"
              />
            )}
            
            <div className="flex items-center gap-1.5 px-3 bg-slate-50 dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-850 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                title="Save changes"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-305 dark:hover:bg-zinc-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                title="Cancel edit"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2 w-full min-w-0">
            <span className={`break-all whitespace-normal text-left flex-1 min-w-0 w-full text-xs sm:text-sm ${hasValidationError ? 'text-red-800 dark:text-red-400 font-semibold' : 'font-semibold text-slate-750 dark:text-zinc-200'}`} title={value || ''}>
              {value || 'Not Found'}
            </span>
            
            <div className="flex items-center gap-1.5 self-center shrink-0">
              {onValueChange && (
                <button
                  onClick={handleStartEdit}
                  className="p-1.5 rounded-lg transition-all text-slate-400 opacity-100 sm:opacity-0 group-hover/field:opacity-100 hover:text-blue-650 hover:bg-blue-50/80 dark:hover:text-blue-400 dark:hover:bg-blue-950/40"
                  title="Edit Field"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {value && (
                <button
                  onClick={handleCopy}
                  className={`
                    p-1.5 rounded-lg transition-all
                    ${copied || persistentCopied
                      ? 'text-emerald-700 bg-emerald-100/50 dark:text-orange-350 dark:bg-orange-950/40' 
                      : 'text-slate-400 opacity-100 sm:opacity-0 group-hover/field:opacity-100 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-zinc-300 dark:hover:bg-zinc-800'}
                  `}
                  title="Copy"
                >
                  {copied ? <Check className="w-3.5 h-3.5 animate-bounce" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {hasValidationError && value && (
        <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 animate-pulse px-0.5">
          ⚠️ {errorMessage}
        </span>
      )}
    </div>
  );
}
