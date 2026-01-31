import React, { useEffect, useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import UserSidebar from './UserSidebar';

interface UserLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children, title: titleProp = 'My Dashboard' }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile);

    useEffect(() => {
        setSidebarOpen(!isMobile);
    }, [isMobile]);

    useEffect(() => {
        document.title = titleProp ? `${titleProp} | Coaching Platform` : 'Coaching Platform';
    }, [titleProp]);

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
            <UserSidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
            
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { md: `calc(100% - ${sidebarOpen ? 280 : 64}px)` },
                    transition: theme.transitions.create(['width', 'margin'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    bgcolor: 'grey.50',
                    minHeight: '100vh',
                }}
            >
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default UserLayout;

