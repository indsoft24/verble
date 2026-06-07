import React, { useEffect, useState } from 'react';
import { Box, useTheme, useMediaQuery, AppBar, Toolbar, Typography, IconButton, Breadcrumbs, Link } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminSidebar from './AdminSidebar';
import { useAdminLayoutConfig } from '../../contexts/AdminLayoutConfigContext';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title: titleProp }) => {
    const { title: contextTitle } = useAdminLayoutConfig();
    const title = titleProp ?? contextTitle ?? 'Admin Panel';
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);

    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        document.title = `${title} | Admin`;
    }, [title]);

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const drawerWidth = sidebarOpen ? 240 : 72;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <AdminSidebar open={sidebarOpen} onToggle={handleSidebarToggle} />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Modern Top App Bar */}
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        color: 'text.primary',
                        zIndex: theme.zIndex.drawer + 1
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {isMobile && (
                                <IconButton onClick={handleSidebarToggle} edge="start">
                                    <MenuIcon />
                                </IconButton>
                            )}
                            <Box>
                                <Breadcrumbs aria-label="breadcrumb">
                                    <Link underline="hover" color="inherit" href="/admin/dashboard" sx={{ fontSize: '0.875rem' }}>
                                        Admin
                                    </Link>
                                    <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {title}
                                    </Typography>
                                </Breadcrumbs>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Potential for search, notifications, profile actions here */}
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box sx={{
                    p: { xs: 2, md: 4, lg: 6 },
                    flexGrow: 1,
                    maxWidth: '1600px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;

