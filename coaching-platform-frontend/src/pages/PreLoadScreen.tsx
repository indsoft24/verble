// src/pages/PreLoadScreen.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Fade,
    Container
} from '@mui/material';
import { keyframes } from '@emotion/react';

// Animation keyframes
const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const pulse = keyframes`
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.8;
    }
`;

const rotate = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

interface DailyQuote {
    quote: string;
    author?: string;
}

const PreLoadScreen: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading, user } = useAuth();
    const navigate = useNavigate();
    const [quote, setQuote] = useState<DailyQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);

    // Fetch daily quote
    useEffect(() => {
        const fetchDailyQuote = async () => {
            try {
                const response = await apiClient.get('/daily-quote');
                if (response.data?.data?.quote) {
                    setQuote({
                        quote: response.data.data.quote,
                        author: response.data.data.author
                    });
                } else {
                    // Fallback if response structure is different
                    setQuote({
                        quote: 'Every day is a new opportunity to learn and grow.',
                        author: 'Anonymous'
                    });
                }
            } catch (error) {
                // If API fails, use a default quote
                setQuote({
                    quote: 'Every day is a new opportunity to learn and grow.',
                    author: 'Anonymous'
                });
            } finally {
                setQuoteLoading(false);
                // Show content after a brief delay for smooth transition
                setTimeout(() => setShowContent(true), 500);
            }
        };

        fetchDailyQuote();
    }, []);

    // Handle redirect based on authentication status
    useEffect(() => {
        if (!authLoading) {
            if (isAuthenticated && user) {
                // Redirect to dashboard after a short delay
                const timer = setTimeout(() => {
                    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
                    navigate(dashboardPath, { replace: true });
                }, 3000); // Show screen for 3 seconds before redirect

                return () => clearTimeout(timer);
            }
        }
    }, [isAuthenticated, authLoading, user, navigate]);

    // Show loading spinner while checking auth
    if (authLoading) {
        return (
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'background.default',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Animated Background Circle */}
            <Box
                sx={{
                    position: 'absolute',
                    width: '600px',
                    height: '600px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    animation: `${pulse} 3s ease-in-out infinite`,
                    top: '-200px',
                    right: '-200px',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    animation: `${pulse} 4s ease-in-out infinite`,
                    bottom: '-150px',
                    left: '-150px',
                }}
            />

            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
                <Fade in={showContent} timeout={1000}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            color: 'white',
                        }}
                    >
                        {/* Animated Logo/Icon Placeholder */}
                        <Box
                            sx={{
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 4,
                                animation: `${rotate} 20s linear infinite`,
                                backdropFilter: 'blur(10px)',
                                border: '3px solid rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 'bold',
                                    fontSize: '3rem',
                                }}
                            >
                                V
                            </Typography>
                        </Box>

                        {/* Welcome Text */}
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 'bold',
                                marginBottom: 2,
                                animation: `${fadeIn} 1s ease-out`,
                            }}
                        >
                            Welcome back to the world of opportunities
                        </Typography>

                        {/* Daily Quote */}
                        {quoteLoading ? (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: 'white',
                                    marginTop: 2,
                                }}
                            />
                        ) : (
                            quote && (
                                <Box
                                    sx={{
                                        marginTop: 3,
                                        marginBottom: 4,
                                        padding: 3,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 2,
                                        backdropFilter: 'blur(10px)',
                                        maxWidth: '600px',
                                        animation: `${fadeIn} 1.5s ease-out`,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontStyle: 'italic',
                                            marginBottom: 1,
                                        }}
                                    >
                                        "{quote.quote}"
                                    </Typography>
                                    {quote.author && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                opacity: 0.9,
                                                textAlign: 'right',
                                            }}
                                        >
                                            — {quote.author}
                                        </Typography>
                                    )}
                                </Box>
                            )
                        )}

                        {/* Action Buttons (only show if not authenticated) */}
                        {!isAuthenticated && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    marginTop: 4,
                                    animation: `${fadeIn} 2s ease-out`,
                                }}
                            >
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        backgroundColor: 'white',
                                        color: '#667eea',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        },
                                        paddingX: 4,
                                        paddingY: 1.5,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={() => navigate('/register')}
                                    sx={{
                                        borderColor: 'white',
                                        color: 'white',
                                        '&:hover': {
                                            borderColor: 'rgba(255, 255, 255, 0.8)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        },
                                        paddingX: 4,
                                        paddingY: 1.5,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Register
                                </Button>
                            </Box>
                        )}

                        {/* Redirect message for authenticated users */}
                        {isAuthenticated && (
                            <Typography
                                variant="body1"
                                sx={{
                                    marginTop: 4,
                                    opacity: 0.9,
                                    animation: `${fadeIn} 2s ease-out`,
                                }}
                            >
                                Redirecting to your dashboard...
                            </Typography>
                        )}
                    </Box>
                </Fade>
            </Container>
        </Box>
    );
};

export default PreLoadScreen;
