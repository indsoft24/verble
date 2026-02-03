import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import GoogleLoginButton from '../components/common/GoogleLoginButton';

import {
    Avatar, Button, CssBaseline, TextField, Link as MuiLink, Grid, Box,
    Typography, Container, CircularProgress, IconButton, InputAdornment,
    FormControlLabel, Checkbox, Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);


    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { login } = useAuth();
    const { addNotification } = useNotification(); // <-- 2. USE THE HOOK
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login({ email, password });
            navigate(from, { replace: true });
        } catch (err: any) {
            // Check if error is due to unverified email
            if (err.code === 'EMAIL_NOT_VERIFIED' && err.data?.email) {
                addNotification('Please verify your email address to continue.', 'info');
                navigate(`/verify-email?email=${encodeURIComponent(err.data.email)}`);
            } else {
                addNotification(err.message || 'Failed to login. Please check your credentials.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
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
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>

                {/* 4. REMOVED the old Alert component from the UI */}

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        autoComplete="current-password"
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
                    <FormControlLabel
                        control={
                            <Checkbox
                                value="remember"
                                color="primary"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={isLoading}
                            />
                        }
                        label="Remember me"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{ mt: 3, mb: 2, position: 'relative' }}
                    >
                        {isLoading ? <CircularProgress size={24} sx={{ color: 'primary.contrastText', position: 'absolute' }} /> : 'Sign In'}
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
                            addNotification('Google login successful!', 'success');
                            navigate(from, { replace: true });
                        }}
                        onError={(error) => {
                            addNotification(error, 'error');
                        }}
                        disabled={isLoading}
                    />
                    <Grid container>
                        <Grid size={{ xs: 12 }} sx={{ textAlign: 'center', mb: 1 }}>
                            <MuiLink component={RouterLink} to="/mobile-login" variant="body2" sx={{ fontWeight: 'bold' }}>
                                Login with Mobile Number
                            </MuiLink>
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
                            <MuiLink component={RouterLink} to="/forgot-password" variant="body2">
                                Forgot password?
                            </MuiLink>
                        </Grid>
                        <Grid sx={{ width: { xs: '100%', sm: '50%' }, textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 1, sm: 0 } }}>
                            <MuiLink component={RouterLink} to="/register" variant="body2">
                                {"Don't have an account? Sign Up"}
                            </MuiLink>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginPage;