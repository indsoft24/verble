// src/pages/AdminWebinarLeadsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';
import { getRecentLeadsAdmin, type AdminLead } from '../services/adminLeadService';
import {
    Box,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Alert,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';

const AdminWebinarLeadsPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Webinar Leads' });
    const [leads, setLeads] = useState<AdminLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentLeadsAdmin(100);
            setLeads(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load leads.');
            setLeads([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    return (            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ bgcolor: 'info.50', p: 1, borderRadius: 2, display: 'flex' }}>
                        <CampaignIcon color="info" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="h5" fontWeight={700}>
                            Webinar lead registrations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Latest 100 submissions (newest first).
                        </Typography>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : leads.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        No leads yet.
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead._id} hover>
                                        <TableCell>{lead.name}</TableCell>
                                        <TableCell>{lead.email}</TableCell>
                                        <TableCell>{lead.phoneNumber}</TableCell>
                                        <TableCell>{lead.sourceType || 'general'}</TableCell>
                                        <TableCell>{new Date(lead.createdAt).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
    );
};

export default AdminWebinarLeadsPage;
