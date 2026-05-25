import React, { useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';

export interface DatabaseDocumentFormEditorProps {
    collectionName: string;
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    mode: 'create' | 'update';
}

const READONLY_KEYS = new Set(['_id', '__v', 'createdAt', 'updatedAt']);

const patch = (
    doc: Record<string, unknown>,
    key: string,
    val: unknown
): Record<string, unknown> => ({
    ...doc,
    [key]: val,
});

function BlogPostForm({
    value,
    onChange,
    mode,
}: {
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    mode: 'create' | 'update';
}) {
    const tagsStr = Array.isArray(value.tags) ? (value.tags as string[]).join(', ') : '';

    return (
        <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    required
                    label="Title"
                    value={String(value.title ?? '')}
                    onChange={(e) => onChange(patch(value, 'title', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    fullWidth
                    label="Slug"
                    helperText="Auto-generated from title on save if left blank"
                    value={String(value.slug ?? '')}
                    onChange={(e) => onChange(patch(value, 'slug', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    fullWidth
                    label="Category"
                    value={String(value.category ?? 'Uncategorized')}
                    onChange={(e) => onChange(patch(value, 'category', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    required
                    label="Short description"
                    multiline
                    minRows={2}
                    value={String(value.description ?? '')}
                    onChange={(e) => onChange(patch(value, 'description', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    required
                    label="Content (HTML)"
                    multiline
                    minRows={8}
                    value={String(value.content ?? '')}
                    onChange={(e) => onChange(patch(value, 'content', e.target.value))}
                    helperText="HTML is supported (e.g. &lt;p&gt;…&lt;/p&gt;)"
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Feature image URL"
                    value={String(value.featureImage ?? '')}
                    onChange={(e) => onChange(patch(value, 'featureImage', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    fullWidth
                    required
                    label="Author (user ID)"
                    value={String(value.author ?? '')}
                    onChange={(e) => onChange(patch(value, 'author', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    fullWidth
                    label="Tags (comma-separated)"
                    value={tagsStr}
                    onChange={(e) =>
                        onChange(
                            patch(
                                value,
                                'tags',
                                e.target.value
                                    .split(',')
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                            )
                        )
                    }
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={Boolean(value.isPublished)}
                            onChange={(e) =>
                                onChange(patch(value, 'isPublished', e.target.checked))
                            }
                        />
                    }
                    label="Published"
                />
            </Grid>
            {mode !== 'create' && (
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Views"
                        type="number"
                        value={Number(value.views ?? 0)}
                        onChange={(e) =>
                            onChange(patch(value, 'views', parseInt(e.target.value, 10) || 0))
                        }
                        disabled
                    />
                </Grid>
            )}
        </Grid>
    );
}

function DailyContentForm({
    value,
    onChange,
}: {
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
}) {
    return (
        <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                        label="Type"
                        value={String(value.type ?? 'WORD')}
                        onChange={(e) => onChange(patch(value, 'type', e.target.value))}
                    >
                        {['WORD', 'PHRASE', 'STORY', 'VOCAB_SET', 'CONVERSATION', 'PUZZLE', 'SCENE', 'SPEECH', 'LYRICS', 'FEED'].map(
                            (t) => (
                                <MenuItem key={t} value={t}>
                                    {t}
                                </MenuItem>
                            )
                        )}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                    <InputLabel>Level</InputLabel>
                    <Select
                        label="Level"
                        value={String(value.level ?? 'FREE')}
                        onChange={(e) => onChange(patch(value, 'level', e.target.value))}
                    >
                        {['FREE', 'BRONZE', 'SILVER', 'GOLD', 'BONUS'].map((l) => (
                            <MenuItem key={l} value={l}>
                                {l}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    InputLabelProps={{ shrink: true }}
                    value={
                        value.date
                            ? new Date(String(value.date)).toISOString().slice(0, 10)
                            : ''
                    }
                    onChange={(e) =>
                        onChange(patch(value, 'date', e.target.value ? new Date(e.target.value) : null))
                    }
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Title"
                    value={String(value.title ?? '')}
                    onChange={(e) => onChange(patch(value, 'title', e.target.value))}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    label="Metadata (JSON)"
                    multiline
                    minRows={6}
                    value={JSON.stringify(value.metadata ?? {}, null, 2)}
                    onChange={(e) => {
                        try {
                            onChange(patch(value, 'metadata', JSON.parse(e.target.value)));
                        } catch {
                            /* ignore while typing */
                        }
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12 }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={value.isActive !== false}
                            onChange={(e) => onChange(patch(value, 'isActive', e.target.checked))}
                        />
                    }
                    label="Active"
                />
            </Grid>
        </Grid>
    );
}

function GenericDocumentForm({
    value,
    onChange,
    mode,
}: {
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    mode: 'create' | 'update';
}) {
    const [showJson, setShowJson] = useState(false);
    const editableKeys = useMemo(
        () =>
            Object.keys(value).filter((k) => {
                if (READONLY_KEYS.has(k)) return false;
                if (mode === 'create' && k === '_id') return false;
                return typeof value[k] !== 'object' || value[k] === null;
            }),
        [value, mode]
    );

    const complexKeys = Object.keys(value).filter(
        (k) => typeof value[k] === 'object' && value[k] !== null && !READONLY_KEYS.has(k)
    );

    return (
        <Box sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
                Structured form for simple fields. Use advanced JSON for nested objects and arrays.
            </Alert>
            <Grid container spacing={2}>
                {editableKeys.map((key) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={key}>
                        <TextField
                            fullWidth
                            label={key}
                            value={String(value[key] ?? '')}
                            onChange={(e) => {
                                const raw = e.target.value;
                                let parsed: unknown = raw;
                                if (raw === 'true') parsed = true;
                                else if (raw === 'false') parsed = false;
                                else if (raw !== '' && !Number.isNaN(Number(raw)))
                                    parsed = Number(raw);
                                onChange(patch(value, key, parsed));
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
            {complexKeys.length > 0 && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Nested fields ({complexKeys.join(', ')})
                    </Typography>
                    <Button size="small" onClick={() => setShowJson((v) => !v)}>
                        {showJson ? 'Hide JSON editor' : 'Edit nested data as JSON'}
                    </Button>
                    {showJson && (
                        <TextField
                            fullWidth
                            multiline
                            minRows={12}
                            sx={{ mt: 1, fontFamily: 'monospace' }}
                            value={JSON.stringify(value, null, 2)}
                            onChange={(e) => {
                                try {
                                    onChange(JSON.parse(e.target.value) as Record<string, unknown>);
                                } catch {
                                    /* invalid json while typing */
                                }
                            }}
                        />
                    )}
                </>
            )}
            {mode === 'update' && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Document ID: {String(value._id ?? '')}
                    </Typography>
                    {value.createdAt != null && value.createdAt !== '' && (
                        <Typography variant="caption" color="text.secondary" display="block">
                            Created: {new Date(String(value.createdAt)).toLocaleString()}
                        </Typography>
                    )}
                </Box>
            )}
        </Box>
    );
}

const DatabaseDocumentFormEditor: React.FC<DatabaseDocumentFormEditorProps> = ({
    collectionName,
    value,
    onChange,
    mode,
}) => {
    const normalized = collectionName.toLowerCase();

    if (normalized === 'blogposts') {
        return <BlogPostForm value={value} onChange={onChange} mode={mode} />;
    }

    if (normalized === 'dailycontents') {
        return <DailyContentForm value={value} onChange={onChange} />;
    }

    return <GenericDocumentForm value={value} onChange={onChange} mode={mode} />;
};

export default DatabaseDocumentFormEditor;
