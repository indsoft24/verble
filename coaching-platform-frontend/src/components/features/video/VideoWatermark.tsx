import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

// Horizontal sliding animation matching Android app
const slideAnimation = {
  '@keyframes slideHorizontal': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
};

interface WatermarkProps {
  text: string;
}

const VideoWatermark: React.FC<WatermarkProps> = ({ text }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const fullscreenWatermarkRef = useRef<HTMLDivElement | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // DEBUG: Enable debugging mode
    const DEBUG = true;
    
    // Enable debug panel via console: localStorage.setItem('watermark-debug', 'true')
    // Disable: localStorage.removeItem('watermark-debug')
    const showDebugPanel = typeof window !== 'undefined' && window.localStorage.getItem('watermark-debug') === 'true';
    
    const debugLog = (...args: any[]) => {
      if (DEBUG) {
        console.log('[VideoWatermark]', ...args);
        // Update debug info for visual display
        if (showDebugPanel && args.length > 0 && typeof args[0] === 'string') {
          setDebugInfo({
            message: args[0],
            data: args[1] || null,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      }
    };
    
    // Log instructions for enabling debug panel
    if (DEBUG && !showDebugPanel) {
      console.log('[VideoWatermark] Debug mode enabled. To show visual debug panel, run: localStorage.setItem("watermark-debug", "true")');
    }

    const checkFullscreen = (): boolean => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;
      
      const isFullscreen = !!fullscreenElement;
      debugLog('checkFullscreen:', {
        isFullscreen,
        fullscreenElement: fullscreenElement?.tagName,
        fullscreenElementId: fullscreenElement?.id,
        documentFullscreen: !!document.fullscreenElement,
        webkitFullscreen: !!(document as any).webkitFullscreenElement,
        mozFullscreen: !!(document as any).mozFullScreenElement,
        msFullscreen: !!(document as any).msFullscreenElement,
      });
      
      return isFullscreen;
    };

    const getFullscreenElement = () => {
      const element = (
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      ) as HTMLElement | null;
      
      debugLog('getFullscreenElement:', {
        element: element?.tagName,
        elementId: element?.id,
        elementClass: element?.className,
      });
      
      return element;
    };

    const createFullscreenWatermark = () => {
      debugLog('createFullscreenWatermark: START');
      
      // Remove any existing watermarks first
      const existing = document.querySelectorAll('.fullscreen-video-watermark, #fullscreen-video-watermark-overlay');
      debugLog('Removing existing watermarks:', existing.length);
      existing.forEach(el => {
        try {
          el.remove();
        } catch (e) {
          debugLog('Error removing existing watermark:', e);
        }
      });
      
      if (fullscreenWatermarkRef.current) {
        try {
          if (fullscreenWatermarkRef.current.parentElement) {
            fullscreenWatermarkRef.current.parentElement.removeChild(fullscreenWatermarkRef.current);
          }
        } catch (e) {
          debugLog('Error removing ref watermark:', e);
        }
      }
      fullscreenWatermarkRef.current = null;

      const fullscreenElement = getFullscreenElement();
      
      if (!fullscreenElement) {
        debugLog('createFullscreenWatermark: No fullscreen element found, aborting');
        return;
      }
      
      debugLog('createFullscreenWatermark: Fullscreen element found:', {
        tagName: fullscreenElement.tagName,
        id: fullscreenElement.id,
        className: fullscreenElement.className,
      });
      
      // Strategy 1: Try to append to the fullscreen element itself (if it's not an iframe)
      // Strategy 2: If it's an iframe, append to body with fixed positioning
      // Strategy 3: Try appending to the iframe's parent container
      
      const isIframe = fullscreenElement.tagName === 'IFRAME';
      
      // Create watermark overlay
      const fullscreenWatermark = document.createElement('div');
      fullscreenWatermark.className = 'fullscreen-video-watermark';
      fullscreenWatermark.id = 'fullscreen-video-watermark-overlay';
      fullscreenWatermark.setAttribute('data-watermark-text', text);
      
      const watermarkContainer = document.createElement('div');
      watermarkContainer.className = 'fullscreen-watermark-container';
      
      const watermarkParagraph = document.createElement('p');
      watermarkParagraph.className = 'fullscreen-watermark-text';
      watermarkParagraph.textContent = text;
      
      watermarkContainer.appendChild(watermarkParagraph);
      fullscreenWatermark.appendChild(watermarkContainer);
      
      // Try multiple strategies to ensure visibility
      let appended = false;
      
      if (!isIframe) {
        debugLog('Strategy 1: Attempting to append to fullscreen element (non-iframe)');
        // Strategy 1: Append to fullscreen element (for non-iframe fullscreen)
        try {
          fullscreenWatermark.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: transparent !important;
          `;
          
          // Ensure parent has relative positioning
          const computedStyle = window.getComputedStyle(fullscreenElement);
          if (computedStyle.position === 'static') {
            fullscreenElement.style.position = 'relative';
          }
          
          fullscreenElement.appendChild(fullscreenWatermark);
          appended = true;
          debugLog('Strategy 1: Successfully appended to fullscreen element');
        } catch (e) {
          debugLog('Strategy 1: Failed:', e);
          // Fall through to next strategy
        }
      }
      
      if (!appended || isIframe) {
        debugLog('Strategy 2: Appending to documentElement (iframe fullscreen)');
        // Strategy 2: For iframe fullscreen (Bunny Player), append to documentElement with fixed positioning
        // CRITICAL: Use setProperty with important flag to ensure styles aren't overridden
        
        // Set styles using setProperty with important flag (more reliable than cssText)
        fullscreenWatermark.setAttribute('style', ''); // Clear any existing styles
        fullscreenWatermark.style.setProperty('position', 'fixed', 'important');
        fullscreenWatermark.style.setProperty('top', '0', 'important');
        fullscreenWatermark.style.setProperty('left', '0', 'important');
        fullscreenWatermark.style.setProperty('right', '0', 'important');
        fullscreenWatermark.style.setProperty('bottom', '0', 'important');
        fullscreenWatermark.style.setProperty('width', '100vw', 'important');
        fullscreenWatermark.style.setProperty('height', '100vh', 'important');
        fullscreenWatermark.style.setProperty('pointer-events', 'none', 'important');
        fullscreenWatermark.style.setProperty('z-index', '2147483647', 'important'); // Maximum z-index
        fullscreenWatermark.style.setProperty('overflow', 'visible', 'important');
        fullscreenWatermark.style.setProperty('margin', '0', 'important');
        fullscreenWatermark.style.setProperty('padding', '0', 'important');
        fullscreenWatermark.style.setProperty('display', 'block', 'important');
        fullscreenWatermark.style.setProperty('visibility', 'visible', 'important');
        fullscreenWatermark.style.setProperty('opacity', '1', 'important');
        fullscreenWatermark.style.setProperty('background', 'transparent', 'important');
        fullscreenWatermark.style.setProperty('border', 'none', 'important');
        fullscreenWatermark.style.setProperty('box-shadow', 'none', 'important');
        fullscreenWatermark.style.setProperty('transform', 'none', 'important');
        fullscreenWatermark.style.setProperty('isolation', 'isolate', 'important');
        
        // Always append to documentElement (html) for iframe fullscreen - this ensures it's above everything
        // The iframe creates its own stacking context, so we need to be at the root document level
        try {
          // Remove any existing watermarks first from both body and documentElement
          const existingInBody = document.body.querySelectorAll('.fullscreen-video-watermark, #fullscreen-video-watermark-overlay');
          existingInBody.forEach(el => el.remove());
          const existingInDoc = document.documentElement.querySelectorAll('.fullscreen-video-watermark, #fullscreen-video-watermark-overlay');
          existingInDoc.forEach(el => el.remove());
          
          // Append to documentElement (html tag) - this is the highest level
          document.documentElement.appendChild(fullscreenWatermark);
          appended = true;
          debugLog('Strategy 2: Successfully appended to documentElement');
          
          // Also try to ensure it's the last child for maximum z-index priority
          if (document.documentElement.lastChild !== fullscreenWatermark) {
            document.documentElement.appendChild(fullscreenWatermark);
            debugLog('Strategy 2: Moved to last child of documentElement');
          }
        } catch (e) {
          debugLog('Strategy 2: documentElement append failed:', e);
          // If documentElement append fails, try body as fallback
          try {
            // Remove any existing watermarks first
            const existingInBody = document.body.querySelectorAll('.fullscreen-video-watermark, #fullscreen-video-watermark-overlay');
            existingInBody.forEach(el => el.remove());
            
            document.body.appendChild(fullscreenWatermark);
            appended = true;
            debugLog('Strategy 2: Fallback to body succeeded');
            
            // Ensure it's the last child
            if (document.body.lastChild !== fullscreenWatermark) {
              document.body.appendChild(fullscreenWatermark);
            }
          } catch (e2) {
            debugLog('Strategy 2: All append strategies failed:', e2);
            // Failed to append - watermark will be created on next check
          }
        }
      }
      
      debugLog('Watermark appended:', appended);
      
      // Set container and text styles with maximum visibility using setProperty
      // CRITICAL: Use setProperty with important flag to ensure styles aren't overridden
      watermarkContainer.setAttribute('style', '');
      watermarkContainer.style.setProperty('position', 'absolute', 'important');
      watermarkContainer.style.setProperty('top', '50%', 'important');
      watermarkContainer.style.setProperty('left', '0', 'important');
      watermarkContainer.style.setProperty('width', '100%', 'important');
      watermarkContainer.style.setProperty('min-height', '50px', 'important'); // Larger min-height
      watermarkContainer.style.setProperty('height', 'auto', 'important');
      watermarkContainer.style.setProperty('transform', 'translateY(-50%)', 'important');
      watermarkContainer.style.setProperty('overflow', 'visible', 'important');
      watermarkContainer.style.setProperty('margin', '0', 'important');
      watermarkContainer.style.setProperty('padding', '20px', 'important'); // Add padding to container
      watermarkContainer.style.setProperty('z-index', '2147483647', 'important');
      watermarkContainer.style.setProperty('pointer-events', 'none', 'important');
      watermarkContainer.style.setProperty('display', 'block', 'important');
      watermarkContainer.style.setProperty('visibility', 'visible', 'important');
      watermarkContainer.style.setProperty('color', 'rgb(255, 255, 0)', 'important'); // Yellow color
      watermarkContainer.style.setProperty('background', 'rgba(0, 255, 0, 0.2)', 'important'); // Light green background for container
      watermarkContainer.style.setProperty('border', '2px dashed rgb(0, 255, 255)', 'important'); // Cyan border for container
      
      watermarkParagraph.setAttribute('style', '');
      // VERY BOLD AND VISIBLE COLORS FOR DEBUGGING
      watermarkParagraph.style.setProperty('color', 'rgb(255, 255, 0)', 'important'); // Bright yellow text
      watermarkParagraph.style.setProperty('text-shadow', '2px 2px 4px rgba(0,0,0,1), 0px 0px 8px rgba(255,0,0,1), 0px 0px 12px rgba(255,255,0,1)', 'important'); // Red and yellow glow
      watermarkParagraph.style.setProperty('animation', 'slideHorizontal 6s linear infinite', 'important');
      watermarkParagraph.style.setProperty('text-align', 'center', 'important');
      watermarkParagraph.style.setProperty('white-space', 'nowrap', 'important');
      watermarkParagraph.style.setProperty('font-size', '28px', 'important'); // Larger font
      watermarkParagraph.style.setProperty('font-weight', '900', 'important'); // Maximum bold
      watermarkParagraph.style.setProperty('font-family', 'Arial, Helvetica, sans-serif', 'important');
      watermarkParagraph.style.setProperty('margin', '20px auto', 'important'); // More margin
      watermarkParagraph.style.setProperty('padding', '15px 25px', 'important'); // More padding
      watermarkParagraph.style.setProperty('display', 'inline-block', 'important');
      watermarkParagraph.style.setProperty('visibility', 'visible', 'important');
      watermarkParagraph.style.setProperty('opacity', '1', 'important');
      watermarkParagraph.style.setProperty('line-height', '1.5', 'important');
      watermarkParagraph.style.setProperty('letter-spacing', '1px', 'important');
      watermarkParagraph.style.setProperty('pointer-events', 'none', 'important');
      watermarkParagraph.style.setProperty('width', 'auto', 'important');
      watermarkParagraph.style.setProperty('min-width', '300px', 'important');
      watermarkParagraph.style.setProperty('height', 'auto', 'important');
      watermarkParagraph.style.setProperty('min-height', '50px', 'important');
      watermarkParagraph.style.setProperty('position', 'relative', 'important');
      watermarkParagraph.style.setProperty('background', 'rgba(255, 0, 0, 0.8)', 'important'); // Bright red background
      watermarkParagraph.style.setProperty('border-radius', '8px', 'important');
      watermarkParagraph.style.setProperty('border', '4px solid rgb(255, 255, 0)', 'important'); // Bright yellow border
      watermarkParagraph.style.setProperty('outline', '3px solid rgb(255, 0, 0)', 'important'); // Red outline
      watermarkParagraph.style.setProperty('box-shadow', '0 0 20px rgba(255, 255, 0, 1), 0 0 40px rgba(255, 0, 0, 0.8)', 'important'); // Glowing shadow
      watermarkParagraph.style.setProperty('-webkit-text-fill-color', 'rgb(255, 255, 0)', 'important'); // Yellow text
      
      // CRITICAL: Set text content - use innerHTML to ensure it's set
      const watermarkTextContent = text || 'Watermark';
      watermarkParagraph.innerHTML = '';
      watermarkParagraph.appendChild(document.createTextNode(watermarkTextContent));
      watermarkParagraph.textContent = watermarkTextContent;
      watermarkParagraph.innerText = watermarkTextContent;
      
      // Verify text is set
      if (!watermarkParagraph.textContent || watermarkParagraph.textContent.trim() === '') {
        // Fallback: create a text node directly
        const textNode = document.createTextNode(watermarkTextContent);
        watermarkParagraph.appendChild(textNode);
      }
      
      // Ensure paragraph is not empty
      if (watermarkParagraph.childNodes.length === 0) {
        watermarkParagraph.appendChild(document.createTextNode(watermarkTextContent));
      }
      
      // Append elements BEFORE setting more styles
      watermarkContainer.appendChild(watermarkParagraph);
      fullscreenWatermark.appendChild(watermarkContainer);
      
      fullscreenWatermarkRef.current = fullscreenWatermark;
      
      debugLog('Watermark created, checking DOM:', {
        inBody: document.body.contains(fullscreenWatermark),
        inDocument: document.contains(fullscreenWatermark),
        parent: fullscreenWatermark.parentElement?.tagName,
      });
      
      // Force multiple reflows to ensure rendering
      void fullscreenWatermark.offsetHeight;
      void watermarkContainer.offsetHeight;
      void watermarkParagraph.offsetHeight;
      
      // CRITICAL: Re-apply styles after appending to ensure they stick
      requestAnimationFrame(() => {
        if (fullscreenWatermarkRef.current) {
          const wm = fullscreenWatermarkRef.current;
          const container = wm.querySelector('.fullscreen-watermark-container') as HTMLElement;
          const paragraph = wm.querySelector('.fullscreen-watermark-text') as HTMLElement;
          
          debugLog('RAF: Re-applying styles', {
            watermarkExists: !!wm,
            containerExists: !!container,
            paragraphExists: !!paragraph,
            paragraphText: paragraph?.textContent,
          });
          
          // Ensure main element is visible using setProperty
          wm.style.setProperty('display', 'block', 'important');
          wm.style.setProperty('visibility', 'visible', 'important');
          wm.style.setProperty('opacity', '1', 'important');
          wm.style.setProperty('z-index', '2147483647', 'important');
          wm.style.setProperty('position', 'fixed', 'important');
          wm.style.setProperty('top', '0', 'important');
          wm.style.setProperty('left', '0', 'important');
          wm.style.setProperty('width', '100vw', 'important');
          wm.style.setProperty('height', '100vh', 'important');
          
          // Ensure container is visible with bold debugging colors
          if (container) {
            container.style.setProperty('display', 'block', 'important');
            container.style.setProperty('visibility', 'visible', 'important');
            container.style.setProperty('opacity', '1', 'important');
            container.style.setProperty('color', 'rgb(255, 255, 0)', 'important'); // Yellow
            container.style.setProperty('background', 'rgba(0, 255, 0, 0.2)', 'important'); // Light green
            container.style.setProperty('border', '2px dashed rgb(0, 255, 255)', 'important'); // Cyan border
            container.style.setProperty('padding', '20px', 'important');
          }
          
          // Ensure paragraph is visible with VERY BOLD colors for debugging
          if (paragraph) {
            paragraph.style.setProperty('display', 'inline-block', 'important');
            paragraph.style.setProperty('visibility', 'visible', 'important');
            paragraph.style.setProperty('opacity', '1', 'important');
            paragraph.style.setProperty('color', 'rgb(255, 255, 0)', 'important'); // Bright yellow
            paragraph.style.setProperty('background', 'rgba(255, 0, 0, 0.8)', 'important'); // Bright red
            paragraph.style.setProperty('border', '4px solid rgb(255, 255, 0)', 'important'); // Yellow border
            paragraph.style.setProperty('outline', '3px solid rgb(255, 0, 0)', 'important'); // Red outline
            paragraph.style.setProperty('box-shadow', '0 0 20px rgba(255, 255, 0, 1), 0 0 40px rgba(255, 0, 0, 0.8)', 'important');
            paragraph.style.setProperty('font-size', '28px', 'important');
            paragraph.style.setProperty('font-weight', '900', 'important');
            paragraph.style.setProperty('padding', '15px 25px', 'important');
            paragraph.style.setProperty('margin', '20px auto', 'important');
            if (!paragraph.textContent) {
              paragraph.textContent = text;
            }
            
            // Force reflow
            void paragraph.offsetHeight;
            
            // Check computed styles
            const computedStyle = window.getComputedStyle(paragraph);
            debugLog('RAF: Paragraph computed styles:', {
              color: computedStyle.color,
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              zIndex: computedStyle.zIndex,
              textContent: paragraph.textContent,
            });
          }
          
          // Check watermark computed styles
          const wmComputed = window.getComputedStyle(wm);
          debugLog('RAF: Watermark computed styles:', {
            position: wmComputed.position,
            zIndex: wmComputed.zIndex,
            display: wmComputed.display,
            visibility: wmComputed.visibility,
            opacity: wmComputed.opacity,
            width: wmComputed.width,
            height: wmComputed.height,
            top: wmComputed.top,
            left: wmComputed.left,
          });
        }
      });
      
      // Multiple attempts to ensure visibility at different intervals
      const ensureVisible = (attempt: number = 0) => {
        if (fullscreenWatermarkRef.current && checkFullscreen()) {
          const wm = fullscreenWatermarkRef.current;
          const inBody = document.body.contains(wm);
          const inDocument = document.contains(wm);
          
          debugLog(`ensureVisible (attempt ${attempt}):`, {
            watermarkExists: !!wm,
            inBody,
            inDocument,
            parent: wm.parentElement?.tagName,
          });
          
          wm.style.display = 'block';
          wm.style.visibility = 'visible';
          wm.style.opacity = '1';
          wm.style.zIndex = '2147483647';
          wm.style.position = 'fixed';
          wm.style.top = '0';
          wm.style.left = '0';
          wm.style.width = '100vw';
          wm.style.height = '100vh';
          
          // Ensure it's in the DOM
          if (!inBody && !inDocument) {
            debugLog(`ensureVisible (attempt ${attempt}): Re-appending to body`);
            document.body.appendChild(wm);
          }
          
          // Check paragraph visibility
          const paragraph = wm.querySelector('.fullscreen-watermark-text') as HTMLElement;
          if (paragraph) {
            const pComputed = window.getComputedStyle(paragraph);
            debugLog(`ensureVisible (attempt ${attempt}): Paragraph state:`, {
              textContent: paragraph.textContent,
              color: pComputed.color,
              display: pComputed.display,
              visibility: pComputed.visibility,
              opacity: pComputed.opacity,
            });
          }
        } else {
          debugLog(`ensureVisible (attempt ${attempt}): Watermark not found or not fullscreen`);
        }
      };
      
      // Immediate and delayed checks
      ensureVisible(0);
      setTimeout(() => ensureVisible(1), 10);
      setTimeout(() => ensureVisible(2), 50);
      setTimeout(() => ensureVisible(3), 100);
      setTimeout(() => ensureVisible(4), 200);
      setTimeout(() => ensureVisible(5), 500);
      setTimeout(() => ensureVisible(6), 1000);
      
      debugLog('createFullscreenWatermark: END');
    };

    const removeFullscreenWatermark = () => {
      if (fullscreenWatermarkRef.current) {
        // Check both body and documentElement
        if (document.body.contains(fullscreenWatermarkRef.current)) {
          fullscreenWatermarkRef.current.remove();
        } else if (document.documentElement.contains(fullscreenWatermarkRef.current)) {
          fullscreenWatermarkRef.current.remove();
        } else {
          // Try to remove from parent if it exists
          const parent = fullscreenWatermarkRef.current.parentElement;
          if (parent && parent.contains(fullscreenWatermarkRef.current)) {
            fullscreenWatermarkRef.current.remove();
          }
        }
        fullscreenWatermarkRef.current = null;
      }
      // Remove any orphaned watermarks from both body and documentElement
      const orphanedWatermarks = document.querySelectorAll('.fullscreen-video-watermark, #fullscreen-video-watermark-overlay');
      orphanedWatermarks.forEach(wm => {
        try {
          wm.remove();
        } catch (e) {
          // Ignore errors
        }
      });
    };

    // Continuous check for fullscreen (handles iframe fullscreen)
    const continuousCheck = () => {
      const currentlyFullscreen = checkFullscreen();
      const hasWatermark = fullscreenWatermarkRef.current && 
        (document.body.contains(fullscreenWatermarkRef.current) || 
         document.documentElement.contains(fullscreenWatermarkRef.current) ||
         (fullscreenWatermarkRef.current.parentElement && fullscreenWatermarkRef.current.parentElement.contains(fullscreenWatermarkRef.current)));
      
      debugLog('continuousCheck:', {
        currentlyFullscreen,
        hasWatermark,
        watermarkRefExists: !!fullscreenWatermarkRef.current,
      });
      
      if (currentlyFullscreen) {
        if (!hasWatermark) {
          debugLog('continuousCheck: Fullscreen but no watermark, creating...');
          // Create watermark immediately for iframe fullscreen
          createFullscreenWatermark();
          setIsFullscreen(true);
          
          // Also check again after short delays to ensure it's created
          setTimeout(() => {
            if (checkFullscreen() && (!fullscreenWatermarkRef.current || !document.body.contains(fullscreenWatermarkRef.current))) {
              debugLog('continuousCheck: Retry creating watermark (100ms)');
              createFullscreenWatermark();
            }
          }, 100);
          setTimeout(() => {
            if (checkFullscreen() && (!fullscreenWatermarkRef.current || !document.body.contains(fullscreenWatermarkRef.current))) {
              debugLog('continuousCheck: Retry creating watermark (300ms)');
              createFullscreenWatermark();
            }
          }, 300);
        } else {
          // Ensure watermark is still visible and properly positioned
          if (fullscreenWatermarkRef.current) {
            const wm = fullscreenWatermarkRef.current;
            const paragraph = wm.querySelector('.fullscreen-watermark-text') as HTMLElement;
            const container = wm.querySelector('.fullscreen-watermark-container') as HTMLElement;
            
            // Check if text is visible
            if (paragraph) {
              const pComputed = window.getComputedStyle(paragraph);
              const wmComputed = window.getComputedStyle(wm);
              
              debugLog('continuousCheck: Watermark exists, checking visibility:', {
                paragraphText: paragraph.textContent,
                paragraphColor: pComputed.color,
                paragraphDisplay: pComputed.display,
                paragraphVisibility: pComputed.visibility,
                paragraphOpacity: pComputed.opacity,
                watermarkPosition: wmComputed.position,
                watermarkZIndex: wmComputed.zIndex,
                watermarkDisplay: wmComputed.display,
                watermarkVisibility: wmComputed.visibility,
                watermarkOpacity: wmComputed.opacity,
              });
            }
            
            // Use setProperty with important flag
            wm.style.setProperty('display', 'block', 'important');
            wm.style.setProperty('visibility', 'visible', 'important');
            wm.style.setProperty('opacity', '1', 'important');
            wm.style.setProperty('z-index', '2147483647', 'important');
            wm.style.setProperty('position', 'fixed', 'important');
            wm.style.setProperty('top', '0', 'important');
            wm.style.setProperty('left', '0', 'important');
            wm.style.setProperty('width', '100vw', 'important');
            wm.style.setProperty('height', '100vh', 'important');
            wm.style.setProperty('pointer-events', 'none', 'important');
            
            // Ensure container has bold debugging colors
            if (container) {
              container.style.setProperty('color', 'rgb(255, 255, 0)', 'important'); // Yellow
              container.style.setProperty('background', 'rgba(0, 255, 0, 0.2)', 'important'); // Light green
              container.style.setProperty('border', '2px dashed rgb(0, 255, 255)', 'important'); // Cyan border
              container.style.setProperty('padding', '20px', 'important');
            }
            
            // Ensure paragraph has VERY BOLD colors for debugging
            if (paragraph) {
              paragraph.style.setProperty('color', 'rgb(255, 255, 0)', 'important'); // Bright yellow
              paragraph.style.setProperty('background', 'rgba(255, 0, 0, 0.8)', 'important'); // Bright red
              paragraph.style.setProperty('border', '4px solid rgb(255, 255, 0)', 'important'); // Yellow border
              paragraph.style.setProperty('outline', '3px solid rgb(255, 0, 0)', 'important'); // Red outline
              paragraph.style.setProperty('box-shadow', '0 0 20px rgba(255, 255, 0, 1), 0 0 40px rgba(255, 0, 0, 0.8)', 'important');
              paragraph.style.setProperty('font-size', '28px', 'important');
              paragraph.style.setProperty('font-weight', '900', 'important');
              paragraph.style.setProperty('padding', '15px 25px', 'important');
              paragraph.style.setProperty('margin', '20px auto', 'important');
            }
            
            // Ensure it's in the DOM (might have been removed) - prefer documentElement
            const inDoc = document.documentElement.contains(wm);
            const inBody = document.body.contains(wm);
            if (!inDoc && !inBody) {
              debugLog('continuousCheck: Watermark not in DOM, re-appending to documentElement');
              try {
                document.documentElement.appendChild(wm);
              } catch (e) {
                debugLog('continuousCheck: documentElement append failed, trying body:', e);
                document.body.appendChild(wm);
              }
            } else if (inBody && !inDoc) {
              // Move from body to documentElement for higher stacking
              debugLog('continuousCheck: Moving watermark from body to documentElement');
              try {
                wm.remove();
                document.documentElement.appendChild(wm);
              } catch (e) {
                debugLog('continuousCheck: Failed to move to documentElement:', e);
              }
            }
          }
        }
      } else {
        if (hasWatermark) {
          debugLog('continuousCheck: Not fullscreen, removing watermark');
          removeFullscreenWatermark();
          setIsFullscreen(false);
        }
      }
    };

    // Use MutationObserver to watch for DOM changes that might indicate fullscreen
    let lastFullscreenState = checkFullscreen();
    const mutationObserver = new MutationObserver(() => {
      // Check if fullscreen state changed
      const currentState = checkFullscreen();
      if (currentState !== lastFullscreenState) {
        lastFullscreenState = currentState;
        continuousCheck();
      }
    });

    // Observe body for changes (fullscreen elements are added/removed)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Use requestAnimationFrame for smooth checking
    const rafCheck = () => {
      continuousCheck();
      rafRef.current = requestAnimationFrame(rafCheck);
    };
    rafRef.current = requestAnimationFrame(rafCheck);

    // Also use interval as backup - more frequent for better iframe fullscreen detection
    checkIntervalRef.current = setInterval(continuousCheck, 100);

    const handleFullscreenChange = () => {
      debugLog('handleFullscreenChange: Fullscreen event detected');
      
      // For iframe fullscreen, we need to wait a bit for the browser to process the fullscreen change
      // Immediate check might happen before the iframe is fully in fullscreen mode
      const isCurrentlyFullscreen = checkFullscreen();
      
      if (isCurrentlyFullscreen) {
        // Wait a bit longer for iframe fullscreen to stabilize
        setTimeout(() => {
          debugLog('handleFullscreenChange: Delayed check (100ms) - creating watermark');
          continuousCheck();
        }, 100);
        
        setTimeout(() => {
          debugLog('handleFullscreenChange: Delayed check (300ms) - ensuring watermark');
          continuousCheck();
        }, 300);
        
        setTimeout(() => {
          debugLog('handleFullscreenChange: Delayed check (500ms) - final check');
          continuousCheck();
        }, 500);
        
        setTimeout(() => {
          debugLog('handleFullscreenChange: Delayed check (1000ms) - final verification');
          continuousCheck();
        }, 1000);
      } else {
        // Exiting fullscreen - immediate cleanup
        continuousCheck();
      }
    };

    // Listen for fullscreen events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    window.addEventListener('resize', handleFullscreenChange);
    
    // Also listen for focus events (fullscreen often triggers focus)
    window.addEventListener('focus', handleFullscreenChange);
    document.addEventListener('focusin', handleFullscreenChange);

    // Initial check
    continuousCheck();

    return () => {
      // Clean up MutationObserver
      mutationObserver.disconnect();
      
      // Clean up event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      window.removeEventListener('resize', handleFullscreenChange);
      window.removeEventListener('focus', handleFullscreenChange);
      document.removeEventListener('focusin', handleFullscreenChange);
      
      // Stop continuous checks
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      
      // Clean up watermarks
      removeFullscreenWatermark();
    };
  }, [text]);

  if (!text || text.trim() === '') {
    return null;
  }

  return (
    <>
      {/* Visual Debug Panel - Enable with: localStorage.setItem('watermark-debug', 'true') */}
      {typeof window !== 'undefined' && window.localStorage.getItem('watermark-debug') === 'true' && (
        <Box
          sx={{
            position: 'fixed',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: 2,
            borderRadius: 1,
            zIndex: 9999999,
            fontSize: '12px',
            fontFamily: 'monospace',
            maxWidth: '400px',
            maxHeight: '300px',
            overflow: 'auto',
            pointerEvents: 'auto',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            Watermark Debug Info
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            <strong>Status:</strong> {isFullscreen ? 'FULLSCREEN' : 'Normal'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            <strong>Watermark Exists:</strong> {fullscreenWatermarkRef.current ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
            <strong>In DOM:</strong>{' '}
            {fullscreenWatermarkRef.current && document.body.contains(fullscreenWatermarkRef.current)
              ? 'Yes (body)'
              : fullscreenWatermarkRef.current && document.contains(fullscreenWatermarkRef.current)
              ? 'Yes (document)'
              : 'No'}
          </Typography>
          {fullscreenWatermarkRef.current && (
            <>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                <strong>Text:</strong> {fullscreenWatermarkRef.current.querySelector('.fullscreen-watermark-text')?.textContent || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                <strong>Last Update:</strong> {debugInfo.timestamp}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                <strong>Message:</strong> {debugInfo.message}
              </Typography>
              {debugInfo.data && (
                <Typography variant="caption" sx={{ display: 'block', fontSize: '10px', mt: 1 }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(debugInfo.data, null, 2)}
                  </pre>
                </Typography>
              )}
            </>
          )}
        </Box>
      )}
      
      {/* Normal Mode Watermark */}
      <Box
        ref={watermarkRef}
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)',
          width: '100%',
          height: 'auto',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 10000, // Higher z-index to appear above iframe (iframe typically has z-index 1 or auto)
          display: isFullscreen ? 'none' : 'block',
          visibility: 'visible',
          opacity: 1,
          isolation: 'isolate', // Create new stacking context
          ...slideAnimation,
        }}
      >
        <Typography
          variant="body2"
          component="p"
          sx={{
            color: 'rgba(255, 255, 255, 0.95) !important',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 700,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            animation: 'slideHorizontal 6s linear infinite',
            textShadow: '0px 2px 4px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.7), 0px 0px 12px rgba(0,0,0,0.5)',
            display: 'inline-block',
            minWidth: '200px',
            margin: 0,
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Slight background for better visibility
            borderRadius: '4px',
          }}
        >
          {text || 'Watermark'}
        </Typography>
      </Box>
    </>
  );
};

export default VideoWatermark;
