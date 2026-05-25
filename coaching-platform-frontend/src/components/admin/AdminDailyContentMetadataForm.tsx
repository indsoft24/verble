import React from 'react';
import {
    Box,
    Button,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import AdminImageUploadField from './AdminImageUploadField';
import {
    emptyDialogueLine,
    emptyImportantWord,
    emptyInstagramPost,
    emptyPuzzleQuestion,
    emptySceneKeyword,
    emptySpeechKeyword,
    emptySpeechPhrase,
    emptyVocabItem,
} from '../../utils/adminDailyContentDefaults';

const PUZZLE_TYPES = ['SPOT_CORRECT_SENTENCE', 'GRAMMAR_FILL_BLANK'] as const;

export interface AdminDailyContentMetadataFormProps {
    type: string;
    metadata: Record<string, unknown>;
    /** Learner-visible headline for SCENE (maps to content title on save) */
    displayTitle?: string;
    onDisplayTitleChange?: (value: string) => void;
    onChange: (field: string, value: unknown) => void;
}

const AdminDailyContentMetadataForm: React.FC<AdminDailyContentMetadataFormProps> = ({
    type,
    metadata,
    displayTitle = '',
    onDisplayTitleChange,
    onChange,
}) => {
    if (type === 'WORD' || type === 'PHRASE') {
        const examples = (metadata.examples as { en?: string; hi?: string; audio?: string }[]) || [];
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label={type === 'WORD' ? 'Word' : 'Phrase'}
                        value={(metadata.text as string) || ''}
                        onChange={(e) => onChange('text', e.target.value)}
                        required
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="English meaning"
                        value={(metadata.meaning_en as string) || ''}
                        onChange={(e) => onChange('meaning_en', e.target.value)}
                        required
                        multiline
                        rows={2}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Hindi meaning"
                        value={(metadata.meaning_hi as string) || ''}
                        onChange={(e) => onChange('meaning_hi', e.target.value)}
                        required
                        multiline
                        rows={2}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Audio URL (optional)"
                        value={(metadata.audio as string) || ''}
                        onChange={(e) => onChange('audio', e.target.value)}
                    />
                </Grid>
                {type === 'WORD' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Part of speech (optional)"
                            value={(metadata.partOfSpeech as string) || ''}
                            onChange={(e) => onChange('partOfSpeech', e.target.value)}
                        />
                    </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Examples (optional)
                    </Typography>
                    <Button size="small" onClick={() => onChange('examples', [...examples, { en: '', hi: '', audio: '' }])}>
                        Add example
                    </Button>
                    {examples.map((ex, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <TextField
                                fullWidth
                                label="English"
                                value={ex.en || ''}
                                onChange={(e) => {
                                    const next = [...examples];
                                    next[idx] = { ...next[idx], en: e.target.value };
                                    onChange('examples', next);
                                }}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                fullWidth
                                label="Hindi"
                                value={ex.hi || ''}
                                onChange={(e) => {
                                    const next = [...examples];
                                    next[idx] = { ...next[idx], hi: e.target.value };
                                    onChange('examples', next);
                                }}
                            />
                        </Box>
                    ))}
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Synonyms (comma-separated)"
                        value={((metadata.synonyms as string[]) || []).join(', ')}
                        onChange={(e) =>
                            onChange(
                                'synonyms',
                                e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                            )
                        }
                        helperText="Separate words with commas."
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Antonyms (comma-separated)"
                        value={((metadata.antonyms as string[]) || []).join(', ')}
                        onChange={(e) =>
                            onChange(
                                'antonyms',
                                e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                            )
                        }
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Pronunciation (IPA, optional)"
                        value={(metadata.pronunciation_ipa as string) || ''}
                        onChange={(e) => onChange('pronunciation_ipa', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Pronunciation (Devanagari, optional)"
                        value={(metadata.pronunciation_devanagari as string) || ''}
                        onChange={(e) => onChange('pronunciation_devanagari', e.target.value)}
                    />
                </Grid>
            </Grid>
        );
    }

    if (type === 'STORY') {
        const importantWords =
            (metadata.important_words as { word?: string; meaning_en?: string; meaning_hi?: string }[])?.length === 5
                ? (metadata.important_words as { word?: string; meaning_en?: string; meaning_hi?: string }[])
                : Array.from({ length: 5 }, emptyImportantWord);
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Story title (shown to learners)"
                        value={(metadata.title as string) || ''}
                        onChange={(e) => onChange('title', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Story content"
                        value={(metadata.text_content as string) || ''}
                        onChange={(e) => onChange('text_content', e.target.value)}
                        required
                        multiline
                        rows={8}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Audio URL (optional)"
                        value={(metadata.audio as string) || ''}
                        onChange={(e) => onChange('audio', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Moral (English)"
                        value={(metadata.moral_en as string) || ''}
                        onChange={(e) => onChange('moral_en', e.target.value)}
                        multiline
                        rows={2}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Moral (Hindi)"
                        value={(metadata.moral_hi as string) || ''}
                        onChange={(e) => onChange('moral_hi', e.target.value)}
                        multiline
                        rows={2}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Important words (5 pairs)
                    </Typography>
                    {importantWords.map((pair, idx) => (
                        <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Word {idx + 1}
                            </Typography>
                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Word"
                                        value={pair.word || ''}
                                        onChange={(e) => {
                                            const next = [...importantWords];
                                            next[idx] = { ...next[idx], word: e.target.value };
                                            onChange('important_words', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="English"
                                        value={pair.meaning_en || ''}
                                        onChange={(e) => {
                                            const next = [...importantWords];
                                            next[idx] = { ...next[idx], meaning_en: e.target.value };
                                            onChange('important_words', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Hindi"
                                        value={pair.meaning_hi || ''}
                                        onChange={(e) => {
                                            const next = [...importantWords];
                                            next[idx] = { ...next[idx], meaning_hi: e.target.value };
                                            onChange('important_words', next);
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Hindi sentence translations (one per line)"
                        value={
                            Array.isArray(metadata.sentence_translations)
                                ? (metadata.sentence_translations as string[]).join('\n')
                                : ''
                        }
                        onChange={(e) =>
                            onChange(
                                'sentence_translations',
                                e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                            )
                        }
                        multiline
                        rows={6}
                    />
                </Grid>
            </Grid>
        );
    }

    if (type === 'VOCAB_SET') {
        const vocabItems =
            (metadata.vocabItems as ReturnType<typeof emptyVocabItem>[])?.length > 0
                ? (metadata.vocabItems as ReturnType<typeof emptyVocabItem>[])
                : [emptyVocabItem()];
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2">Vocabulary words</Typography>
                    <Button size="small" sx={{ ml: 1 }} onClick={() => onChange('vocabItems', [...vocabItems, emptyVocabItem()])}>
                        Add word
                    </Button>
                </Grid>
                {vocabItems.map((item, idx) => (
                    <Grid size={{ xs: 12 }} key={idx}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Word {idx + 1}
                            </Typography>
                            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Word"
                                        value={item.word || ''}
                                        onChange={(e) => {
                                            const next = [...vocabItems];
                                            next[idx] = { ...next[idx], word: e.target.value };
                                            onChange('vocabItems', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Pronunciation (Hindi)"
                                        value={item.pronunciation_hi || ''}
                                        onChange={(e) => {
                                            const next = [...vocabItems];
                                            next[idx] = { ...next[idx], pronunciation_hi: e.target.value };
                                            onChange('vocabItems', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Meaning (Hindi)"
                                        value={item.meaning_hi || ''}
                                        onChange={(e) => {
                                            const next = [...vocabItems];
                                            next[idx] = { ...next[idx], meaning_hi: e.target.value };
                                            onChange('vocabItems', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Audio URL"
                                        value={item.audio || ''}
                                        onChange={(e) => {
                                            const next = [...vocabItems];
                                            next[idx] = { ...next[idx], audio: e.target.value };
                                            onChange('vocabItems', next);
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (type === 'PUZZLE') {
        const questions =
            (metadata.questions as ReturnType<typeof emptyPuzzleQuestion>[])?.length === 5
                ? (metadata.questions as ReturnType<typeof emptyPuzzleQuestion>[])
                : Array.from({ length: 5 }, emptyPuzzleQuestion);
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                        <InputLabel>Puzzle type</InputLabel>
                        <Select
                            label="Puzzle type"
                            value={(metadata.puzzleType as string) || 'SPOT_CORRECT_SENTENCE'}
                            onChange={(e) => onChange('puzzleType', e.target.value)}
                        >
                            {PUZZLE_TYPES.map((pt) => (
                                <MenuItem key={pt} value={pt}>
                                    {pt === 'GRAMMAR_FILL_BLANK' ? 'Grammar (verb form)' : 'Spot correct sentence'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {questions.map((q, idx) => (
                    <Grid size={{ xs: 12 }} key={idx}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Question {idx + 1}
                        </Typography>
                        <TextField
                            fullWidth
                            label="Prompt"
                            value={q.prompt || ''}
                            onChange={(e) => {
                                const next = [...questions];
                                next[idx] = { ...next[idx], prompt: e.target.value };
                                onChange('questions', next);
                            }}
                            sx={{ mb: 1 }}
                        />
                        {(q.options || ['', '', '', '']).map((opt, oi) => (
                            <TextField
                                key={oi}
                                fullWidth
                                size="small"
                                label={`Option ${oi + 1}`}
                                value={opt}
                                onChange={(e) => {
                                    const next = [...questions];
                                    const opts = [...(next[idx].options || ['', '', '', ''])];
                                    opts[oi] = e.target.value;
                                    next[idx] = { ...next[idx], options: opts };
                                    onChange('questions', next);
                                }}
                                sx={{ mb: 1 }}
                            />
                        ))}
                        <TextField
                            fullWidth
                            type="number"
                            label="Correct option index (0-based)"
                            value={q.correct_idx ?? 0}
                            onChange={(e) => {
                                const next = [...questions];
                                next[idx] = { ...next[idx], correct_idx: Number(e.target.value) };
                                onChange('questions', next);
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (type === 'CONVERSATION') {
        const dialogue = (metadata.dialogue as ReturnType<typeof emptyDialogueLine>[]) || [];
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Participant 1"
                        value={(metadata.participant1 as string) || ''}
                        onChange={(e) => onChange('participant1', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Participant 2"
                        value={(metadata.participant2 as string) || ''}
                        onChange={(e) => onChange('participant2', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Button size="small" onClick={() => onChange('dialogue', [...dialogue, emptyDialogueLine()])}>
                        Add dialogue line
                    </Button>
                    {dialogue.map((line, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <TextField
                                fullWidth
                                label="Speaker"
                                value={line.speaker || ''}
                                onChange={(e) => {
                                    const next = [...dialogue];
                                    next[idx] = { ...next[idx], speaker: e.target.value };
                                    onChange('dialogue', next);
                                }}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                fullWidth
                                label="English"
                                value={line.text_en || ''}
                                onChange={(e) => {
                                    const next = [...dialogue];
                                    next[idx] = { ...next[idx], text_en: e.target.value };
                                    onChange('dialogue', next);
                                }}
                                multiline
                                rows={2}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                fullWidth
                                label="Hindi"
                                value={line.text_hi || ''}
                                onChange={(e) => {
                                    const next = [...dialogue];
                                    next[idx] = { ...next[idx], text_hi: e.target.value };
                                    onChange('dialogue', next);
                                }}
                                multiline
                                rows={2}
                            />
                        </Box>
                    ))}
                </Grid>
            </Grid>
        );
    }

    if (type === 'SCENE') {
        const keywords =
            (metadata.keywords as ReturnType<typeof emptySceneKeyword>[])?.length > 0
                ? (metadata.keywords as ReturnType<typeof emptySceneKeyword>[])
                : [emptySceneKeyword()];
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Scene headline (shown to learners)"
                        value={displayTitle || (metadata.title as string) || ''}
                        onChange={(e) => {
                            onChange('title', e.target.value);
                            onDisplayTitleChange?.(e.target.value);
                        }}
                        helperText="This becomes the main title learners see on the scene card."
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <AdminImageUploadField
                        label="Scene image"
                        value={(metadata.imageUrl as string) || ''}
                        onChange={(url) => onChange('imageUrl', url)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <AdminImageUploadField
                        label="Scene GIF (optional)"
                        value={(metadata.gifUrl as string) || ''}
                        onChange={(url) => onChange('gifUrl', url)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Explanation (English)"
                        value={(metadata.explanation as string) || ''}
                        onChange={(e) => onChange('explanation', e.target.value)}
                        multiline
                        rows={4}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Hindi summary"
                        value={(metadata.hindiSummary as string) || ''}
                        onChange={(e) => onChange('hindiSummary', e.target.value)}
                        multiline
                        rows={3}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Narration audio URL (optional)"
                        value={(metadata.audio as string) || ''}
                        onChange={(e) => onChange('audio', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Button size="small" onClick={() => onChange('keywords', [...keywords, emptySceneKeyword()])}>
                        Add keyword
                    </Button>
                    {keywords.map((kw, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Keyword"
                                        value={kw.word || ''}
                                        onChange={(e) => {
                                            const next = [...keywords];
                                            next[idx] = { ...next[idx], word: e.target.value };
                                            onChange('keywords', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Meaning (Hindi)"
                                        value={kw.meaning_hi || ''}
                                        onChange={(e) => {
                                            const next = [...keywords];
                                            next[idx] = { ...next[idx], meaning_hi: e.target.value };
                                            onChange('keywords', next);
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Grid>
            </Grid>
        );
    }

    if (type === 'SPEECH') {
        const keywords = (metadata.keywords as ReturnType<typeof emptySpeechKeyword>[]) || [];
        const phrases = (metadata.phrases as ReturnType<typeof emptySpeechPhrase>[]) || [];
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Speaker name"
                        value={(metadata.speaker as string) || ''}
                        onChange={(e) => onChange('speaker', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="YouTube URL"
                        value={(metadata.youtubeUrl as string) || ''}
                        onChange={(e) => onChange('youtubeUrl', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Transcript"
                        value={(metadata.transcript as string) || ''}
                        onChange={(e) => onChange('transcript', e.target.value)}
                        multiline
                        rows={6}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Button size="small" onClick={() => onChange('keywords', [...keywords, emptySpeechKeyword()])}>
                        Add keyword
                    </Button>
                    {keywords.map((kw, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Grid container spacing={1}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Word"
                                        value={kw.word || ''}
                                        onChange={(e) => {
                                            const next = [...keywords];
                                            next[idx] = { ...next[idx], word: e.target.value };
                                            onChange('keywords', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="English"
                                        value={kw.meaning_en || ''}
                                        onChange={(e) => {
                                            const next = [...keywords];
                                            next[idx] = { ...next[idx], meaning_en: e.target.value };
                                            onChange('keywords', next);
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Hindi"
                                        value={kw.meaning_hi || ''}
                                        onChange={(e) => {
                                            const next = [...keywords];
                                            next[idx] = { ...next[idx], meaning_hi: e.target.value };
                                            onChange('keywords', next);
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Button size="small" onClick={() => onChange('phrases', [...phrases, emptySpeechPhrase()])}>
                        Add phrase
                    </Button>
                    {phrases.map((ph, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Phrase"
                                value={ph.phrase || ''}
                                onChange={(e) => {
                                    const next = [...phrases];
                                    next[idx] = { ...next[idx], phrase: e.target.value };
                                    onChange('phrases', next);
                                }}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                fullWidth
                                size="small"
                                label="English meaning"
                                value={ph.meaning_en || ''}
                                onChange={(e) => {
                                    const next = [...phrases];
                                    next[idx] = { ...next[idx], meaning_en: e.target.value };
                                    onChange('phrases', next);
                                }}
                            />
                        </Box>
                    ))}
                </Grid>
            </Grid>
        );
    }

    if (type === 'LYRICS') {
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Artist"
                        value={(metadata.artist as string) || ''}
                        onChange={(e) => onChange('artist', e.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        fullWidth
                        label="Audio file URL"
                        value={(metadata.audio as string) || ''}
                        onChange={(e) => onChange('audio', e.target.value)}
                        helperText="Direct MP3/audio URL — not a YouTube embed"
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Lyrics"
                        value={(metadata.lyrics as string) || ''}
                        onChange={(e) => onChange('lyrics', e.target.value)}
                        multiline
                        rows={10}
                    />
                </Grid>
            </Grid>
        );
    }

    if (type === 'FEED') {
        const posts =
            (metadata.posts as ReturnType<typeof emptyInstagramPost>[])?.length > 0
                ? (metadata.posts as ReturnType<typeof emptyInstagramPost>[])
                : [emptyInstagramPost()];
        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <Button size="small" onClick={() => onChange('posts', [...posts, emptyInstagramPost()])}>
                        Add post
                    </Button>
                </Grid>
                {posts.map((post, idx) => (
                    <Grid size={{ xs: 12 }} key={idx}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Post {idx + 1}
                            </Typography>
                            <Box sx={{ mt: 1, mb: 1 }}>
                                <AdminImageUploadField
                                    label="Post image"
                                    value={post.imageUrl || ''}
                                    onChange={(url) => {
                                        const next = [...posts];
                                        next[idx] = { ...next[idx], imageUrl: url };
                                        onChange('posts', next);
                                    }}
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Credit / account"
                                value={post.credit || ''}
                                onChange={(e) => {
                                    const next = [...posts];
                                    next[idx] = { ...next[idx], credit: e.target.value };
                                    onChange('posts', next);
                                }}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                fullWidth
                                label="Instagram post link"
                                value={post.postLink || ''}
                                onChange={(e) => {
                                    const next = [...posts];
                                    next[idx] = { ...next[idx], postLink: e.target.value };
                                    onChange('posts', next);
                                }}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                fullWidth
                                label="Caption (optional)"
                                value={post.caption || ''}
                                onChange={(e) => {
                                    const next = [...posts];
                                    next[idx] = { ...next[idx], caption: e.target.value };
                                    onChange('posts', next);
                                }}
                                multiline
                                rows={2}
                            />
                        </Box>
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
            Select a content type to see the editor.
        </Typography>
    );
};

export default AdminDailyContentMetadataForm;
