import { useRef, useEffect, useState, useCallback } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { scrollIntoViewSafe } from '../utils/scrollIntoViewSafe';

interface FocusableInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  focusKey?: string;
  maxLength?: number;
  filter?: (v: string) => string;
}

function isTypingKey(key: string): boolean {
  return key.length === 1 && /[a-zA-Z0-9 @.\-_+]/.test(key);
}

export default function FocusableInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  focusKey,
  maxLength,
  filter,
}: FocusableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  const enterEditing = useCallback(() => {
    inputRef.current?.focus();
    setEditing(true);
  }, []);

  const exitEditing = useCallback(() => {
    inputRef.current?.blur();
    setEditing(false);
  }, []);

  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => {
      if (editing) exitEditing();
      else enterEditing();
    },
    onArrowPress: (direction: string) => {
      if (editing) {
        if (direction === 'up' || direction === 'down') {
          exitEditing();
          return true;
        }
        return false;
      }
      return true;
    },
  });

  useEffect(() => {
    if (!focused || editing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingKey(e.key)) {
        e.preventDefault();
        enterEditing();
        let newVal = value + e.key;
        if (filter) newVal = filter(newVal);
        if (maxLength && newVal.length > maxLength) return;
        onChange(newVal);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focused, editing, value, onChange, filter, maxLength, enterEditing]);

  useEffect(() => {
    if (focused) {
      scrollIntoViewSafe(ref.current);
    } else {
      exitEditing();
    }
  }, [focused, ref, exitEditing]);

  const borderColor = editing
    ? 'border-amber-400'
    : focused
    ? 'border-purple-400 ring-2 ring-purple-400'
    : 'border-white/20';

  return (
    <div ref={ref} className="flex flex-col gap-2">
      {label && <label className="text-sm text-indigo-300 font-medium">{label}</label>}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => {
          let v = e.target.value;
          if (filter) v = filter(v);
          onChange(v);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.keyCode === 10009) {
            e.preventDefault();
            exitEditing();
            return;
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            exitEditing();
            return;
          }
        }}
        onBlur={() => setEditing(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        tabIndex={-1}
        className={`h-[52px] text-lg bg-white/5 border-2 ${borderColor} rounded-xl text-white px-4 outline-none transition-all w-full`}
      />
    </div>
  );
}
