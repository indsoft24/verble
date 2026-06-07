import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import UserLayout from './UserLayout';
import { UserLayoutConfigProvider, useUserLayoutConfig } from '../../contexts/UserLayoutConfigContext';

const OutletFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', gap: 2 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Loading…</Typography>
    </Box>
);

const UserLayoutOutlet: React.FC = () => {
    const { title, fullWidth, variant } = useUserLayoutConfig();
    return (
        <UserLayout title={title} fullWidth={fullWidth} variant={variant}>
            <Suspense fallback={<OutletFallback />}>
                <Outlet />
            </Suspense>
        </UserLayout>
    );
};

/**
 * Persistent user-app chrome: sidebar and mobile header stay mounted; only Outlet content swaps.
 */
const UserAppShell: React.FC = () => (
    <UserLayoutConfigProvider>
        <UserLayoutOutlet />
    </UserLayoutConfigProvider>
);

export default UserAppShell;
