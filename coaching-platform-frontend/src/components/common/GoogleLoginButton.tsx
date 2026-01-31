import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

interface GoogleLoginButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
    variant?: 'contained' | 'outlined' | 'text';
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    children?: React.ReactNode;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
    onSuccess,
    onError,
    disabled = false,
    variant = 'outlined',
    size = 'medium',
    fullWidth = false,
    children,
}) => {
    const { initiateGoogleLogin, isLoading, error } = useGoogleAuth();

    const handleClick = async () => {
        try {
            await initiateGoogleLogin();
            onSuccess?.();
        } catch (error: any) {
            onError?.(error.message || 'Google login failed');
        }
    };

    React.useEffect(() => {
        if (error) {
            onError?.(error);
        }
    }, [error, onError]);

    return (
        <Button
            variant={variant}
            size={size}
            fullWidth={fullWidth}
            disabled={disabled || isLoading}
            onClick={handleClick}
            startIcon={
                isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                ) : (
                    <GoogleIcon />
                )
            }
            sx={{
                backgroundColor: variant === 'contained' ? '#4285f4' : 'transparent',
                color: variant === 'contained' ? 'white' : '#4285f4',
                borderColor: '#4285f4',
                '&:hover': {
                    backgroundColor: variant === 'contained' ? '#357ae8' : 'rgba(66, 133, 244, 0.04)',
                    borderColor: '#357ae8',
                },
                '&:disabled': {
                    backgroundColor: variant === 'contained' ? 'rgba(66, 133, 244, 0.3)' : 'transparent',
                    color: variant === 'contained' ? 'white' : 'rgba(66, 133, 244, 0.3)',
                    borderColor: 'rgba(66, 133, 244, 0.3)',
                },
            }}
        >
            {children || 'Continue with Google'}
        </Button>
    );
};

export default GoogleLoginButton;
