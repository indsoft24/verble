// src/pages/MobileLoginPage.tsx
import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import {
    Avatar, Button, CssBaseline, TextField, Link as MuiLink, Grid, Box,
    Typography, Container, CircularProgress, Tabs, Tab, Paper
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { sendMobileOTP, verifyMobileOTP, loginWithMobile, registerWithMobile } from '../services/authService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`mobile-tabpanel-${index}`}
            aria-labelledby={`mobile-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const MobileLoginPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [mobile, setMobile] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [maskedMobile, setMaskedMobile] = useState('');

    const { setUserContext } = useAuth();
    const { addNotification } = useNotification();
    const { setUserContext, refreshUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        setOtpSent(false);
        setOtp('');
        setMobile('');
        setName('');
        setResendCooldown(0);
    };

    const handleSendOTP = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!mobile || mobile.trim().length < 10) {
            addNotification('Please enter a valid mobile number.', 'error');
            return;
        }

        if (tabValue === 1 && (!name || name.trim().length < 2)) {
            addNotification('Please enter your name (at least 2 characters).', 'error');
            return;
        }

        setIsLoading(true);
        try {
            let response;
            if (tabValue === 0) {
                // Login
                response = await loginWithMobile(mobile.trim());
            } else {
                // Register
                response = await registerWithMobile(mobile.trim(), name.trim());
            }

            setOtpSent(true);
            setMaskedMobile(response.data.mobile);
            addNotification('OTP has been sent to your email address. Please check your inbox.', 'success');
            
            // Start cooldown timer
            setResendCooldown(30);
            const cooldownInterval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(cooldownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            if (err.cooldownRemaining) {
                setResendCooldown(err.cooldownRemaining);
                addNotification(err.message || 'Please wait before requesting a new OTP.', 'warning');
            } else {
                addNotification(err.message || 'Failed to send OTP. Please try again.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            addNotification('Please enter a valid 6-digit OTP.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await verifyMobileOTP({
                mobile: mobile.trim(),
                otp: otp.trim(),
                name: tabValue === 1 ? name.trim() : undefined,
            });

            // Store token and user data
            if (response.token && response.data?.user) {
                // Use the AuthContext's setUserContext method
                setUserContext(response.data.user, response.token);
                // Refresh user to ensure all data is up to date
                await refreshUser();
                addNotification('Logged in successfully!', 'success');
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            addNotification(err.message || 'Invalid OTP. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0 || !mobile) return;

        setIsLoading(true);
        try {
            let response;
            if (tabValue === 0) {
                response = await loginWithMobile(mobile.trim());
            } else {
                response = await registerWithMobile(mobile.trim(), name.trim());
            }

            addNotification('OTP has been resent to your email address. Please check your inbox.', 'success');
            setResendCooldown(30);
            const cooldownInterval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(cooldownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err: any) {
            if (err.cooldownRemaining) {
                setResendCooldown(err.cooldownRemaining);
                addNotification(err.message || 'Please wait before requesting a new OTP.', 'warning');
            } else {
                addNotification(err.message || 'Failed to resend OTP.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                    <PhoneIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Mobile Login
                </Typography>

                <Paper sx={{ width: '100%', mt: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                        <Tab label="Login" />
                        <Tab label="Register" />
                    </Tabs>

                    <TabPanel value={tabValue} index={0}>
                        {!otpSent ? (
                            <Box component="form" onSubmit={handleSendOTP} sx={{ mt: 3, px: 3, pb: 3 }}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="mobile-login"
                                    label="Mobile Number"
                                    name="mobile"
                                    placeholder="+919876543210"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    disabled={isLoading}
                                    helperText="Include country code (e.g., +91 for India). OTP will be sent to your email."
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Send OTP'}
                                </Button>
                                <Grid container>
                                    <Grid item xs>
                                        <MuiLink component={RouterLink} to="/login" variant="body2">
                                            Login with Email
                                        </MuiLink>
                                    </Grid>
                                    <Grid item>
                                        <MuiLink component={RouterLink} to="/register" variant="body2">
                                            Register with Email
                                        </MuiLink>
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            <Box component="form" onSubmit={handleVerifyOTP} sx={{ mt: 3, px: 3, pb: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                    OTP sent to your email address
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, textAlign: 'center', display: 'block', fontStyle: 'italic' }}>
                                    (Mobile: {maskedMobile})
                                </Typography>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="otp"
                                    label="Enter 6-digit OTP"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={isLoading}
                                    inputProps={{
                                        maxLength: 6,
                                        style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Verify & Login'}
                                </Button>
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Button
                                        onClick={handleResendOTP}
                                        disabled={resendCooldown > 0 || isLoading}
                                        size="small"
                                    >
                                        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                                    </Button>
                                </Box>
                                <Button
                                    fullWidth
                                    variant="text"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp('');
                                    }}
                                    sx={{ mt: 1 }}
                                >
                                    Change Mobile Number
                                </Button>
                            </Box>
                        )}
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        {!otpSent ? (
                            <Box component="form" onSubmit={handleSendOTP} sx={{ mt: 3, px: 3, pb: 3 }}>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="name-register"
                                    label="Full Name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="mobile-register"
                                    label="Mobile Number"
                                    name="mobile"
                                    placeholder="+919876543210"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    disabled={isLoading}
                                    helperText="Include country code (e.g., +91 for India). OTP will be sent to your email."
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Send OTP'}
                                </Button>
                                <Grid container>
                                    <Grid item xs>
                                        <MuiLink component={RouterLink} to="/login" variant="body2">
                                            Login with Email
                                        </MuiLink>
                                    </Grid>
                                    <Grid item>
                                        <MuiLink component={RouterLink} to="/register" variant="body2">
                                            Register with Email
                                        </MuiLink>
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            <Box component="form" onSubmit={handleVerifyOTP} sx={{ mt: 3, px: 3, pb: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                                    OTP sent to your email address
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, textAlign: 'center', display: 'block', fontStyle: 'italic' }}>
                                    (Mobile: {maskedMobile})
                                </Typography>
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="otp"
                                    label="Enter 6-digit OTP"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={isLoading}
                                    inputProps={{
                                        maxLength: 6,
                                        style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? <CircularProgress size={24} /> : 'Verify & Register'}
                                </Button>
                                <Box sx={{ textAlign: 'center', mt: 2 }}>
                                    <Button
                                        onClick={handleResendOTP}
                                        disabled={resendCooldown > 0 || isLoading}
                                        size="small"
                                    >
                                        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                                    </Button>
                                </Box>
                                <Button
                                    fullWidth
                                    variant="text"
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp('');
                                    }}
                                    sx={{ mt: 1 }}
                                >
                                    Change Mobile Number
                                </Button>
                            </Box>
                        )}
                    </TabPanel>
                </Paper>
            </Box>
        </Container>
    );
};

export default MobileLoginPage;
