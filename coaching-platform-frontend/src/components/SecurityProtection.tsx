import { useEffect } from 'react';

/**
 * Security Protection Component
 * Disables developer tools, debugging, and prevents inspection
 */
export default function SecurityProtection() {
  // Check if in production mode - if not, don't render anything
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  // Early return if not in production - also remove any existing overlay
  useEffect(() => {
    if (!isProduction) {
      // Remove overlay if it exists in development
      const overlay = document.getElementById('security-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }, [isProduction]);

  if (!isProduction) {
    return null;
  }

  // Create overlay element first (before other useEffects)
  useEffect(() => {
    // Create overlay element if it doesn't exist
    let overlay = document.getElementById('security-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'security-overlay';
      overlay.innerHTML = `
        <div>
          <h1>🚫 Developer Tools Disabled</h1>
          <p>Developer tools and debugging are not allowed on this site.</p>
          <p>Please close the developer tools to continue.</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  }, []);

  useEffect(() => {
    // Check if in production mode (also enable for preview mode)
    const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

    // Get or create Security Overlay Element
    let overlay = document.getElementById('security-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'security-overlay';
      overlay.innerHTML = `
        <div>
          <h1>🚫 Developer Tools Disabled</h1>
          <p>Developer tools and debugging are not allowed on this site.</p>
          <p>Please close the developer tools to continue.</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    
    const showOverlay = () => {
      const overlayElement = document.getElementById('security-overlay');
      if (overlayElement) {
        overlayElement.style.display = 'flex';
        overlayElement.style.zIndex = '999999';
        overlayElement.style.position = 'fixed';
        overlayElement.style.top = '0';
        overlayElement.style.left = '0';
        overlayElement.style.width = '100%';
        overlayElement.style.height = '100%';
      }
    };

    const hideOverlay = () => {
      const overlayElement = document.getElementById('security-overlay');
      if (overlayElement) {
        overlayElement.style.display = 'none';
      }
    };

    // Disable right-click context menu
    const disableRightClick = (e: MouseEvent) => {
      if (isProduction) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Disable text selection (except in inputs and textareas)
    const disableSelect = (e: Event) => {
      if (isProduction) {
        const target = e.target as HTMLElement;
        if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          return false;
        }
      }
    };

    // Disable copy, cut, paste (except in inputs)
    const disableCopy = (e: ClipboardEvent) => {
      if (isProduction) {
        const target = e.target as HTMLElement;
        if (target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          return false;
        }
      }
    };

    // Disable keyboard shortcuts for DevTools
    const disableDevTools = (e: KeyboardEvent) => {
      if (isProduction) {
        // F12
        if (e.keyCode === 123) {
          e.preventDefault();
          e.stopPropagation();
          showOverlay();
          return false;
        }

        // Ctrl+Shift+I (Chrome/Firefox DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
          e.preventDefault();
          e.stopPropagation();
          showOverlay();
          return false;
        }

        // Ctrl+Shift+J (Chrome Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
          e.preventDefault();
          e.stopPropagation();
          showOverlay();
          return false;
        }

        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
          e.preventDefault();
          e.stopPropagation();
          showOverlay();
          return false;
        }

        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        // Ctrl+S (Save Page)
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

        // Ctrl+Shift+K (Firefox Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
          e.preventDefault();
          e.stopPropagation();
          showOverlay();
          return false;
        }
      }
    };

    // Detect DevTools opening
    let devToolsOpen = false;
    let baselineInnerWidth = window.innerWidth;
    let baselineInnerHeight = window.innerHeight;
    let baselineSet = false;
    
    // Set baseline after page is fully loaded (to avoid false positives)
    const setBaseline = () => {
      if (!baselineSet) {
        baselineInnerWidth = window.innerWidth;
        baselineInnerHeight = window.innerHeight;
        baselineSet = true;
      }
    };
    
    // Set baseline after a delay to ensure page is loaded
    setTimeout(setBaseline, 1000);
    
    const detectDevTools = () => {
      // Only enable detection in production mode
      if (!isProduction) return;
      
      try {
        // Set baseline if not set yet
        if (!baselineSet && window.innerWidth > 0 && window.innerHeight > 0) {
          baselineInnerWidth = window.innerWidth;
          baselineInnerHeight = window.innerHeight;
          baselineSet = true;
        }
        
        // Method 1: Compare current size to baseline (detects DevTools opened via menu)
        // DevTools typically reduces innerWidth or innerHeight by 200-800px
        const widthReduction = baselineInnerWidth - window.innerWidth;
        const heightReduction = baselineInnerHeight - window.innerHeight;
        const baselineDetected = (widthReduction > 150 && widthReduction < baselineInnerWidth * 0.8) || 
                                 (heightReduction > 150 && heightReduction < baselineInnerHeight * 0.8);

        // Method 2: Window size difference (for docked DevTools)
        const threshold = 150; // Threshold for outer vs inner difference
        const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
        const heightDiff = Math.abs(window.outerHeight - window.innerHeight);
        const sizeDetected = widthDiff > threshold || heightDiff > threshold;

        // Method 3: Check if inner dimensions are significantly smaller than screen
        // Only if window hasn't been resized (outerWidth/Height similar to baseline)
        const screenWidthDiff = screen.width - window.innerWidth;
        const screenHeightDiff = screen.height - window.innerHeight;
        const outerWidthSimilar = Math.abs(window.outerWidth - baselineInnerWidth) < 50;
        const outerHeightSimilar = Math.abs(window.outerHeight - baselineInnerHeight) < 50;
        const screenDetected = (outerWidthSimilar && screenWidthDiff > 200 && screenWidthDiff < screen.width * 0.85) || 
                               (outerHeightSimilar && screenHeightDiff > 200 && screenHeightDiff < screen.height * 0.85);

        const isOpen = baselineDetected || sizeDetected || screenDetected;

        if (isOpen && !devToolsOpen) {
          devToolsOpen = true;
          
          // Debug log (remove in production)
          if (!isProduction) {
            console.log('DevTools detected, showing overlay', {
              baselineInnerWidth,
              baselineInnerHeight,
              currentInnerWidth: window.innerWidth,
              currentInnerHeight: window.innerHeight,
              widthReduction,
              heightReduction,
              widthDiff,
              heightDiff,
              baselineDetected,
              sizeDetected,
              screenDetected
            });
          }
          showOverlay();
          
          // Show warning in console
          try {
            console.clear();
            console.log('%c🚫 WARNING 🚫', 'color: red; font-size: 50px; font-weight: bold;');
            console.log('%cDeveloper tools are disabled on this site.', 'color: red; font-size: 20px;');
            console.log('%cPlease close the developer tools to continue.', 'color: red; font-size: 16px;');
          } catch (e) {
            // Console might be blocked, that's fine
          }
        } else if (!isOpen && devToolsOpen) {
          devToolsOpen = false;
          hideOverlay();
        }
      } catch (error) {
        // Silently handle any errors in detection
        console.error('DevTools detection error:', error);
      }
    };

    // Disable console methods in production
    if (isProduction) {
      const noop = () => {};
      const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'clear', 'count', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace'];
      
      methods.forEach(method => {
        try {
          (console as any)[method] = noop;
        } catch (e) {
          // Ignore errors
        }
      });

      // Override console with proxy
      const originalConsole = window.console;
      window.console = new Proxy(originalConsole, {
        get(target, prop) {
          if (methods.includes(prop as string)) {
            return noop;
          }
          return target[prop as keyof Console];
        }
      });
    }

    // Add event listeners
    document.addEventListener('contextmenu', disableRightClick, { capture: true });
    document.addEventListener('selectstart', disableSelect, { capture: true });
    document.addEventListener('copy', disableCopy, { capture: true });
    document.addEventListener('cut', disableCopy, { capture: true });
    document.addEventListener('paste', disableCopy, { capture: true });
    document.addEventListener('keydown', disableDevTools, { capture: true });

    // Listen for window resize (DevTools opening/closing changes window size)
    const handleResize = () => {
      // Don't update baseline on resize if DevTools is already open (user might be resizing window)
      if (!devToolsOpen) {
        // Small delay to see if it's a window resize or DevTools open
        clearTimeout((window as any).devtoolsResizeTimeout);
        (window as any).devtoolsResizeTimeout = setTimeout(() => {
          detectDevTools();
          // Update baseline if window was legitimately resized (not DevTools)
          if (!devToolsOpen && baselineSet) {
            const currentReduction = baselineInnerWidth - window.innerWidth;
            const heightReduction = baselineInnerHeight - window.innerHeight;
            // Only update baseline if change is small (window resize, not DevTools)
            if (Math.abs(currentReduction) < 100 && Math.abs(heightReduction) < 100) {
              baselineInnerWidth = window.innerWidth;
              baselineInnerHeight = window.innerHeight;
            }
          }
        }, 100);
      } else {
        // If DevTools was open, check if it's closed now
        detectDevTools();
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Detect DevTools periodically (check frequently for better detection)
    // Check every 200ms (balance between responsiveness and performance)
    const devToolsInterval = setInterval(detectDevTools, 200);
    
    // Run detection after initial render (don't run immediately to avoid false positives)
    setTimeout(detectDevTools, 300);

    // Additional protection: Block DevTools APIs
    if (isProduction) {
      try {
        Object.defineProperty(window, 'devtools', {
          get: () => ({ open: false, orientation: null }),
          set: () => {},
          configurable: false
        });
      } catch (e) {
        // Property might already be defined
      }
    }

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', disableRightClick, { capture: true });
      document.removeEventListener('selectstart', disableSelect, { capture: true });
      document.removeEventListener('copy', disableCopy, { capture: true });
      document.removeEventListener('cut', disableCopy, { capture: true });
      document.removeEventListener('paste', disableCopy, { capture: true });
      document.removeEventListener('keydown', disableDevTools, { capture: true });
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearInterval(devToolsInterval);
      clearTimeout((window as any).devtoolsResizeTimeout);
      hideOverlay();
    };
  }, []);

  return null; // This component doesn't render anything
}

