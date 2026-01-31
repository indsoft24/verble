import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Avatar,
    Divider,
    Alert,
    CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const GoogleAccountManager: React.FC = () => {
    const { user, linkGoogleAccount, unlinkGoogleAccount } = useAuth();
    const { addNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(false);

    const handleLinkGoogle = async () => {
        setIsLoading(true);
        try {
            await linkGoogleAccount('');
            addNotification('Google account linked successfully!', 'success');
        } catch (error: any) {
            addNotification(error.message || 'Failed to link Google account', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        setIsLoading(true);
        try {
            await unlinkGoogleAccount();
            addNotification('Google account unlinked successfully!', 'success');
        } catch (error: any) {
            addNotification(error.message || 'Failed to unlink Google account', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const isGoogleLinked = user?.googleId && user?.authProvider === 'google';

    return (
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Google Account
                </Typography>
                
                {isGoogleLinked ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Your Google account is linked
                        </Alert>
                        
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar 
                                src={user?.googleProfile?.picture} 
                                alt={user?.googleProfile?.name}
                                sx={{ width: 40, height: 40 }}
                            />
                            <Box>
                                <Typography variant="subtitle1">
                                    {user?.googleProfile?.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user?.googleProfile?.email}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LinkOffIcon />}
                            onClick={handleUnlinkGoogle}
                            disabled={isLoading}
                            fullWidth
                        >
                            {isLoading ? <CircularProgress size={20} /> : 'Unlink Google Account'}
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Link your Google account for easier login
                        </Alert>
                        
                        <Button
                            variant="outlined"
                            startIcon={<GoogleIcon />}
                            onClick={handleLinkGoogle}
                            disabled={isLoading}
                            fullWidth
                        >
                            {isLoading ? <CircularProgress size={20} /> : 'Link Google Account'}
                        </Button>
                    </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                    {isGoogleLinked 
                        ? 'You can use your Google account to sign in quickly. You can also unlink it if you prefer to use only email and password.'
                        : 'Linking your Google account allows you to sign in quickly without entering your password each time.'
                    }
                </Typography>
            </CardContent>
        </Card>
    );
};

export default GoogleAccountManager;
