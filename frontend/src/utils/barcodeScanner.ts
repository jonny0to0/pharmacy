/**
 * Barcode Scanner Utility
 * Handles buffered keyboard input to identify barcode scans.
 */

export interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  scanDelay?: number;
  minLength?: number;
}

export const setupBarcodeScanner = (options: BarcodeScannerOptions) => {
  const { onScan, scanDelay = 50, minLength = 6 } = options;
  
  let buffer = '';
  let timeout: NodeJS.Timeout | null = null;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore modifier keys
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    
    // Ignore non-character keys (except for barcode finishers if any, but usually just Enter)
    if (e.key.length > 1 && e.key !== 'Enter') return;

    if (timeout) clearTimeout(timeout);

    if (e.key === 'Enter') {
      if (buffer.length >= minLength) {
        onScan(buffer);
      }
      buffer = '';
      return;
    }

    buffer += e.key;

    timeout = setTimeout(() => {
      // If we stop typing for too long, clear the buffer as it's likely manual typing
      // unless it already meets the criteria and we want to auto-process without Enter
      // However, most scanners send 'Enter' at the end.
      buffer = '';
    }, scanDelay);
  };

  window.addEventListener('keydown', handleKeyDown);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    if (timeout) clearTimeout(timeout);
  };
};
