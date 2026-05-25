import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AppBar, Box, Toolbar, Typography, Button, Container, IconButton,
    Menu, MenuItem, Tooltip, Avatar, Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TranslateIcon from '@mui/icons-material/Translate';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NAVBAR_HEIGHT } from '../../landing/designSystem';
import { brandAssets } from '../../assets/brandAssets';

const Navbar: React.FC = () => {
    const { t } = useTranslation();
    const { openLanguageModal } = useLanguage();
    const { isAuthenticated, user, logout } = useAuth();
    const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElNav(event.currentTarget);
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
    const handleCloseNavMenu = () => setAnchorElNav(null);
    const handleCloseUserMenu = () => setAnchorElUser(null);

    const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    const publicPages = [
        { nameKey: 'nav.home', path: '/' },
        { nameKey: 'nav.courses', path: '/courses' },
        { nameKey: 'nav.blog', path: '/blog' },
        { nameKey: 'nav.help', path: '/help' },
        { nameKey: 'nav.about', path: '/about-us' },
        { nameKey: 'nav.contact', path: '/contact-us' },
    ];

    const userPages = [
        { nameKey: 'nav.myDashboard', path: dashboardPath },
        { nameKey: 'nav.mySubscription', path: '/my-subscription' },
        { nameKey: 'nav.profileSettings', path: '/profile' },
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
                src={brandAssets.primaryLogo}
                alt="Verble"
                sx={{ height: 55, mr: 1, width: 'auto', objectFit: 'contain' }}
            />
        </Box>
    );

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={0}
            sx={{
                marginBottom: 0,
                minHeight: NAVBAR_HEIGHT,
                '& .MuiToolbar-root': { minHeight: NAVBAR_HEIGHT },
            }}
        >
            <Container maxWidth={false} sx={{ maxWidth: 1200, px: 3 }}>
                <Toolbar disableGutters sx={{ minHeight: `${NAVBAR_HEIGHT}px !important` }}>
                    {/* --- DESKTOP LOGO (left) --- */}
                    <Logo sx={{ display: { xs: 'none', md: 'flex' }, mr: 3 }} />

                    {/* --- MOBILE HAMBURGER MENU --- */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton size="large" onClick={handleOpenNavMenu} color="inherit" aria-label="Open menu">
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
                                <MenuItem key={page.nameKey} onClick={handleCloseNavMenu} component={RouterLink} to={page.path}>
                                    <Typography textAlign="center">{t(page.nameKey)}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>
                    
                    {/* --- MOBILE LOGO --- */}
                    <Logo sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1 }} />

                    {/* --- DESKTOP MENU LINKS (centered, index-page style) --- */}
                    <Box
                        sx={{
                            flexGrow: 1,
                            display: { xs: 'none', md: 'flex' },
                            gap: 3,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {publicPages.map((page) => (
                            <Button
                                key={page.nameKey}
                                component={RouterLink}
                                to={page.path}
                                sx={{
                                    color: 'text.primary',
                                    display: 'block',
                                    fontWeight: 500,
                                    '&:hover': { backgroundColor: 'action.hover' },
                                    transition: 'background-color 0.2s ease',
                                }}
                            >
                                {t(page.nameKey)}
                            </Button>
                        ))}
                    </Box>

                    {/* --- LANGUAGE SWITCHER + AUTH / USER MENU --- */}
                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={t('common.language')}>
                            <Button
                                onClick={openLanguageModal}
                                color="inherit"
                                size="small"
                                startIcon={<TranslateIcon fontSize="small" />}
                                sx={{
                                    display: { xs: 'none', sm: 'inline-flex' },
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 999,
                                    border: '1px solid rgba(148, 163, 184, 0.6)',
                                    px: 1.5,
                                    minWidth: 0,
                                }}
                            >
                                EN | हिंदी
                            </Button>
                        </Tooltip>
                        {/* Mobile language icon */}
                        <IconButton
                            onClick={openLanguageModal}
                            color="inherit"
                            size="small"
                            aria-label={t('common.language')}
                            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                        >
                            <TranslateIcon fontSize="small" />
                        </IconButton>
                        {!isAuthenticated ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button component={RouterLink} to="/login" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                                    {t('common.login')}
                                </Button>
                                <Button variant="contained" component={RouterLink} to="/register">
                                    {t('common.getStarted')}
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Tooltip title={t('nav.openSettings')}>
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
                                        <Typography variant="body2" color="text.secondary">
                                            {user?.phoneNumber || user?.mobile || t('nav.account')}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    {userPages.map((page) => (
                                        <MenuItem key={page.nameKey} onClick={handleCloseUserMenu} component={RouterLink} to={page.path}>
                                            <Typography textAlign="center">{t(page.nameKey)}</Typography>
                                        </MenuItem>
                                    ))}
                                    <MenuItem onClick={() => { handleCloseUserMenu(); logout(); }}>
                                        <Typography textAlign="center" color="error">{t('common.logout')}</Typography>
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
