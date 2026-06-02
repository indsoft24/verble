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
import { alpha } from '@mui/material/styles';
import { courseLearningTheme } from '../course/courseLearningTheme';
import { conversationPageBg } from '../features/conversationExperienceStyles';
import { learnerBrandTheme } from './learnerBrandTheme';

interface UserLayoutProps {
    children: React.ReactNode;
    title?: string;
    /** Less padding for full-width content (e.g. video player) */
    fullWidth?: boolean;
    /** Dark Full Course learning pages */
    variant?: 'default' | 'learning' | 'conversations';
}

const UserLayout: React.FC<UserLayoutProps> = ({
    children,
    title: titleProp = 'My Dashboard',
    fullWidth = false,
    variant = 'default',
}) => {
    const isLearning = variant === 'learning';
    const isConversations = variant === 'conversations';
    const isDarkMain = isLearning || isConversations;
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

    const mainBg = isConversations
        ? conversationPageBg
        : isLearning
          ? courseLearningTheme.pageBg
          : learnerBrandTheme.pageBg;

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: mainBg,
                backgroundImage: !isDarkMain && !isConversations ? learnerBrandTheme.pageBgGradient : 'none',
                '& .MuiPaper-root': !isDarkMain
                    ? {
                          bgcolor: learnerBrandTheme.surface,
                          borderColor: learnerBrandTheme.border,
                      }
                    : {},
                '& .MuiSvgIcon-root': !isDarkMain ? { color: learnerBrandTheme.icon } : {},
            }}
        >
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
                    bgcolor: mainBg,
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
                            bgcolor: isDarkMain ? courseLearningTheme.bandBg : learnerBrandTheme.surface,
                            borderBottom: '1px solid',
                            borderColor: isDarkMain
                                ? alpha(courseLearningTheme.accent, 0.25)
                                : learnerBrandTheme.border,
                            color: isDarkMain ? courseLearningTheme.textPrimary : learnerBrandTheme.textPrimary,
                            zIndex: theme.zIndex.drawer + 1,
                        }}
                    >
                        <Toolbar sx={{ minHeight: 56, gap: 1, px: 1.5 }}>
                            <IconButton
                                onClick={handleSidebarToggle}
                                edge="start"
                                aria-label="Open menu"
                                sx={
                                    isDarkMain
                                        ? { color: courseLearningTheme.textPrimary }
                                        : { color: learnerBrandTheme.icon }
                                }
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
                        p: fullWidth || isDarkMain ? { xs: 0, sm: 0 } : { xs: 2, sm: 3 },
                        maxWidth: fullWidth || isDarkMain ? 'none' : '1600px',
                        mx: fullWidth || isDarkMain ? 0 : 'auto',
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
