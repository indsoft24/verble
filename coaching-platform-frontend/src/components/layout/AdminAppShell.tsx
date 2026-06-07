import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import AdminLayout from './AdminLayout';
import { AdminLayoutConfigProvider } from '../../contexts/AdminLayoutConfigContext';

const OutletFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', gap: 2 }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Loading…</Typography>
    </Box>
);

/**
 * Persistent admin chrome: sidebar and header stay mounted; only Outlet content swaps.
 */
const AdminAppShell: React.FC = () => (
    <AdminLayoutConfigProvider>
        <AdminLayout>
            <Suspense fallback={<OutletFallback />}>
                <Outlet />
            </Suspense>
        </AdminLayout>
    </AdminLayoutConfigProvider>
);

export default AdminAppShell;
