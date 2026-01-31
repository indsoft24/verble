import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar, Box, Toolbar, Typography, Button, Container, IconButton,
    Menu, MenuItem, Tooltip, Avatar, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget);
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleCloseNavMenu = () => setAnchorElNav(null);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    // Define navigation items
    const publicPages = [
        { name: 'Home', path: '/' },
        { name: 'Courses', path: '/courses' },
        { name: 'Blog', path: '/blog' },
        { name: 'Help', path: '/help' },
        { name: 'About', path: '/about-us' },
        { name: 'Contact', path: '/contact-us' },
    ];

    // This array correctly includes the link to the My Subscriptions page.
    const userPages = [
        { name: 'My Dashboard', path: dashboardPath },
        { name: 'My Subscription', path: '/my-subscription' },
        { name: 'Profile Settings', path: '/profile' },
    ];
    
    // --- Reusable Logo Component ---
    const Logo = ({ sx }: { sx?: object }) => (
        <Box
            component={RouterLink}
            to="/"
            sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                ...sx
            }}
        >
            <Box
                component="img"
                src="/verble-logo-nav.svg" 
                alt="Verble Logo"
                sx={{ height: 55, mr: 1 }}
            />
        </Box>
    );

    return (
        <AppBar position="static" color="default" elevation={1} sx={{marginBottom: '5px'}}>
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* --- DESKTOP LOGO --- */}
                    <Logo sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }} />

                    {/* --- MOBILE HAMBURGER MENU --- */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{ display: { xs: 'block', md: 'none' } }}
                        >
                            {publicPages.map((page) => (
                                <MenuItem key={page.name} onClick={handleCloseNavMenu} component={RouterLink} to={page.path}>
                                    <Typography textAlign="center">{page.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                    
                    {/* --- MOBILE LOGO --- */}
                    <Logo sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }} />

                    {/* --- DESKTOP MENU LINKS --- */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                        {publicPages.map((page) => (
                            <Button key={page.name} component={RouterLink} to={page.path} sx={{ color: 'text.primary', display: 'block' }}>
                                {page.name}
                            </Button>
                        ))}
                    </Box>

                    {/* --- AUTH / USER MENU --- */}
                    <Box sx={{ flexGrow: 0 }}>
                        {!isAuthenticated ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button component={RouterLink} to="/login" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                    Login
                                </Button>
                                <Button variant="contained" component={RouterLink} to="/register">
                                    Sign Up
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Tooltip title="Open settings">
                                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                        <Avatar alt={user?.name} src="/static/images/avatar/2.jpg" />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    sx={{ mt: '45px' }}
                                    id="menu-appbar-user"
                                    anchorEl={anchorElUser}
                                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    keepMounted
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    open={Boolean(anchorElUser)}
                                    onClose={handleCloseUserMenu}
                                >
                                    <Box sx={{px: 2, py: 1}}>
                                        <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>{user?.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                                    </Box>
                                    <Divider />
                                    {userPages.map((page) => (
                                        <MenuItem key={page.name} onClick={handleCloseUserMenu} component={RouterLink} to={page.path}>
                                            <Typography textAlign="center">{page.name}</Typography>
                                        </MenuItem>
                                    ))}
                                    <MenuItem onClick={() => { handleCloseUserMenu(); logout(); }}>
                                        <Typography textAlign="center" color="error">Logout</Typography>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;
