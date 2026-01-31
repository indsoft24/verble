// src/utils/screenCaptureProtection.ts

/**
 * Disable right-click context menu to prevent screenshot/save operations
 */
export const disableContextMenu = () => {
    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    
    return () => {
        document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
};

/**
 * Disable text selection to prevent copy operations
 */
export const disableTextSelection = () => {
    const handleSelectStart = (e: Event) => {
        e.preventDefault();
        return false;
    };

    const handleDragStart = (e: DragEvent) => {
        e.preventDefault();
        return false;
    };

    document.addEventListener('selectstart', handleSelectStart, { capture: true });
    document.addEventListener('dragstart', handleDragStart, { capture: true });

    // Add CSS to prevent selection
    const style = document.createElement('style');
    style.id = 'screen-capture-protection-style';
    style.textContent = `
        * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-tap-highlight-color: transparent !important;
        }
    `;
    document.head.appendChild(style);

    return () => {
        document.removeEventListener('selectstart', handleSelectStart, { capture: true });
        document.removeEventListener('dragstart', handleDragStart, { capture: true });
        const existingStyle = document.getElementById('screen-capture-protection-style');
        if (existingStyle) {
            existingStyle.remove();
        }
    };
};

/**
 * Disable keyboard shortcuts that could be used for screen capture
 */
export const disableKeyboardShortcuts = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Disable Print Screen
        if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Disable common screenshot shortcuts (Ctrl+Shift+S, etc.)
        if (e.ctrlKey || e.metaKey) {
            // Disable Ctrl/Cmd + Shift + S (common screenshot shortcut)
            if (e.shiftKey && e.key === 'S') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            // Disable Ctrl/Cmd + Shift + 3/4 (macOS screenshot)
            if (e.shiftKey && (e.key === '3' || e.key === '4')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }

        // Disable F12 (DevTools)
        if (e.key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Disable Ctrl+Shift+I (DevTools)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Disable Ctrl+Shift+J (Console)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Disable Ctrl+U (View Source)
        if ((e.ctrlKey || e.metaKey) && e.key === 'U') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
        document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
};

/**
 * Add CSS overlay to prevent screen capture (watermark effect)
 */
export const addProtectionOverlay = (containerId: string, watermarkText: string) => {
    const container = document.getElementById(containerId);
    if (!container) return () => {};

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = `${containerId}-protection-overlay`;
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.03) 2px,
            rgba(0, 0, 0, 0.03) 4px
        );
        background-size: 100% 4px;
    `;

    // Add watermark text
    const watermark = document.createElement('div');
    watermark.textContent = watermarkText;
    watermark.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        font-family: Arial, sans-serif;
        pointer-events: none;
        z-index: 10000;
    `;
    overlay.appendChild(watermark);

    container.style.position = 'relative';
    container.appendChild(overlay);

    return () => {
        const existingOverlay = document.getElementById(`${containerId}-protection-overlay`);
        if (existingOverlay) {
            existingOverlay.remove();
        }
    };
};

/**
 * Initialize all screen capture protection measures
 */
export const initializeScreenCaptureProtection = (containerId: string, watermarkText: string) => {
    const cleanupFunctions: Array<() => void> = [];

    // Disable context menu
    cleanupFunctions.push(disableContextMenu());

    // Disable text selection
    cleanupFunctions.push(disableTextSelection());

    // Disable keyboard shortcuts
    cleanupFunctions.push(disableKeyboardShortcuts());

    // Add protection overlay
    cleanupFunctions.push(addProtectionOverlay(containerId, watermarkText));

    // Return cleanup function
    return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
    };
};
