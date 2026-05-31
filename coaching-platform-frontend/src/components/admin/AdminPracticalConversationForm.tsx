import React, { useMemo } from 'react';
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
import ChatIcon from '@mui/icons-material/Chat';
import { emptyDialogueLine } from '../../utils/adminDailyContentDefaults';
import { getConversationParticipants, isParticipant2Speaker } from '../../utils/conversationDialogueUtils';

type Line = ReturnType<typeof emptyDialogueLine>;

export interface AdminPracticalConversationFormProps {
    metadata: Record<string, unknown>;
    onChange: (field: string, value: unknown) => void;
    displayTitle?: string;
    onDisplayTitleChange?: (value: string) => void;
}

function getDialogue(metadata: Record<string, unknown>, p1: string): Line[] {
    const raw = metadata.dialogue as Line[] | undefined;
    if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((line) => ({
            ...emptyDialogueLine(),
            ...line,
            speaker: line.speaker || p1,
        }));
    }
    return Array.from({ length: 6 }, () => ({ ...emptyDialogueLine(), speaker: p1 }));
}

const AdminPracticalConversationForm: React.FC<AdminPracticalConversationFormProps> = ({
    metadata,
    onChange,
    displayTitle = '',
    onDisplayTitleChange,
}) => {
    const { participant1, participant2 } = getConversationParticipants(metadata);
    const scenarioTitle =
        (metadata.scenarioTitle as string) || displayTitle || (metadata.title as string) || '';
    const scenarioTitleHi = (metadata.scenarioTitle_hi as string) || '';
    const dialogue = getDialogue(metadata, participant1);

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

    const handleScenarioTitle = (value: string) => {
        onChange('scenarioTitle', value);
        onChange('title', value);
        onDisplayTitleChange?.(value);
    };

    const previewLines = useMemo(
        () =>
            dialogue.filter((l) => String(l.text_en || '').trim()).slice(0, 4),
        [dialogue]
    );

    return (
        <Box sx={{ mt: 1 }}>
            <Alert severity="info" icon={<ChatIcon />} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Silver: Practical Conversations (WhatsApp format)
                </Typography>
                <Typography variant="body2">
                    Set a scenario theme, two participants (e.g. Waiter and You), then build the chat in
                    order. Person 2 (usually &quot;You&quot;) appears on the right with a talk button for
                    learners.
                </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                    Scenario theme
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Scenario title (English)"
                            placeholder="e.g. Ordering Food at Restaurant"
                            value={scenarioTitle}
                            onChange={(e) => handleScenarioTitle(e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Scenario title (Hindi)"
                            placeholder="e.g. रेस्तरां में खाना ऑर्डर करना"
                            value={scenarioTitleHi}
                            onChange={(e) => onChange('scenarioTitle_hi', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Person 1 (left / other speaker)"
                            value={participant1}
                            onChange={(e) => updateParticipants(e.target.value, participant2)}
                            placeholder="Waiter"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            required
                            label="Person 2 (right / learner — You)"
                            value={participant2}
                            onChange={(e) => updateParticipants(participant1, e.target.value)}
                            placeholder="You"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
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

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
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
                                            <MenuItem value="p1">{participant1 || 'Person 1'}</MenuItem>
                                            <MenuItem value="p2">{participant2 || 'Person 2'}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        multiline
                                        minRows={2}
                                        placeholder="Good evening sir! Table for how many?"
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
                                        placeholder="शुभ संध्या सर! कितने लोगों के लिए टेबल?"
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

            {previewLines.length > 0 && (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#e5ddd5',
                        borderColor: '#075e54',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{ color: '#075e54', fontWeight: 700, display: 'block', mb: 1 }}
                    >
                        Preview
                    </Typography>
                    <Box
                        sx={{
                            bgcolor: '#075e54',
                            color: '#fff',
                            px: 1.5,
                            py: 1,
                            borderRadius: '8px 8px 0 0',
                        }}
                    >
                        <Typography variant="body2" fontWeight={700}>
                            {scenarioTitle || 'Practical conversation'}
                        </Typography>
                        {scenarioTitleHi && (
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {scenarioTitleHi}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ p: 1.5, maxHeight: 220, overflow: 'auto' }}>
                        {previewLines.map((line, i) => {
                            const isUser = isParticipant2Speaker(
                                line.speaker,
                                participant1,
                                participant2
                            );
                            return (
                                <Box
                                    key={i}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                                        mb: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: '85%',
                                            px: 1.25,
                                            py: 0.75,
                                            borderRadius: 2,
                                            bgcolor: isUser ? '#dcf8c6' : '#fff',
                                            boxShadow: 1,
                                        }}
                                    >
                                        {!isUser && (
                                            <Typography
                                                variant="caption"
                                                sx={{ color: '#075e54', fontWeight: 700 }}
                                            >
                                                {line.speaker}
                                            </Typography>
                                        )}
                                        <Typography variant="body2">{line.text_en}</Typography>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default AdminPracticalConversationForm;
