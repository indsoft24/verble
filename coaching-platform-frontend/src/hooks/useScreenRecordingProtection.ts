// src/hooks/useScreenRecordingProtection.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface ScreenRecordingProtectionOptions {
    onRecordingDetected?: () => void;
    onCaptureDetected?: () => void;
    checkInterval?: number; // Interval in milliseconds to check for recording
    enabled?: boolean; // Enable/disable protection
}

/**
 * Hook to detect screen recording and screen capture attempts
 * Uses various detection methods to identify recording/capture activities
 */
export const useScreenRecordingProtection = (options: ScreenRecordingProtectionOptions = {}) => {
    const {
        onRecordingDetected,
        onCaptureDetected,
        checkInterval = 1000, // Check every second
        enabled = true
    } = options;

    const [isRecording, setIsRecording] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastCanvasCheckRef = useRef<number>(0);
    const lastVideoCheckRef = useRef<number>(0);

    // Method 1: Detect screen sharing/recording via getDisplayMedia
    const detectScreenSharing = useCallback(() => {
        // Check if screen sharing is active
        if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === 'function') {
            // This is a heuristic - if getDisplayMedia is called, it might indicate recording
            // Note: We can't directly detect if it's active due to privacy restrictions
            // But we can monitor for suspicious patterns
        }
    }, []);

    // Method 2: Detect canvas fingerprinting (common in screen recording tools)
    const detectCanvasFingerprinting = useCallback(() => {
        const now = Date.now();
        // Check for rapid canvas operations (common in screen recording)
        if (now - lastCanvasCheckRef.current < 100) {
            // Suspicious activity detected
            return true;
        }
        lastCanvasCheckRef.current = now;
        return false;
    }, []);

    // Method 3: Detect video element manipulation (screen recording tools often create hidden video elements)
    const detectVideoManipulation = useCallback(() => {
        const videoElements = document.querySelectorAll('video');
        const now = Date.now();

        // Check for suspicious video elements
        for (const video of videoElements) {
            // Check for hidden video elements (common in screen recording)
            const rect = video.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0 && video.srcObject) {
                // Hidden video with media stream - suspicious
                if (now - lastVideoCheckRef.current < 500) {
                    return true;
                }
                lastVideoCheckRef.current = now;
            }
        }
        return false;
    }, []);

    // Method 4: Detect devtools (often used for screen recording)
    const detectDevTools = useCallback(() => {
        let devtools = false;
        const threshold = 160; // Height threshold for devtools

        // Method 1: Check window dimensions
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
            devtools = true;
        }

        // Method 2: Check console
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function () {
                devtools = true;
                return '';
            }
        });
        console.log(element);
        console.clear();

        return devtools;
    }, []);

    // Method 5: Detect iframe manipulation (some recording tools use iframes)
    const detectIframeManipulation = useCallback(() => {
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                // Try to access iframe content (will fail if cross-origin, which is normal)
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                    // Check for suspicious iframe content
                    const scripts = iframeDoc.querySelectorAll('script');
                    if (scripts.length > 10) {
                        // Suspicious number of scripts
                        return true;
                    }
                }
            } catch (e) {
                // Cross-origin iframe - normal behavior
            }
        }
        return false;
    }, []);

    // Method 6: Monitor for screen capture events (Chrome/Edge)
    const detectScreenCapture = useCallback(() => {
        // Listen for visibility change (screen capture might trigger this)
        if (document.hidden) {
            // Page is hidden - could be screen capture
            return true;
        }
        return false;
    }, []);

    // Main detection function
    const performDetection = useCallback(() => {
        if (!enabled) return;

        let recordingDetected = false;
        let captureDetected = false;

        // Check for screen sharing
        detectScreenSharing();

        // Check for canvas fingerprinting
        if (detectCanvasFingerprinting()) {
            recordingDetected = true;
        }

        // Check for video manipulation
        if (detectVideoManipulation()) {
            recordingDetected = true;
        }

        // Check for devtools (warning only, not blocking)
        const devtoolsOpen = detectDevTools();
        if (devtoolsOpen) {
            // Devtools detected - might be used for recording
            // Don't block, but log for monitoring
        }

        // Check for iframe manipulation
        if (detectIframeManipulation()) {
            recordingDetected = true;
        }

        // Check for screen capture
        if (detectScreenCapture()) {
            captureDetected = true;
        }

        // Update state and trigger callbacks
        if (recordingDetected && !isRecording) {
            setIsRecording(true);
            if (onRecordingDetected) {
                onRecordingDetected();
            }
        } else if (!recordingDetected && isRecording) {
            setIsRecording(false);
        }

        if (captureDetected && !isCapturing) {
            setIsCapturing(true);
            if (onCaptureDetected) {
                onCaptureDetected();
            }
        } else if (!captureDetected && isCapturing) {
            setIsCapturing(false);
        }
    }, [
        enabled,
        isRecording,
        isCapturing,
        onRecordingDetected,
        onCaptureDetected,
        detectScreenSharing,
        detectCanvasFingerprinting,
        detectVideoManipulation,
        detectDevTools,
        detectIframeManipulation,
        detectScreenCapture
    ]);

    // Set up detection interval
    useEffect(() => {
        if (!enabled) {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
            return;
        }

        // Initial detection
        performDetection();

        // Set up interval
        detectionIntervalRef.current = setInterval(() => {
            performDetection();
        }, checkInterval);

        // Listen for visibility changes
        const handleVisibilityChange = () => {
            performDetection();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for focus changes
        const handleFocusChange = () => {
            performDetection();
        };
        window.addEventListener('blur', handleFocusChange);
        window.addEventListener('focus', handleFocusChange);

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleFocusChange);
            window.removeEventListener('focus', handleFocusChange);
        };
    }, [enabled, checkInterval, performDetection]);

    return {
        isRecording,
        isCapturing,
        enabled
    };
};
