import React from 'react';
import {
    Alert,
    Box,
    Button,
    FormControl,
    FormControlLabel,
    Grid,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import type { AdminContentTypeKey } from '../../utils/dailyContentTypeCatalog';
import AdminImageUploadField from './AdminImageUploadField';
import AdminPracticalConversationForm from './AdminPracticalConversationForm';
import AdminProfessionalConversationForm from './AdminProfessionalConversationForm';
import AdminVocabSetMetadataForm from './AdminVocabSetMetadataForm';
import {
    emptyImportantWord,
    emptyInstagramPost,
    emptyPuzzleQuestion,
    emptySceneKeyword,
    emptySpeechKeyword,
    emptySpeechPhrase,
} from '../../utils/adminDailyContentDefaults';

export interface AdminDailyContentMetadataFormProps {
    type: string;
    metadata: Record<string, unknown>;
    adminKey?: AdminContentTypeKey;
    /** Learner-visible headline for SCENE (maps to content title on save) */
    displayTitle?: string;
    onDisplayTitleChange?: (value: string) => void;
    onChange: (field: string, value: unknown) => void;
}

const getPuzzleQuestionText = (q: ReturnType<typeof emptyPuzzleQuestion>) =>
    String((q as { question?: string; prompt?: string }).question ?? (q as { prompt?: string }).prompt ?? '');

const AdminDailyContentMetadataForm: React.FC<AdminDailyContentMetadataFormProps> = ({
    type,
    metadata,
    adminKey,
    displayTitle = '',
    onDisplayTitleChange,
    onChange,
}) => {
    if (type === 'WORD' || type === 'PHRASE') {
        const examples = (metadata.examples as { en?: string; hi?: string }[]) || [];
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
                    <Button size="small" onClick={() => onChange('examples', [...examples, { en: '', hi: '' }])}>
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
                {type === 'WORD' && (
                    <>
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
                    </>
                )}
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
        return (
            <AdminVocabSetMetadataForm
                metadata={metadata}
                onChange={onChange}
                displayTitle={displayTitle}
                onDisplayTitleChange={onDisplayTitleChange}
            />
        );
    }

    if (type === 'PUZZLE') {
        const puzzleType =
            (metadata.puzzleType as string) ||
            (adminKey === 'PUZZLE_GRAMMAR' ? 'GRAMMAR_FILL_BLANK' : 'SPOT_CORRECT_SENTENCE');
        const isGrammar = puzzleType === 'GRAMMAR_FILL_BLANK';
        const questions =
            (metadata.questions as ReturnType<typeof emptyPuzzleQuestion>[])?.length === 5
                ? (metadata.questions as ReturnType<typeof emptyPuzzleQuestion>[])
                : Array.from({ length: 5 }, emptyPuzzleQuestion);

        const updateQuestion = (idx: number, patch: Partial<ReturnType<typeof emptyPuzzleQuestion>>) => {
            const next = [...questions];
            next[idx] = { ...next[idx], ...patch };
            onChange('questions', next);
        };

        return (
            <Box sx={{ mt: 1 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        {isGrammar ? 'Grammar puzzle — fill in the verb' : 'Spot the correct sentence'}
                    </Typography>
                    <Typography variant="body2">
                        {isGrammar
                            ? 'Write 5 questions with ___ where the blank goes. Provide four answer choices and mark the correct one.'
                            : 'Write 5 questions with four sentence options each. Mark which option is grammatically correct.'}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.85 }}>
                        Puzzle type is set by the Type field above — no need to change it here.
                    </Typography>
                </Alert>

                {questions.map((q, idx) => {
                    const options = q.options?.length === 4 ? q.options : ['', '', '', ''];
                    const correctIdx = q.correct_idx ?? 0;

                    return (
                        <Paper
                            key={idx}
                            variant="outlined"
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                mb: 2,
                                borderRadius: 2,
                                bgcolor: 'background.default',
                            }}
                        >
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="primary"
                                sx={{ mb: 2 }}
                            >
                                Question {idx + 1} of 5
                            </Typography>

                            <TextField
                                fullWidth
                                label="Question text"
                                placeholder={
                                    isGrammar
                                        ? 'Example: She ___ to the market every Sunday.'
                                        : 'Example: Which sentence uses the past tense correctly?'
                                }
                                value={getPuzzleQuestionText(q)}
                                onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                                multiline
                                minRows={isGrammar ? 2 : 1}
                                sx={{ mb: 2.5 }}
                            />

                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                                Answer choices
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                Select the radio button next to the correct answer.
                            </Typography>

                            <FormControl component="fieldset" fullWidth>
                                <RadioGroup
                                    value={String(correctIdx)}
                                    onChange={(e) => updateQuestion(idx, { correct_idx: Number(e.target.value) })}
                                >
                                    {options.map((opt, oi) => (
                                        <Box
                                            key={oi}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: 1,
                                                mb: 1.5,
                                                p: 1,
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor:
                                                    correctIdx === oi ? 'primary.main' : 'divider',
                                                bgcolor: correctIdx === oi ? 'action.hover' : 'transparent',
                                            }}
                                        >
                                            <FormControlLabel
                                                value={String(oi)}
                                                control={<Radio size="small" />}
                                                label={
                                                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 20 }}>
                                                        {String.fromCharCode(65 + oi)}
                                                    </Typography>
                                                }
                                                sx={{ m: 0, mt: 0.75 }}
                                            />
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder={`Choice ${String.fromCharCode(65 + oi)}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const opts = [...options];
                                                    opts[oi] = e.target.value;
                                                    updateQuestion(idx, { options: opts });
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </Paper>
                    );
                })}
            </Box>
        );
    }

    if (type === 'CONVERSATION' && adminKey === 'PROFESSIONAL_CONVERSATION') {
        return (
            <AdminProfessionalConversationForm
                metadata={metadata}
                onChange={onChange}
                displayTitle={displayTitle}
                onDisplayTitleChange={onDisplayTitleChange}
            />
        );
    }

    if (type === 'CONVERSATION') {
        return (
            <AdminPracticalConversationForm
                metadata={metadata}
                onChange={onChange}
                displayTitle={displayTitle}
                onDisplayTitleChange={onDisplayTitleChange}
            />
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
                    <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Explain the Scene — summary submissions
                        </Typography>
                        <Typography variant="body2">
                            Learners write 2–5 short summaries in their own words (no fixed questions). After
                            submit, an admin awards one overall score from 0–50 points.
                        </Typography>
                    </Alert>
                </Grid>
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
                        label="Instructions for learners (optional)"
                        value={(metadata.submissionPrompt as string) || ''}
                        onChange={(e) => onChange('submissionPrompt', e.target.value)}
                        multiline
                        rows={2}
                        helperText="Shown on the submission card. Default explains 2–5 summaries and 0–50 scoring."
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
