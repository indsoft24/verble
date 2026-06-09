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
import { ACTIVITY_PAGE_BG } from '../../utils/dailyActivityUi';

interface UserLayoutProps {
    children: React.ReactNode;
    title?: string;
    /** Less padding for full-width content (e.g. video player) */
    fullWidth?: boolean;
    /** Dark Full Course learning pages; activity = daily content detail */
    variant?: 'default' | 'learning' | 'conversations' | 'activity';
}

const UserLayout: React.FC<UserLayoutProps> = ({
    children,
    title: titleProp = 'My Dashboard',
    fullWidth = false,
    variant = 'default',
}) => {
    const isLearning = variant === 'learning';
    const isConversations = variant === 'conversations';
    const isActivity = variant === 'activity';
    const isDarkMain = isLearning || isConversations || isActivity;
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
          : isActivity
            ? ACTIVITY_PAGE_BG
            : learnerBrandTheme.pageBg;

    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: mainBg,
                backgroundImage: !isDarkMain && !isConversations ? learnerBrandTheme.pageBgGradient : 'none',
                '& .MuiPaper-root:not(.daily-activity-card)': !isDarkMain
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
                            bgcolor: isDarkMain
                                ? isActivity
                                    ? ACTIVITY_PAGE_BG
                                    : courseLearningTheme.bandBg
                                : learnerBrandTheme.surface,
                            borderBottom: '1px solid',
                            borderColor: isDarkMain
                                ? alpha(courseLearningTheme.accent, 0.25)
                                : learnerBrandTheme.border,
                            color: isDarkMain
                                ? isActivity
                                    ? '#f8fafc'
                                    : courseLearningTheme.textPrimary
                                : learnerBrandTheme.textPrimary,
                            zIndex: theme.zIndex.drawer + 1,
                        }}
                    >
                        <Toolbar sx={{ minHeight: 56, gap: 1, px: 1.5, minWidth: 0 }}>
                            <IconButton
                                onClick={handleSidebarToggle}
                                edge="start"
                                aria-label="Open menu"
                                sx={{
                                    flexShrink: 0,
                                    ...(isDarkMain
                                        ? { color: isActivity ? '#f8fafc' : courseLearningTheme.textPrimary }
                                        : { color: learnerBrandTheme.icon }),
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Typography
                                variant="subtitle1"
                                component="h1"
                                sx={{
                                    flex: 1,
                                    fontWeight: 700,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {titleProp}
                            </Typography>
                            <Box
                                component="img"
                                src={brandAssets.primaryLogo}
                                alt="Verble"
                                sx={{
                                    height: { xs: 26, sm: 32 },
                                    width: 'auto',
                                    maxWidth: { xs: 72, sm: 120 },
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                }}
                            />
                        </Toolbar>
                    </AppBar>
                )}

                <Box
                    sx={{
                        flexGrow: 1,
                        p: fullWidth
                            ? { xs: 0, sm: 0 }
                            : isActivity
                              ? { xs: 1, sm: 2, md: 3 }
                              : isDarkMain
                                ? { xs: 0, sm: 0 }
                                : { xs: 2, sm: 3 },
                        maxWidth: fullWidth || (isDarkMain && !isActivity) ? 'none' : '1600px',
                        mx: fullWidth || (isDarkMain && !isActivity) ? 0 : 'auto',
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
