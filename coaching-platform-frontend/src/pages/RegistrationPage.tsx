import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import GoogleLoginButton from '../components/common/GoogleLoginButton';

import {
    Avatar, Button, CssBaseline, TextField, Link as MuiLink, Box,
    Typography, Container, CircularProgress, IconButton, InputAdornment,
    Divider
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const RegistrationPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { addNotification } = useNotification();
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegistrationSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addNotification("Passwords do not match.", 'error');
            return;
        }
        if (password.length < 6) {
            addNotification("Password must be at least 6 characters long.", 'error');
            return;
        }

        setIsLoading(true);
        try {
            await register({ name, email, password, phoneNumber });
            addNotification('Registration successful! Please check your email for the OTP.', 'success');
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            addNotification(err.message || 'Failed to register. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
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
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <PersonAddIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign up
                </Typography>

                <Box component="form" onSubmit={handleRegistrationSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="name"
                        label="Full Name"
                        name="name"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="phoneNumber"
                        label="Phone Number"
                        name="phoneNumber"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isLoading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={handleClickShowConfirmPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{ mt: 3, mb: 2, position: 'relative' }}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{ color: 'primary.contrastText', position: 'absolute' }} /> : 'Sign Up'}
                    </Button>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                        <Divider sx={{ flex: 1 }} />
                        <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
                            OR
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                    </Box>
                    
                    <GoogleLoginButton
                        fullWidth
                        variant="outlined"
                        onSuccess={() => {
                            addNotification('Google registration successful!', 'success');
                            navigate('/');
                        }}
                        onError={(error) => {
                            addNotification(error, 'error');
                        }}
                        disabled={isLoading}
                    />
                    
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <MuiLink component={RouterLink} to="/login" variant="body2">
                            Already have an account? Sign In
                        </MuiLink>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
};

export default RegistrationPage;