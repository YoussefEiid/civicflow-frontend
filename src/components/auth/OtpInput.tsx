import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  label?: string;
}

/**
 * Segmented OTP input with 6 separate digit boxes.
 * - Auto-focus: typing jumps to the next empty box.
 * - Auto-paste: pasting a full code anywhere distributes it from the first box.
 * - Backspace / arrow-key navigation between boxes.
 */
export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  isLoading = false,
  autoFocus = false,
  className,
  inputClassName,
  label
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const didInitialFocus = useRef(false);

  const digits = useMemo(() => {
    const chars = value.slice(0, length).split('');
    return Array.from({ length }, (_, i) => chars[i] ?? '');
  }, [value, length]);

  const allFilled = digits.every((d) => d.length === 1);

  const focusIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(length - 1, index));
      const el = inputRefs.current[clamped];
      if (el) {
        el.focus();
        el.select();
      }
    },
    [length]
  );

  const commitValue = useCallback(
    (nextValue: string, focusAt: number | null, shouldComplete: boolean) => {
      onChange(nextValue);
      if (focusAt !== null) {
        focusIndex(focusAt);
      }
      if (shouldComplete) {
        onComplete?.(nextValue);
      }
    },
    [onChange, onComplete, focusIndex]
  );

  const handleTypeDigit = useCallback(
    (index: number, digit: string) => {
      const next = value.slice(0, length).split('');
      next[index] = digit;
      const nextValue = next.join('');
      const shouldComplete = nextValue.length === length;
      commitValue(nextValue, index < length - 1 ? index + 1 : index, shouldComplete);
    },
    [value, length, commitValue]
  );

  const handlePasteCode = useCallback(
    (pastedDigits: string) => {
      const clean = pastedDigits.replace(/\D/g, '').slice(0, length);
      if (!clean) return;

      const next = Array.from({ length }, (_, i) => clean[i] ?? '');
      const nextValue = next.join('');
      const lastFilled = Math.min(clean.length - 1, length - 1);
      commitValue(nextValue, lastFilled, clean.length === length);
    },
    [length, commitValue]
  );

  const handleClearDigit = useCallback(
    (index: number) => {
      const next = value.slice(0, length).split('');
      next[index] = '';
      onChange(next.join(''));
      focusIndex(index);
    },
    [value, length, onChange, focusIndex]
  );

  const handleChange = (index: number, raw: string) => {
    if (disabled || isLoading) return;

    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      // Pasting a multi-digit value into a single box
      handlePasteCode(digitsOnly);
      return;
    }
    if (digitsOnly.length === 1) {
      handleTypeDigit(index, digitsOnly);
      return;
    }
    // Empty change event — allow backspace/clear semantics via keydown
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isLoading) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        handleClearDigit(index);
      } else if (index > 0) {
        handleClearDigit(index - 1);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusIndex(index + 1);
      return;
    }

    // Reject non-digit printable keys before the browser handles them
    if (e.key.length === 1 && !/^\d$/.test(e.key) && e.key !== ' ') {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    handlePasteCode(e.clipboardData.getData('text'));
  };

  // Initial focus: first empty box (or first box when all filled)
  useEffect(() => {
    if (!autoFocus || didInitialFocus.current) return;
    didInitialFocus.current = true;
    const firstEmpty = digits.findIndex((d) => d === '');
    focusIndex(firstEmpty === -1 ? 0 : firstEmpty);
  }, [autoFocus, digits, focusIndex]);

  return (
    <div className={twMerge('w-full', className)}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5 text-right">
          {label}
        </label>
      )}
      <div dir="ltr" className="flex items-center justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            disabled={disabled || isLoading}
            aria-label={`الرقم ${index + 1} من ${length}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={twMerge(
              clsx(
                'w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 text-center font-mono text-xl sm:text-2xl font-bold text-slate-900 bg-white outline-none transition-all select-none',
                'placeholder-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed',
                error
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                  : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100',
                inputClassName
              )
            )}
          />
        ))}
      </div>

      {isLoading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          جاري التحقق من الرمز...
        </div>
      )}
    </div>
  );
};

export default OtpInput;