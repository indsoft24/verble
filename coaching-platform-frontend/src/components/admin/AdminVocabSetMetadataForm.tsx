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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AdminImageUploadField from './AdminImageUploadField';
import { emptyVocabItem } from '../../utils/adminDailyContentDefaults';

type VocabItem = ReturnType<typeof emptyVocabItem>;

export interface AdminVocabSetMetadataFormProps {
    metadata: Record<string, unknown>;
    onChange: (field: string, value: unknown) => void;
    onDisplayTitleChange?: (value: string) => void;
    displayTitle?: string;
}

function getVocabItems(metadata: Record<string, unknown>): VocabItem[] {
    const raw = metadata.vocabItems as VocabItem[] | undefined;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return Array.from({ length: 10 }, emptyVocabItem);
}

const AdminVocabSetMetadataForm: React.FC<AdminVocabSetMetadataFormProps> = ({
    metadata,
    onChange,
    onDisplayTitleChange,
    displayTitle = '',
}) => {
    const theme = (metadata.theme as string) || '';
    const vocabSetNumber = metadata.vocabSetNumber as number | string | undefined;
    const themeImageDescription = (metadata.themeImageDescription as string) || '';
    const themeImageUrl =
        (metadata.themeImageUrl as string) || (metadata.themeImage as string) || '';
    const vocabItems = getVocabItems(metadata);

    const updateItems = (next: VocabItem[]) => onChange('vocabItems', next);

    const updateItem = (idx: number, patch: Partial<VocabItem>) => {
        const next = [...vocabItems];
        next[idx] = { ...next[idx], ...patch };
        updateItems(next);
    };

    const handleThemeChange = (value: string) => {
        onChange('theme', value);
        const suggested = value.trim() ? `${value.trim()} vocabulary` : '';
        if (suggested && !displayTitle.trim() && onDisplayTitleChange) {
            onDisplayTitleChange(suggested);
        }
    };

    const filledCount = vocabItems.filter((v) => String(v.word || '').trim()).length;

    return (
        <Box sx={{ mt: 1 }}>
            <Alert severity="info" icon={<MenuBookIcon />} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Bronze: Essential Vocabulary
                </Typography>
                <Typography variant="body2">
                    Each entry is one themed set (e.g. Kitchen, Dining). Add a theme image, a short image
                    description for accessibility, and up to 10 words with English, pronunciation (Hindi), and
                    meaning (Hindi) — matching the curriculum spreadsheet layout.
                </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 2 }}>
                    Theme &amp; image
                </Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            fullWidth
                            label="Vocabulary set #"
                            type="number"
                            value={vocabSetNumber ?? ''}
                            onChange={(e) => {
                                const n = parseInt(e.target.value, 10);
                                onChange('vocabSetNumber', Number.isNaN(n) ? '' : n);
                            }}
                            inputProps={{ min: 1 }}
                            helperText="Set number in weekly series"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            fullWidth
                            label="Theme"
                            required
                            placeholder="e.g. Kitchen, Dining, Travel"
                            value={theme}
                            onChange={(e) => handleThemeChange(e.target.value)}
                            helperText={
                                displayTitle.trim()
                                    ? `Display title: ${displayTitle}`
                                    : 'Theme also suggests the content title on save'
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Theme image description"
                            placeholder="e.g. A modern kitchen with utensils, stove, and fridge"
                            value={themeImageDescription}
                            onChange={(e) => onChange('themeImageDescription', e.target.value)}
                            multiline
                            minRows={2}
                            helperText="Shown when no image is uploaded; useful for screen readers and bulk import"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <AdminImageUploadField
                            label="Theme image (upload to storage)"
                            value={themeImageUrl}
                            onChange={(url) => {
                                onChange('themeImageUrl', url);
                                if (url) onChange('themeImage', url);
                            }}
                        />
                    </Grid>
                    {themeImageUrl ? (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Preview
                            </Typography>
                            <Box
                                component="img"
                                src={themeImageUrl}
                                alt={themeImageDescription || theme || 'Vocabulary theme'}
                                sx={{
                                    width: '100%',
                                    maxHeight: 200,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            />
                        </Grid>
                    ) : null}
                </Grid>
            </Paper>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 1.5,
                }}
            >
                <Box>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Vocabulary items
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filledCount} of {vocabItems.length} word{vocabItems.length === 1 ? '' : 's'} filled
                        {filledCount < 10 ? ' · 10 recommended per set' : ''}
                    </Typography>
                </Box>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => updateItems([...vocabItems, emptyVocabItem()])}
                >
                    Add word
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell width={48}>#</TableCell>
                            <TableCell>Word (English)</TableCell>
                            <TableCell>Pronunciation (Hindi)</TableCell>
                            <TableCell>Meaning (Hindi)</TableCell>
                            <TableCell>Audio URL</TableCell>
                            <TableCell width={48} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vocabItems.map((item, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                                        {idx + 1}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="knife"
                                        value={item.word || ''}
                                        onChange={(e) => updateItem(idx, { word: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="नाइफ़"
                                        value={item.pronunciation_hi || ''}
                                        onChange={(e) =>
                                            updateItem(idx, { pronunciation_hi: e.target.value })
                                        }
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="चाकू"
                                        value={item.meaning_hi || ''}
                                        onChange={(e) => updateItem(idx, { meaning_hi: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="https://…"
                                        value={item.audio || ''}
                                        onChange={(e) => updateItem(idx, { audio: e.target.value })}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        aria-label={`Remove word ${idx + 1}`}
                                        disabled={vocabItems.length <= 1}
                                        onClick={() =>
                                            updateItems(vocabItems.filter((_, i) => i !== idx))
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

            {filledCount > 0 && filledCount < 10 && (
                <Button
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => {
                        const need = 10 - vocabItems.length;
                        if (need > 0) {
                            updateItems([
                                ...vocabItems,
                                ...Array.from({ length: need }, emptyVocabItem),
                            ]);
                        }
                    }}
                >
                    Expand to 10 rows
                </Button>
            )}
        </Box>
    );
};

export default AdminVocabSetMetadataForm;
