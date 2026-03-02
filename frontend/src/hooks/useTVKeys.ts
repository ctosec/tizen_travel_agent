import { useEffect } from 'react';

interface TVKeyHandlers {
  onBack?: () => void;
}

export function useTVKeys({ onBack }: TVKeyHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'XF86Back') {
        e.preventDefault();
        onBack?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);
}
