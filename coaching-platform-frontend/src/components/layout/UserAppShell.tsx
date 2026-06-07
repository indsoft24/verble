import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import UserLayout from './UserLayout';
import { UserLayoutConfigProvider } from '../../contexts/UserLayoutConfigContext';

const OutletFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', gap: 2 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Loading…</Typography>
    </Box>
);

/**
 * Persistent user-app chrome: sidebar and mobile header stay mounted; only Outlet content swaps.
 */
const UserAppShell: React.FC = () => (
    <UserLayoutConfigProvider>
        <UserLayout>
            <Suspense fallback={<OutletFallback />}>
                <Outlet />
            </Suspense>
        </UserLayout>
    </UserLayoutConfigProvider>
);

export default UserAppShell;
