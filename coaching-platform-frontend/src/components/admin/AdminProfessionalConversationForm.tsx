import React, { useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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
import CreatableTagsField from '../common/CreatableTagsField';
import { emptyDialogueLine } from '../../utils/adminDailyContentDefaults';
import {
    getConversationParticipants,
    isParticipant2Speaker,
    repairDialogueLine,
} from '../../utils/conversationDialogueUtils';
import { collectProfessionalConversationTagOptions } from '../../utils/professionalConversationLibraryUtils';
import { getAllDailyContentAdmin } from '../../services/dailyContentAdminService';

type Line = ReturnType<typeof emptyDialogueLine>;

export interface AdminProfessionalConversationFormProps {
    metadata: Record<string, unknown>;
    onChange: (field: string, value: unknown) => void;
    displayTitle?: string;
    onDisplayTitleChange?: (value: string) => void;
    /** Resets comma-separated fields when switching create/edit records */
    syncKey?: string;
}

function getDialogue(metadata: Record<string, unknown>, participant1: string): Line[] {
    const p1 = participant1.trim() || 'Interviewer';
    const { participant2 } = getConversationParticipants(metadata);
    const p2 = participant2.trim() || 'Candidate';
    const raw = metadata.dialogue as Line[] | undefined;
    if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((line) => {
            const repaired = repairDialogueLine(line, p1, p2);
            return {
                speaker: repaired.speaker,
                text_en: repaired.text_en,
                text_hi: repaired.text_hi,
                audio: repaired.audio ?? '',
            };
        });
    }
    return Array.from({ length: 5 }, () => ({ ...emptyDialogueLine(), speaker: p1 }));
}

const AdminProfessionalConversationForm: React.FC<AdminProfessionalConversationFormProps> = ({
    metadata,
    onChange,
    displayTitle = '',
    onDisplayTitleChange,
    syncKey,
}) => {
    const { participant1, participant2 } = getConversationParticipants(metadata);
    const topicName =
        (metadata.topicName as string) || displayTitle || (metadata.title as string) || '';
    const description = (metadata.description as string) || '';
    const tags = Array.isArray(metadata.tags) ? (metadata.tags as string[]) : [];
    const relatedContentIds = Array.isArray(metadata.relatedContentIds)
        ? (metadata.relatedContentIds as string[])
        : [];
    const dialogue = getDialogue(metadata, participant1);
    const [tagOptions, setTagOptions] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { content } = await getAllDailyContentAdmin({
                    type: 'CONVERSATION',
                    level: 'GOLD',
                    limit: 500,
                });
                if (!cancelled) {
                    setTagOptions(collectProfessionalConversationTagOptions(content));
                }
            } catch {
                if (!cancelled) setTagOptions([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const updateParticipants = (p1: string, p2: string) => {
        onChange('participant1', p1);
        onChange('participant2', p2);
        onChange('participants', [p1, p2]);
    };

    const updateDialogue = (next: Line[]) => onChange('dialogue', next);

    const updateLine = (idx: number, patch: Partial<Line>) => {
        const next = [...dialogue];
        next[idx] = { ...next[idx], ...patch };
        updateDialogue(next);
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
                        <CreatableTagsField
                            fullWidth
                            label="Tags"
                            placeholder="Select or type a tag"
                            value={tags}
                            options={tagOptions}
                            onChange={(next) => onChange('tags', next)}
                            helperText="Pick existing tags or type a new one and press Enter"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Person 1 (left / other speaker)"
                            value={participant1}
                            onChange={(e) => updateParticipants(e.target.value, participant2)}
                            placeholder="Interviewer"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Person 2 (right / learner)"
                            value={participant2}
                            onChange={(e) => updateParticipants(participant1, e.target.value)}
                            placeholder="Candidate"
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

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                    flexWrap: 'wrap',
                    gap: 1,
                }}
            >
                <Typography variant="subtitle1" fontWeight={700}>
                    Dialogue script (in chat order)
                </Typography>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                        const last = dialogue[dialogue.length - 1];
                        const nextSpeaker =
                            last && isParticipant2Speaker(last.speaker, participant1, participant2)
                                ? participant1
                                : participant2;
                        updateDialogue([
                            ...dialogue,
                            { ...emptyDialogueLine(), speaker: nextSpeaker },
                        ]);
                    }}
                >
                    Add line
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell width={44}>#</TableCell>
                            <TableCell width="22%">Speaker</TableCell>
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
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Speaker</InputLabel>
                                        <Select
                                            label="Speaker"
                                            value={
                                                isParticipant2Speaker(
                                                    line.speaker,
                                                    participant1,
                                                    participant2
                                                )
                                                    ? 'p2'
                                                    : 'p1'
                                            }
                                            onChange={(e) =>
                                                updateLine(idx, {
                                                    speaker:
                                                        e.target.value === 'p2'
                                                            ? participant2
                                                            : participant1,
                                                })
                                            }
                                        >
                                            <MenuItem value="p1">
                                                {participant1 || 'Person 1'}
                                            </MenuItem>
                                            <MenuItem value="p2">
                                                {participant2 || 'Person 2'}
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
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
                                            updateDialogue(dialogue.filter((_, i) => i !== idx))
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
