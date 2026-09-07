import { useEffect, useRef } from 'react';

interface UseBarcodeListenerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minChars?: number;
  maxIntervalMs?: number;
}

/**
 * Reusable hook to capture hardware USB/Bluetooth barcode scanner inputs seamlessly
 */
export function useBarcodeListener({
  onScan,
  enabled = true,
  minChars = 3,
  maxIntervalMs = 60,
}: UseBarcodeListenerOptions) {
  const bufferRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      const interval = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Enter key typically marks the end of a hardware barcode scan
      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedCode.length >= minChars) {
          // If active element is a standard input or textarea and wasn't typing manually
          onScan(scannedCode);
        }
        return;
      }

      // If interval between keystrokes is too long, reset buffer (user is likely manually typing)
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Only accumulate printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onScan, minChars, maxIntervalMs]);
}
