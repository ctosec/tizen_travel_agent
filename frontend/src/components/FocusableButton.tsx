import { type ReactNode, useEffect } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { scrollIntoViewSafe } from '../utils/scrollIntoViewSafe';

interface FocusableButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  focusKey?: string;
  className?: string;
  focusedClassName?: string;
  disabledClassName?: string;
}

export default function FocusableButton({
  children,
  onClick,
  disabled = false,
  focusKey,
  className = '',
  focusedClassName = '',
  disabledClassName = '',
}: FocusableButtonProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => {
      if (!disabled && onClick) onClick();
    },
  });

  useEffect(() => {
    if (focused && ref.current) {
      scrollIntoViewSafe(ref.current);
    }
  }, [focused, ref]);

  const cn = [
    className,
    focused && !disabled ? focusedClassName : '',
    disabled ? disabledClassName : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={`inline-flex ${cn}`}
      onClick={() => { if (!disabled && onClick) onClick(); }}
    >
      {children}
    </div>
  );
}
