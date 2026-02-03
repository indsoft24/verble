import { useEffect } from 'react';

/**
 * Security Protection: keyboard shortcut blocking only.
 * Prevents F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S, Ctrl+P from opening dev tools or common actions.
 * No overlay or DevTools detection.
 */
export default function SecurityProtection() {
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

  useEffect(() => {
    if (!isProduction) return;

    // Remove any existing overlay from previous implementation
    const overlay = document.getElementById('security-overlay');
    if (overlay) overlay.remove();

    const blockShortcuts = (e: KeyboardEvent) => {
      // F12 (DevTools)
      if (e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+C (Inspect)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+K (Firefox Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+S (Save)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', blockShortcuts, { capture: true });
    return () => document.removeEventListener('keydown', blockShortcuts, { capture: true });
  }, [isProduction]);

  return null;
}
