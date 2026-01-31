// src/components/common/LazyImage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { getSplashImageUrl } from '../../utils/imageUtils';

interface LazyImageProps {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    className?: string;
    style?: React.CSSProperties;
    placeholder?: string;
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    loading?: 'lazy' | 'eager';
    sizes?: string;
    srcSet?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    width,
    height,
    className,
    style,
    placeholder,
    onError,
    loading = 'lazy',
    sizes,
    srcSet,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (loading === 'eager') {
            setIsInView(true);
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
                threshold: 0.01,
            }
        );

        if (containerRef.current && loading !== 'eager') {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [loading]);

    // Separate effect for timeout handling
    useEffect(() => {
        if (!isInView || hasError || isLoaded) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }

        // Set timeout to show fallback if image doesn't load
        const timeout = loading === 'eager' ? 5000 : 8000; // 5s for eager, 8s for lazy
        timeoutRef.current = setTimeout(() => {
            if (!isLoaded && !hasError) {
                setHasError(true);
                // Just set error state, don't call onError with synthetic event
                // The actual error handler will be called by the img element's onError
            }
        }, timeout);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isInView, isLoaded, hasError, loading, onError]);

    const handleLoad = () => {
        setIsLoaded(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setHasError(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (onError) {
            onError(e);
        }
    };

    const defaultPlaceholder = placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                width: width || '100%',
                height: height || 'auto',
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
                ...style,
            }}
            className={className}
        >
            {!isLoaded && !hasError && isInView && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        zIndex: 1,
                    }}
                >
                    <CircularProgress size={24} />
                </Box>
            )}
            {isInView && !hasError && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={loading}
                    sizes={sizes}
                    srcSet={srcSet}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: isLoaded ? 'block' : 'none',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                    }}
                />
            )}
            {!isInView && !hasError && (
                <img
                    src={defaultPlaceholder}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'blur(5px)',
                    }}
                />
            )}
            {hasError && (
                <img
                    src={getSplashImageUrl()}
                    alt={alt || 'Placeholder'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                    }}
                />
            )}
        </Box>
    );
};

export default LazyImage;

