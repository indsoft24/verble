import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    getAdminLearningSettings,
    updateAdminLearningSettings,
    type LearningSettings,
} from '../services/adminLearningSettingsService';
import { useAdminLayoutPage } from '../contexts/AdminLayoutConfigContext';

const AdminLearningSettingsPage: React.FC = () => {
    useAdminLayoutPage({ title: 'Learning settings' });
    const [settings, setSettings] = useState<LearningSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAdminLearningSettings();
            setSettings(data);
        } catch (err: unknown) {
            const e = err as { message?: string; response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || e.message || 'Failed to load settings.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const updated = await updateAdminLearningSettings(settings);
            setSettings(updated);
            setSuccess(true);
        } catch (err: unknown) {
            const e = err as { message?: string; response?: { data?: { message?: string } } };
            setError(e.response?.data?.message || e.message || 'Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 640 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Global learning rules
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Module completion cycles, per-video watch limits per cycle, and whether passing a quiz unlocks the
                    next module.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                        Settings saved.
                    </Alert>
                )}

                {isLoading ? (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 4 }}>
                        <CircularProgress size={28} />
                        <Typography color="text.secondary">Loading…</Typography>
                    </Box>
                ) : settings ? (
                    <Paper sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            <TextField
                                label="Module completion cycles"
                                type="number"
                                inputProps={{ min: 1, max: 10 }}
                                value={settings.maxModuleCompletionCycles}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        maxModuleCompletionCycles: Number(e.target.value),
                                    })
                                }
                                helperText="How many full module watch-throughs before max limits apply (default 4)."
                                fullWidth
                            />
                            <TextField
                                label="Max watches per video per cycle"
                                type="number"
                                inputProps={{ min: 1, max: 20 }}
                                value={settings.maxWatchesPerVideoPerCycle}
                                onChange={(e) =>
                                    setSettings({
                                        ...settings,
                                        maxWatchesPerVideoPerCycle: Number(e.target.value),
                                    })
                                }
                                helperText="Times a learner can mark each video complete within one cycle (default 4)."
                                fullWidth
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={settings.requireQuizToUnlockNextModule}
                                        onChange={(e) =>
                                            setSettings({
                                                ...settings,
                                                requireQuizToUnlockNextModule: e.target.checked,
                                            })
                                        }
                                    />
                                }
                                label="Require quiz pass to unlock next module"
                            />
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    Save
                                </Button>
                                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={isSaving}>
                                    Reload
                                </Button>
                            </Stack>
                        </Stack>
                    </Paper>
                ) : null}
            </Box>
    );
};

export default AdminLearningSettingsPage;
