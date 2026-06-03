import React from 'react';
import {
    Alert,
    Box,
    Button,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import CommaSeparatedTextField from '../common/CommaSeparatedTextField';
import { emptyDialogueLine } from '../../utils/adminDailyContentDefaults';

type Line = ReturnType<typeof emptyDialogueLine>;

export interface AdminProfessionalConversationFormProps {
    metadata: Record<string, unknown>;
    onChange: (field: string, value: unknown) => void;
    displayTitle?: string;
    onDisplayTitleChange?: (value: string) => void;
    /** Resets comma-separated fields when switching create/edit records */
    syncKey?: string;
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
    syncKey,
}) => {
    const topicName =
        (metadata.topicName as string) || displayTitle || (metadata.title as string) || '';
    const description = (metadata.description as string) || '';
    const tags = Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [];
    const relatedContentIds = Array.isArray(metadata.relatedContentIds)
        ? (metadata.relatedContentIds as string[])
        : [];
    const dialogue = getDialogue(metadata);

    const updateLine = (idx: number, patch: Partial<Line>) => {
        const next = [...dialogue];
        next[idx] = { ...next[idx], ...patch };
        onChange('dialogue', next);
    };

    return (
        <Box sx={{ mt: 1 }}>
            <Alert severity="info" icon={<RecordVoiceOverIcon />} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Gold: Professional Conversations library
                </Typography>
                <Typography variant="body2">
                    Curriculum-style entry: topic, tags (for related conversations on the learner site), optional
                    description, and a dialogue script table. Related IDs are optional MongoDB content IDs (comma-separated).
                </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                    Topic &amp; metadata
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Topic name"
                            placeholder="e.g. Job interview — introducing yourself"
                            value={topicName}
                            onChange={(e) => {
                                onChange('topicName', e.target.value);
                                onChange('title', e.target.value);
                                onDisplayTitleChange?.(e.target.value);
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <CommaSeparatedTextField
                            fullWidth
                            label="Tags"
                            placeholder="interview, workplace, formal"
                            value={tags}
                            syncKey={syncKey}
                            onChange={(next) => onChange('tags', next)}
                            helperText="Learners see related conversations with matching tags"
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Short description (learner library card)"
                            multiline
                            minRows={2}
                            value={description}
                            onChange={(e) => onChange('description', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <CommaSeparatedTextField
                            fullWidth
                            label="Related content IDs (optional)"
                            placeholder="id1, id2"
                            value={relatedContentIds}
                            syncKey={syncKey}
                            parseOptions={{ dedupeCaseInsensitive: false }}
                            onChange={(next) => onChange('relatedContentIds', next)}
                            helperText="Pin specific conversation documents as related (otherwise tags are used)"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                    Dialogue script
                </Typography>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onChange('dialogue', [...dialogue, emptyDialogueLine()])}
                >
                    Add line
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell width={44}>#</TableCell>
                            <TableCell width="18%">Speaker</TableCell>
                            <TableCell>English</TableCell>
                            <TableCell>Hindi</TableCell>
                            <TableCell width={44} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dialogue.map((line, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Interviewer"
                                        value={line.speaker || ''}
                                        onChange={(e) => updateLine(idx, { speaker: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        multiline
                                        minRows={2}
                                        value={line.text_en || ''}
                                        onChange={(e) => updateLine(idx, { text_en: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        multiline
                                        minRows={2}
                                        value={line.text_hi || ''}
                                        onChange={(e) => updateLine(idx, { text_hi: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        disabled={dialogue.length <= 1}
                                        onClick={() =>
                                            onChange(
                                                'dialogue',
                                                dialogue.filter((_, i) => i !== idx)
                                            )
                                        }
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AdminProfessionalConversationForm;
