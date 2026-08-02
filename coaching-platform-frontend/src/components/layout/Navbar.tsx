import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    AppBar, Box, Toolbar, Typography, Button, Container, IconButton,
    Menu, MenuItem, Tooltip, Avatar, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import TranslateIcon from '@mui/icons-material/Translate';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NAVBAR_HEIGHT } from '../../landing/designSystem';
import { brandAssets } from '../../assets/brandAssets';

const Navbar: React.FC = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down('sm'));
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
        { nameKey: 'nav.webinars', path: '/webinars' },
        { nameKey: 'nav.blog', path: '/blog' },
        { nameKey: 'nav.about', path: '/about-us' },
        { nameKey: 'nav.contact', path: '/contact-us' },
    ];

    const userPages = [
        { nameKey: 'nav.myDashboard', path: dashboardPath },
        { nameKey: 'nav.mySubscription', path: '/my-subscription' },
        { nameKey: 'nav.profileSettings', path: '/profile' },
    ];

    const Logo = ({ sx }: { sx?: object }) => (
        <Box
            component={RouterLink}
            to="/"
            sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                ...sx,
            }}
        >
            <Box
                component="img"
                src={brandAssets.primaryLogo}
                alt="Verble"
                sx={{ height: { xs: 40, md: 55 }, width: 'auto', objectFit: 'contain' }}
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
            <Container maxWidth={false} sx={{ maxWidth: 1200, px: { xs: 1, sm: 2, md: 3 } }}>
                <Toolbar
                    disableGutters
                    sx={{
                        minHeight: `${NAVBAR_HEIGHT}px !important`,
                        justifyContent: 'space-between',
                        gap: 0.5,
                    }}
                >
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5 }}>
                        <IconButton size="medium" onClick={handleOpenNavMenu} color="inherit" aria-label="Open menu">
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
                                <MenuItem
                                    key={page.nameKey}
                                    onClick={handleCloseNavMenu}
                                    component={RouterLink}
                                    to={page.path}
                                >
                                    <Typography textAlign="center">{t(page.nameKey)}</Typography>
                                </MenuItem>
                            ))}
                            <Divider />
                            {!isAuthenticated ? (
                                <>
                                    <MenuItem onClick={handleCloseNavMenu} component={RouterLink} to="/login">
                                        <Typography>{t('common.login')}</Typography>
                                    </MenuItem>
                                    <MenuItem onClick={handleCloseNavMenu} component={RouterLink} to="/dashboard">
                                        <Typography fontWeight={600}>{t('common.getStarted')}</Typography>
                                    </MenuItem>
                                </>
                            ) : (
                                <>
                                    {userPages.map((page) => (
                                        <MenuItem
                                            key={page.nameKey}
                                            onClick={handleCloseNavMenu}
                                            component={RouterLink}
                                            to={page.path}
                                        >
                                            <Typography>{t(page.nameKey)}</Typography>
                                        </MenuItem>
                                    ))}
                                    <MenuItem
                                        onClick={() => {
                                            handleCloseNavMenu();
                                            void logout();
                                        }}
                                    >
                                        <Typography color="error">{t('common.logout')}</Typography>
                                    </MenuItem>
                                </>
                            )}
                        </Menu>
                    </Box>

                    <Logo sx={{ display: { xs: 'flex', md: 'none' } }} />

                    <Logo sx={{ display: { xs: 'none', md: 'flex' }, mr: 3 }} />

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
                                }}
                            >
                                {t(page.nameKey)}
                            </Button>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
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
                            <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center' }}>
                                <Button
                                    component={RouterLink}
                                    to="/login"
                                    size="small"
                                    sx={{ display: { xs: 'none', sm: 'inline-flex' }, minWidth: 0, px: { sm: 1.5 } }}
                                >
                                    {t('common.login')}
                                </Button>
                                <Button
                                    variant="contained"
                                    component={RouterLink}
                                    to="/dashboard"
                                    size={isXs ? 'small' : 'medium'}
                                    sx={{
                                        minWidth: 0,
                                        px: { xs: 1.5, sm: 2 },
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {isXs ? t('common.getStartedShort') : t('common.getStarted')}
                                </Button>
                            </Box>
                        ) : (
                            <>
                                <Tooltip title={t('nav.openSettings')}>
                                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                        <Avatar alt={user?.name} src="/static/images/avatar/2.jpg" sx={{ width: 36, height: 36 }} />
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
                                    <Box sx={{ px: 2, py: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {user?.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {user?.phoneNumber || user?.mobile || t('nav.account')}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    {userPages.map((page) => (
                                        <MenuItem
                                            key={page.nameKey}
                                            onClick={handleCloseUserMenu}
                                            component={RouterLink}
                                            to={page.path}
                                        >
                                            <Typography textAlign="center">{t(page.nameKey)}</Typography>
                                        </MenuItem>
                                    ))}
                                    <MenuItem
                                        onClick={() => {
                                            handleCloseUserMenu();
                                            void logout();
                                        }}
                                    >
                                        <Typography textAlign="center" color="error">
                                            {t('common.logout')}
                                        </Typography>
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
