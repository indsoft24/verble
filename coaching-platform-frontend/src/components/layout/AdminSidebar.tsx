import React, { useState, useEffect } from 'react';
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
    Collapse,
    Tooltip,
    useTheme,
    useMediaQuery,
    Avatar,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    VideoLibrary as VideoLibraryIcon,
    PlaylistPlay as PlaylistPlayIcon,
    School as SchoolIcon,
    Folder as FolderIcon,
    Article as ArticleIcon,
    Category as CategoryIcon,
    Psychology as PsychologyIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    ExpandLess,
    ExpandMore,
    Home as HomeIcon,
    Logout as LogoutIcon,
    RateReview as RateReviewIcon,
    CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 72;

interface AdminSidebarProps {
    open: boolean;
    onToggle: () => void;
}

interface MenuItem {
    title: string;
    path?: string;
    icon: React.ReactNode;
    children?: MenuItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onToggle }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, logout } = useAuth();

    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Auto-expand parent section when current path is under that section
    useEffect(() => {
        const path = location.pathname;
        const sections: { name: string; paths: string[] }[] = [
            { name: 'Content Management', paths: ['/admin/daily-content', '/admin/blog', '/admin/videos', '/admin/courses', '/admin/modules', '/admin/exam-categories'] },
            { name: 'User Management', paths: ['/admin/users'] },
            { name: 'Subscriptions', paths: ['/admin/subscription-plans'] },
            { name: 'AI & Knowledge', paths: ['/admin/knowledgebase'] },
            { name: 'Validation', paths: ['/admin/sentence-validation'] },
        ];
        const toExpand: string[] = [];
        for (const { name, paths } of sections) {
            const isUnder = paths.some((p) => path === p || path.startsWith(p + '/'));
            if (isUnder) toExpand.push(name);
        }
        if (toExpand.length > 0) {
            setExpandedItems((prev) => {
                const next = new Set(prev);
                toExpand.forEach((name) => next.add(name));
                return [...next];
            });
        }
    }, [location.pathname]);

    const menuItems: MenuItem[] = [
        {
            title: 'Dashboard',
            path: '/admin/dashboard',
            icon: <DashboardIcon />,
        },
        {
            title: 'Content Management',
            icon: <ArticleIcon />,
            children: [
                {
                    title: 'Daily Content',
                    path: '/admin/daily-content',
                    icon: <CalendarTodayIcon />,
                },
                {
                    title: 'Blog Posts',
                    path: '/admin/blog',
                    icon: <ArticleIcon />,
                },
                {
                    title: 'Videos',
                    path: '/admin/videos',
                    icon: <VideoLibraryIcon />,
                },
                {
                    title: 'Courses',
                    path: '/admin/courses',
                    icon: <SchoolIcon />,
                },
                {
                    title: 'Modules',
                    path: '/admin/modules',
                    icon: <FolderIcon />,
                },
                {
                    title: 'Exam Categories',
                    path: '/admin/exam-categories',
                    icon: <CategoryIcon />,
                },
            ],
        },
        {
            title: 'User Management',
            icon: <PeopleIcon />,
            children: [
                {
                    title: 'All Users',
                    path: '/admin/users',
                    icon: <PeopleIcon />,
                },
            ],
        },
        {
            title: 'Subscriptions',
            icon: <PlaylistPlayIcon />,
            children: [
                {
                    title: 'Subscription Plans',
                    path: '/admin/subscription-plans',
                    icon: <PlaylistPlayIcon />,
                },
            ],
        },
        {
            title: 'AI & Knowledge',
            icon: <PsychologyIcon />,
            children: [
                {
                    title: 'Knowledge Base',
                    path: '/admin/knowledgebase',
                    icon: <PsychologyIcon />,
                },
            ],
        },
        {
            title: 'Validation',
            icon: <RateReviewIcon />,
            children: [
                {
                    title: 'Sentence Validation',
                    path: '/admin/sentence-validation',
                    icon: <RateReviewIcon />,
                },
            ],
        },
    ];

    const handleToggleExpand = (title: string) => {
        setExpandedItems((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [...prev, title]
        );
    };

    const isActive = (path?: string) => {
        if (!path) return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const renderMenuItem = (item: MenuItem, level: number = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.title);
        const active = isActive(item.path);

        if (hasChildren) {
            return (
                <React.Fragment key={item.title}>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            onClick={() => handleToggleExpand(item.title)}
                            sx={{
                                minHeight: 40,
                                justifyContent: open ? 'initial' : 'center',
                                px: 2,
                                pl: level > 0 ? 4 : 2,
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    '& .MuiListItemIcon-root': { color: '#fff' }
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 1.5 : 'auto',
                                    justifyContent: 'center',
                                    color: active ? '#fff' : 'inherit',
                                }}
                            >
                                <Box sx={{ fontSize: '1.2rem', display: 'flex' }}>{item.icon}</Box>
                            </ListItemIcon>
                            {open && (
                                <>
                                    <ListItemText
                                        primary={item.title}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: active ? 600 : 500,
                                            color: active ? '#fff' : 'inherit',
                                        }}
                                    />
                                    {isExpanded ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
                                </>
                            )}
                        </ListItemButton>
                    </ListItem>
                    {open && (
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {item.children?.map((child) => renderMenuItem(child, level + 1))}
                            </List>
                        </Collapse>
                    )}
                </React.Fragment>
            );
        }

        return (
            <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={!open ? item.title : ''} placement="right">
                    <ListItemButton
                        component={item.path ? RouterLink : 'div'}
                        to={item.path}
                        selected={active}
                        sx={{
                            minHeight: 40,
                            justifyContent: open ? 'initial' : 'center',
                            px: 2,
                            pl: level > 0 ? 4 : 2,
                            backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: active ? '#fff' : 'inherit',
                            borderRadius: '0 20px 20px 0',
                            mr: 2,
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                '& .MuiListItemIcon-root': { color: '#fff' }
                            },
                            '&.Mui-selected': {
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                color: '#fff',
                                '& .MuiListItemIcon-root': { color: '#fff' },
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.12)',
                                },
                            },
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: open ? 1.5 : 'auto',
                                justifyContent: 'center',
                                color: active ? '#fff' : 'inherit',
                            }}
                        >
                            <Box sx={{ fontSize: '1.2rem', display: 'flex' }}>{item.icon}</Box>
                        </ListItemIcon>
                        {open && (
                            <ListItemText
                                primary={item.title}
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    fontWeight: active ? 600 : 500,
                                    color: active ? '#fff' : 'inherit',
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
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                {open && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                width: 28,
                                height: 28,
                                fontSize: '0.875rem',
                            }}
                        >
                            A
                        </Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.875rem', lineHeight: 1.2, color: 'white', display: 'block' }}>
                                Verble Admin
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', lineHeight: 1.2, color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                                {user?.name || 'Administrator'}
                            </Typography>
                        </Box>
                    </Box>
                )}
                <IconButton onClick={onToggle} size="small" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
                <List>
                    {menuItems.map((item) => renderMenuItem(item))}
                </List>
            </Box>

            <Divider />

            {/* Footer Actions */}
            <Box sx={{ p: 1 }}>
                <ListItemButton
                    component={RouterLink}
                    to="/"
                    sx={{
                        minHeight: 40,
                        justifyContent: open ? 'initial' : 'center',
                        px: 1.5,
                        borderRadius: 1,
                        mb: 1,
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: open ? 2 : 'auto',
                            justifyContent: 'center',
                        }}
                    >
                        <HomeIcon fontSize="small" />
                    </ListItemIcon>
                    {open && <ListItemText primary="Back to Site" primaryTypographyProps={{ fontSize: '0.8rem' }} />}
                </ListItemButton>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        minHeight: 40,
                        justifyContent: open ? 'initial' : 'center',
                        px: 1.5,
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
                            mr: open ? 2 : 'auto',
                            justifyContent: 'center',
                            color: theme.palette.error.main,
                        }}
                    >
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    {open && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.8rem' }} />}
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? open : true}
            onClose={isMobile ? onToggle : undefined}
            sx={{
                width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
                    boxSizing: 'border-box',
                    transition: theme.transitions.create('width', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                    overflowX: 'hidden',
                    bgcolor: '#0f172a', // Slate 900
                    color: 'rgba(255,255,255,0.7)',
                    borderRight: 'none',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default AdminSidebar;

