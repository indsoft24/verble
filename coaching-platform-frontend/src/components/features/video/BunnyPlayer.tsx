// src/components/features/video/BunnyPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useScreenRecordingProtection } from '../../../hooks/useScreenRecordingProtection';
import { initializeScreenCaptureProtection } from '../../../utils/screenCaptureProtection';

interface BunnyPlayerProps {
    videoId: string;
    libraryId: string;
    token?: string;
    expires?: number;
    onVideoComplete?: () => void; // Callback when video completes
    durationSeconds?: number; // Video duration for progress tracking
    enableScreenProtection?: boolean; // Enable screen recording/capture protection
    watermarkText?: string; // Watermark text for protection overlay
}

const BunnyPlayer: React.FC<BunnyPlayerProps> = ({ 
    videoId, 
    libraryId, 
    token, 
    expires, 
    onVideoComplete, 
    durationSeconds,
    enableScreenProtection = true,
    watermarkText = 'Protected Content'
}) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hasCalledCompleteRef = useRef(false);
    const progressCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeBasedCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const maxProgressReachedRef = useRef(0);
    const progressCheckCountRef = useRef(0);
    const [showRecordingWarning, setShowRecordingWarning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const containerId = `bunny-player-container-${videoId}`;

    // Screen recording protection
    const { isRecording, isCapturing } = useScreenRecordingProtection({
        enabled: enableScreenProtection,
        onRecordingDetected: () => {
            setShowRecordingWarning(true);
            setIsPaused(true);
            // Try to pause video in iframe
            try {
                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({ 
                        type: 'pause',
                        action: 'pause'
                    }, '*');
                }
            } catch (e) {
                // CORS restrictions - expected
            }
        },
        onCaptureDetected: () => {
            setShowRecordingWarning(true);
            setIsPaused(true);
            // Try to pause video in iframe
            try {
                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({ 
                        type: 'pause',
                        action: 'pause'
                    }, '*');
                }
            } catch (e) {
                // CORS restrictions - expected
            }
        },
        checkInterval: 1000
    });

    // Initialize screen capture protection
    useEffect(() => {
        if (!enableScreenProtection) return;

        const cleanup = initializeScreenCaptureProtection(containerId, watermarkText);

        return () => {
            cleanup();
        };
    }, [enableScreenProtection, containerId, watermarkText]);

    useEffect(() => {
        // Reset completion flag when video changes
        hasCalledCompleteRef.current = false;
        maxProgressReachedRef.current = 0;
        progressCheckCountRef.current = 0;
        setShowRecordingWarning(false);
        setIsPaused(false);
        if (progressCheckIntervalRef.current) {
            clearInterval(progressCheckIntervalRef.current);
            progressCheckIntervalRef.current = null;
        }
        if (timeBasedCheckRef.current) {
            clearTimeout(timeBasedCheckRef.current);
            timeBasedCheckRef.current = null;
        }
    }, [videoId]);

    useEffect(() => {
        if (!onVideoComplete || !durationSeconds) return;

        const completionThreshold = 95; // Mark complete at 95% watched

        // Listen for postMessage events from Bunny Player iframe
        const handleMessage = (event: MessageEvent) => {

            // Only process messages from Bunny Stream domain
            if (!event.origin.includes('mediadelivery.net') && 
                !event.origin.includes('bunny.net') && 
                !event.origin.includes('b-cdn.net')) {
                return;
            }

            // Bunny Stream Player sends various events
            if (event.data && typeof event.data === 'object') {
                // Check for video end events (multiple possible formats)
                const isEndEvent = 
                    event.data.type === 'videoEnd' || 
                    event.data.type === 'ended' ||
                    event.data.event === 'ended' || 
                    event.data.eventType === 'ended' ||
                    event.data.name === 'ended' ||
                    event.data.eventName === 'ended' ||
                    event.data.action === 'ended' ||
                    (event.data.type === 'timeupdate' && event.data.currentTime && event.data.duration && event.data.currentTime >= event.data.duration * 0.99);

                if (isEndEvent && !hasCalledCompleteRef.current) {
                    hasCalledCompleteRef.current = true;
                    onVideoComplete();
                    return;
                }
                
                // Track video progress from timeupdate events
                if (event.data.currentTime !== undefined && event.data.duration !== undefined) {
                    const currentTime = event.data.currentTime;
                    const duration = event.data.duration;
                    
                    if (duration > 0) {
                        const progress = (currentTime / duration) * 100;
                        maxProgressReachedRef.current = Math.max(maxProgressReachedRef.current, progress);
                        
                        // Mark as complete only if video is 99.5%+ watched (very close to end)
                        // Also check if we're within 3 seconds of the end
                        const timeRemaining = duration - currentTime;
                        if (progress >= completionThreshold && timeRemaining <= 3 && !hasCalledCompleteRef.current) {
                            hasCalledCompleteRef.current = true;
                            onVideoComplete();
                            return;
                        }
                    }
                }

                // Handle Bunny Stream specific events
                if (event.data.videoId || event.data.videoGuid || event.data.video) {
                    // This is a Bunny Stream event
                    if (event.data.event === 'ended' || 
                        event.data.state === 'ended' || 
                        event.data.status === 'ended' ||
                        event.data.type === 'ended') {
                        if (!hasCalledCompleteRef.current) {
                            hasCalledCompleteRef.current = true;
                            onVideoComplete();
                            return;
                        }
                    }
                }
            }

            // Also check for string-based events
            if (typeof event.data === 'string') {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'ended' || data.event === 'ended' || data.action === 'ended') {
                        if (!hasCalledCompleteRef.current) {
                            hasCalledCompleteRef.current = true;
                            onVideoComplete();
                        }
                    }
                } catch (e) {
                    // Not JSON, check if string contains "ended"
                    if (event.data.toLowerCase().includes('ended')) {
                        if (!hasCalledCompleteRef.current) {
                            hasCalledCompleteRef.current = true;
                            onVideoComplete();
                        }
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        
        // Time-based fallback: Only trigger when video is actually ending
        if (durationSeconds) {
            // Only check at 99.5% of duration (within 3 seconds of end for a 2-hour video)
            const completionTime = (durationSeconds * 0.995) * 1000;
            timeBasedCheckRef.current = setTimeout(() => {
                // Only mark complete if we've reached 99%+ progress (video is actually near end)
                if (maxProgressReachedRef.current >= 99 && !hasCalledCompleteRef.current) {
                    hasCalledCompleteRef.current = true;
                    onVideoComplete();
                }
            }, completionTime);

            // Final check at 100% of duration + 3 seconds buffer (video definitely ended)
            setTimeout(() => {
                // Force complete only if video duration has fully elapsed
                if (!hasCalledCompleteRef.current) {
                    hasCalledCompleteRef.current = true;
                    onVideoComplete();
                }
            }, (durationSeconds * 1000) + 3000);
        }

        // Periodic check to request progress updates and track time
        let elapsedTime = 0;
        progressCheckIntervalRef.current = setInterval(() => {
            progressCheckCountRef.current++;
            elapsedTime += 3000; // 3 seconds per check
            
            // Only mark complete if we've been checking for 99%+ of video duration
            if (durationSeconds && elapsedTime >= (durationSeconds * 0.99 * 1000)) {
                if (maxProgressReachedRef.current >= 99 && !hasCalledCompleteRef.current) {
                    hasCalledCompleteRef.current = true;
                    onVideoComplete();
                    if (progressCheckIntervalRef.current) {
                        clearInterval(progressCheckIntervalRef.current);
                    }
                }
            }

            try {
                if (iframeRef.current?.contentWindow) {
                    // Request progress update from iframe
                    iframeRef.current.contentWindow.postMessage({ 
                        type: 'getProgress',
                        action: 'timeupdate'
                    }, '*');
                }
            } catch (e) {
                // CORS restrictions - expected
            }
        }, 3000); // Check every 3 seconds

        return () => {
            window.removeEventListener('message', handleMessage);
            if (progressCheckIntervalRef.current) {
                clearInterval(progressCheckIntervalRef.current);
            }
            if (timeBasedCheckRef.current) {
                clearTimeout(timeBasedCheckRef.current);
            }
        };
    }, [onVideoComplete, videoId, durationSeconds]);

    if (!videoId || !libraryId) {
        return <Typography>Video configuration is missing.</Typography>;
    }
    const hasTokenAuth = token && expires;
    // Use the new player URL (player.mediadelivery.net) for better compatibility
    // Falls back to iframe.mediadelivery.net if needed
    let src = `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=true&muted=true`;
    
    if (hasTokenAuth) {
        src += `&token=${token}&expires=${expires}`;
    }

    const handleResumeVideo = () => {
        setShowRecordingWarning(false);
        setIsPaused(false);
        // Try to resume video in iframe
        try {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage({ 
                    type: 'play',
                    action: 'play'
                }, '*');
            }
        } catch (e) {
            // CORS restrictions - expected
        }
    };

    return (
        <>
            <Box 
                id={containerId}
                sx={{
                    position: 'relative',
                    paddingTop: '56.25%', // 16:9 Aspect Ratio
                    backgroundColor: '#000',
                    borderRadius: 1,
                    overflow: 'hidden',
                    width: '100%',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    ...(isPaused && {
                        opacity: 0.5,
                        pointerEvents: 'none'
                    })
                }}
                onContextMenu={(e) => {
                    if (enableScreenProtection) {
                        e.preventDefault();
                        return false;
                    }
                }}
            >
                {/* The official way to embed the Bunny Player is with an iframe. */}
                <iframe
                    ref={iframeRef}
                    id={`bunny-player-iframe-${videoId}`}
                    src={src}
                    loading="lazy"
                    style={{
                        border: 'none',
                        position: 'absolute',
                        top: 0,
                        height: '100%',
                        width: '100%',
                        pointerEvents: isPaused ? 'none' : 'auto'
                    }}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;"
                    allowFullScreen={true}
                ></iframe>
            </Box>

            {/* Screen Recording Warning Dialog */}
            <Dialog
                open={showRecordingWarning}
                onClose={() => {}} // Prevent closing by clicking outside
                disableEscapeKeyDown
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Screen Recording Detected
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Screen recording or screen capture has been detected. Video playback has been paused for security reasons.
                    </Alert>
                    <Typography variant="body2" color="text.secondary">
                        To continue watching, please:
                    </Typography>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                        <li>Close any screen recording software</li>
                        <li>Stop any screen capture applications</li>
                        <li>Close browser developer tools if open</li>
                    </ul>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Recording or capturing video content is not permitted and may violate our terms of service.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={handleResumeVideo} 
                        variant="contained" 
                        color="primary"
                        disabled={isRecording || isCapturing}
                    >
                        {isRecording || isCapturing ? 'Recording Still Detected' : 'Resume Video'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default BunnyPlayer;
