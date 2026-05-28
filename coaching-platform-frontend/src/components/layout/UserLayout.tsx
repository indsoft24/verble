import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import UserSidebar from './UserSidebar';
import { brandAssets } from '../../assets/brandAssets';

interface UserLayoutProps {
    children: React.ReactNode;
    title?: string;
    /** Less padding for full-width content (e.g. video player) */
    fullWidth?: boolean;
}

const UserLayout: React.FC<UserLayoutProps> = ({
    children,
    title: titleProp = 'My Dashboard',
    fullWidth = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);

    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    useEffect(() => {
        document.title = titleProp ? `${titleProp} | Verble` : 'Verble';
    }, [titleProp]);

    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
    };

    const drawerWidth = sidebarOpen ? 280 : 64;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
            <UserSidebar open={sidebarOpen} onToggle={handleSidebarToggle} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
                    minWidth: 0,
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    bgcolor: 'grey.50',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {isMobile && (
                    <AppBar
                        position="sticky"
                        elevation={0}
                        sx={{
                            bgcolor: 'background.paper',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            color: 'text.primary',
                            zIndex: theme.zIndex.drawer + 1,
                        }}
                    >
                        <Toolbar sx={{ minHeight: 56, gap: 1, px: 1.5 }}>
                            <IconButton
                                onClick={handleSidebarToggle}
                                edge="start"
                                aria-label="Open menu"
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography
                                variant="subtitle1"
                                component="h1"
                                sx={{ flexGrow: 1, fontWeight: 700, minWidth: 0 }}
                                noWrap
                            >
                                {titleProp}
                            </Typography>
                            <Box
                                component="img"
                                src={brandAssets.primaryLogo}
                                alt="Verble"
                                sx={{ height: 32, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
                            />
                        </Toolbar>
                    </AppBar>
                )}

                <Box
                    sx={{
                        flexGrow: 1,
                        p: fullWidth ? { xs: 1, sm: 2 } : { xs: 2, sm: 3 },
                        maxWidth: fullWidth ? 'none' : '1600px',
                        mx: fullWidth ? 0 : 'auto',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default UserLayout;
