import React from 'react';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Drawer,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Avatar,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    School as SchoolIcon,
    PlaylistPlay as PlaylistPlayIcon,
    Person as PersonIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Home as HomeIcon,
    Logout as LogoutIcon,
    Subscriptions as SubscriptionsIcon,
    HelpOutline as HelpOutlineIcon,
    EmojiEvents as EmojiEventsIcon,
    AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { learnerBrandTheme } from './learnerBrandTheme';
import { canAccessGoldTierContent } from '../../utils/userAccessState';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;

interface UserSidebarProps {
    open: boolean;
    onToggle: () => void;
}

interface MenuItem {
    title: string;
    path: string;
    icon: React.ReactNode;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ open, onToggle }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, logout } = useAuth();
    const showAIPrompts = Boolean(user && canAccessGoldTierContent(user));

    const menuItems: MenuItem[] = [
        {
            title: 'Dashboard',
            path: '/dashboard',
            icon: <DashboardIcon />,
        },
        {
            title: 'My Courses',
            path: '/my-courses',
            icon: <SchoolIcon />,
        },
        {
            title: 'My Subscription',
            path: '/my-subscription',
            icon: <SubscriptionsIcon />,
        },
        {
            title: 'Subscription Plans',
            path: '/subscription-plans',
            icon: <PlaylistPlayIcon />,
        },
        {
            title: 'Rewards & Scoring',
            path: '/my-rewards',
            icon: <EmojiEventsIcon />,
        },
        ...(showAIPrompts
            ? [
                  {
                      title: 'AI Prompt Guides',
                      path: '/ai-prompts',
                      icon: <AutoAwesomeIcon />,
                  } satisfies MenuItem,
              ]
            : []),
        {
            title: 'Profile Settings',
            path: '/profile',
            icon: <PersonIcon />,
        },
        {
            title: 'Help Center',
            path: '/help',
            icon: <HelpOutlineIcon />,
        },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === path;
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const renderMenuItem = (item: MenuItem) => {
        const active = isActive(item.path);

        return (
            <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={!open ? item.title : ''} placement="right">
                    <ListItemButton
                        component={RouterLink}
                        to={item.path}
                        onClick={isMobile ? onToggle : undefined}
                        selected={active}
                        sx={{
                            minHeight: 48,
                            justifyContent: open ? 'initial' : 'center',
                            px: 2.5,
                            backgroundColor: active ? learnerBrandTheme.sidebarActiveBg : 'transparent',
                            borderLeft: active
                                ? `3px solid ${learnerBrandTheme.sidebarActiveBorder}`
                                : '3px solid transparent',
                            '&:hover': {
                                backgroundColor: learnerBrandTheme.sidebarHoverBg,
                            },
                            '&.Mui-selected': {
                                backgroundColor: learnerBrandTheme.sidebarActiveBg,
                                '&:hover': {
                                    backgroundColor: learnerBrandTheme.sidebarHoverBg,
                                },
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: open ? 3 : 'auto',
                                justifyContent: 'center',
                                color: active ? learnerBrandTheme.accent : learnerBrandTheme.textSecondary,
                            }}
                        >
                            {item.icon}
                        </ListItemIcon>
                        {open && (
                            <ListItemText
                                primary={item.title}
                                primaryTypographyProps={{
                                    fontSize: '0.95rem',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? learnerBrandTheme.accent : learnerBrandTheme.textPrimary,
                                }}
                            />
                        )}
                    </ListItemButton>
                </Tooltip>
            </ListItem>
        );
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'space-between' : 'center',
                    p: 2,
                    minHeight: 64,
                    borderBottom: `1px solid ${learnerBrandTheme.border}`,
                    bgcolor: learnerBrandTheme.sidebarBg,
                }}
            >
                {open && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: learnerBrandTheme.accent,
                                width: 40,
                                height: 40,
                            }}
                        >
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                noWrap
                                sx={{ color: learnerBrandTheme.textPrimary }}
                            >
                                {user?.name || 'User'}
                            </Typography>
                        </Box>
                    </Box>
                )}
                {!isMobile && (
                    <IconButton
                        onClick={onToggle}
                        size="small"
                        sx={{ ml: open ? 1 : 0, color: learnerBrandTheme.icon }}
                    >
                        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                )}
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
                <List>
                    {menuItems.map((item) => renderMenuItem(item))}
                </List>
            </Box>

            <Divider sx={{ borderColor: learnerBrandTheme.border }} />

            {/* Footer Actions */}
            <Box sx={{ p: 1 }}>
                <ListItemButton
                    component={RouterLink}
                    to="/"
                    sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: 1,
                        mb: 1,
                        color: learnerBrandTheme.textPrimary,
                        '&:hover': { backgroundColor: learnerBrandTheme.sidebarHoverBg },
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                            color: learnerBrandTheme.icon,
                        }}
                    >
                        <HomeIcon />
                    </ListItemIcon>
                    {open && <ListItemText primary="Back to Site" />}
                </ListItemButton>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        borderRadius: 1,
                        color: theme.palette.error.main,
                        '&:hover': {
                            backgroundColor: theme.palette.error.light + '20',
                        },
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                            color: theme.palette.error.main,
                        }}
                    >
                        <LogoutIcon />
                    </ListItemIcon>
                    {open && <ListItemText primary="Logout" />}
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? open : true}
            onClose={isMobile ? onToggle : undefined}
            ModalProps={{ keepMounted: true }}
            sx={{
                width: isMobile ? DRAWER_WIDTH : open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: isMobile ? DRAWER_WIDTH : open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                    boxSizing: 'border-box',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                    borderRight: `1px solid ${learnerBrandTheme.border}`,
                    bgcolor: learnerBrandTheme.sidebarBg,
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default UserSidebar;

