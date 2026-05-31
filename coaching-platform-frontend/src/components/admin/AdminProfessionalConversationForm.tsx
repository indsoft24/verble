import React from 'react';
import { Alert, Box, Button, Grid, TextField, Typography } from '@mui/material';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { emptyDialogueLine } from '../../utils/adminDailyContentDefaults';

type Line = ReturnType<typeof emptyDialogueLine>;

export interface AdminProfessionalConversationFormProps {
    metadata: Record<string, unknown>;
    onChange: (field: string, value: unknown) => void;
    displayTitle?: string;
    onDisplayTitleChange?: (value: string) => void;
}

function getDialogue(metadata: Record<string, unknown>): Line[] {
    const raw = metadata.dialogue as Line[] | undefined;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return Array.from({ length: 5 }, emptyDialogueLine);
}

const AdminProfessionalConversationForm: React.FC<AdminProfessionalConversationFormProps> = ({
    metadata,
    onChange,
    displayTitle = '',
    onDisplayTitleChange,
}) => {
    const topicName =
        (metadata.topicName as string) || displayTitle || (metadata.title as string) || '';
    const tagsInput = Array.isArray(metadata.tags)
        ? (metadata.tags as string[]).join(', ')
        : '';
    const dialogue = getDialogue(metadata);

    return (
        <Box sx={{ mt: 1 }}>
            <Alert severity="info" icon={<RecordVoiceOverIcon />} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                    Gold: Professional Conversations
                </Typography>
            </Alert>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Topic name"
                        value={topicName}
                        onChange={(e) => {
                            onChange('topicName', e.target.value);
                            onDisplayTitleChange?.(e.target.value);
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Tags (comma-separated)"
                        value={tagsInput}
                        onChange={(e) =>
                            onChange(
                                'tags',
                                e.target.value.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
                            )
                        }
                    />
                </Grid>
            </Grid>
            <Button
                size="small"
                sx={{ mb: 1 }}
                onClick={() => onChange('dialogue', [...dialogue, emptyDialogueLine()])}
            >
                Add line
            </Button>
            {dialogue.map((line, idx) => (
                <Box key={idx} sx={{ p: 2, mb: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Speaker"
                        value={line.speaker || ''}
                        sx={{ mb: 1 }}
                        onChange={(e) => {
                            const next = [...dialogue];
                            next[idx] = { ...next[idx], speaker: e.target.value };
                            onChange('dialogue', next);
                        }}
                    />
                    <TextField
                        fullWidth
                        label="English"
                        multiline
                        rows={2}
                        value={line.text_en || ''}
                        sx={{ mb: 1 }}
                        onChange={(e) => {
                            const next = [...dialogue];
                            next[idx] = { ...next[idx], text_en: e.target.value };
                            onChange('dialogue', next);
                        }}
                    />
                    <TextField
                        fullWidth
                        label="Hindi"
                        multiline
                        rows={2}
                        value={line.text_hi || ''}
                        onChange={(e) => {
                            const next = [...dialogue];
                            next[idx] = { ...next[idx], text_hi: e.target.value };
                            onChange('dialogue', next);
                        }}
                    />
                </Box>
            ))}
        </Box>
    );
};

export default AdminProfessionalConversationForm;
