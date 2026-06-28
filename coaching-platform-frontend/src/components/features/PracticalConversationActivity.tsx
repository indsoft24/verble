import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
    TextField,
    Typography,
    alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import ConversationChat from './ConversationChat';
import EvaluationStatusBanner from './EvaluationStatusBanner';
import { practicalConversationTheme as theme } from './practicalConversationTheme';
import {
    getConversationParticipants,
    normalizeDialogue,
} from '../../utils/conversationDialogueUtils';
import { getContentDisplayNumber, isContentScheduledToday } from '../../utils/dailyActivityUi';
import type { DailyContent } from '../../services/dailyContentService';
import { useAuth } from '../../contexts/AuthContext';
import {
    getUserConversationSubmission,
    submitConversationPractice,
    type ConversationExchange,
    type UserConversationSubmission,
} from '../../services/conversationSubmissionService';

const MIN_EXCHANGES = 2;
const MAX_EXCHANGES = 5;

const emptyExchange = (): ConversationExchange => ({
    participant1Line: '',
    participant2Line: '',
});

function ExchangePreview({
    participant1,
    exchange,
}: {
    participant1: string;
    participant2: string;
    exchange: ConversationExchange;
}) {
    const p1 = exchange.participant1Line.trim();
    const p2 = exchange.participant2Line.trim();
    if (!p1 && !p2) return null;

    return (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {p1 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Paper
                        elevation={0}
                        sx={{
                            px: 1.25,
                            py: 0.75,
                            maxWidth: '92%',
                            borderRadius: '10px 10px 10px 2px',
                            bgcolor: theme.bubbleOther,
                        }}
                    >
                        <Typography variant="caption" sx={{ color: theme.bubbleLabel, fontWeight: 700, display: 'block' }}>
                            {participant1}
                        </Typography>
                        <Typography variant="body2" sx={{ color: theme.bubbleOtherText, fontSize: '0.8125rem' }}>
                            {p1}
                        </Typography>
                    </Paper>
                </Box>
            )}
            {p2 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Paper
                        elevation={0}
                        sx={{
                            px: 1.25,
                            py: 0.75,
                            maxWidth: '92%',
                            borderRadius: '10px 10px 2px 10px',
                            bgcolor: theme.bubbleUser,
                        }}
                    >
                        <Typography variant="body2" sx={{ color: theme.bubbleUserText, fontSize: '0.8125rem' }}>
                            {p2}
                        </Typography>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}

import ActivityTierNavFooter from './ActivityTierNavFooter';
import { getAdjacentContent } from '../../services/dailyContentService';
import {
    canShowNextNavigation,
    refreshAdjacentFlags,
} from '../../utils/dailyActivityUi';
import {
    buildTierNavSlots,
    type ActivityKind,
} from '../../utils/activityTierPeerNav';

export interface PracticalConversationActivityProps {
    data: DailyContent;
    onContentChange?: (content: DailyContent) => void;
    onSubmissionSuccess?: (progress?: import('../../services/authService').UserProgressSnapshot) => void;
    peerContents?: Partial<Record<ActivityKind, DailyContent | undefined>>;
    onOpenPeer?: (content: DailyContent, kind: ActivityKind) => void;
    accentColor?: string;
}

const PracticalConversationActivity: React.FC<PracticalConversationActivityProps> = ({
    data,
    onContentChange,
    onSubmissionSuccess,
    peerContents,
    onOpenPeer,
    accentColor,
}) => {
    const { user } = useAuth();
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);

    const meta = (currentContent.metadata || {}) as Record<string, unknown>;
    const { participant1, participant2 } = getConversationParticipants(meta);
    const dialogue = normalizeDialogue(meta.dialogue, participant1, participant2);
    const scenarioTitle = String(meta.scenarioTitle || currentContent.title || '');
    const scenarioTitleHi = String(meta.scenarioTitle_hi || '');
    const isToday = isContentScheduledToday(currentContent.date);

    const [exchanges, setExchanges] = useState<ConversationExchange[]>([
        emptyExchange(),
        emptyExchange(),
    ]);
    const [existingSubmission, setExistingSubmission] = useState<UserConversationSubmission | null>(null);
    const [submissionLoading, setSubmissionLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);

    const checkAdjacent = useCallback(async (contentId: string) => {
        const flags = await refreshAdjacentFlags(contentId);
        setHasPrevious(flags.hasPrevious);
        setHasNext(flags.hasNext);
    }, []);

    const loadSubmission = useCallback(async () => {
        if (!user || !currentContent._id) {
            setExistingSubmission(null);
            return;
        }
        setSubmissionLoading(true);
        try {
            const sub = await getUserConversationSubmission(currentContent._id);
            setExistingSubmission(sub);
        } finally {
            setSubmissionLoading(false);
        }
    }, [user, currentContent._id]);

    useEffect(() => {
        setCurrentContent(data);
        void checkAdjacent(data._id);
    }, [data, checkAdjacent]);

    useEffect(() => {
        loadSubmission();
    }, [loadSubmission]);

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacent = await getAdjacentContent(currentContent._id, direction);
            if (adjacent) {
                setCurrentContent(adjacent);
                onContentChange?.(adjacent);
                await checkAdjacent(adjacent._id);
            }
        } finally {
            setIsLoadingNav(false);
        }
    };

    const updateExchange = (index: number, field: keyof ConversationExchange, value: string) => {
        setExchanges((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
        setSubmitStatus(null);
    };

    const addExchange = () => {
        if (exchanges.length >= MAX_EXCHANGES) return;
        setExchanges((prev) => [...prev, emptyExchange()]);
    };

    const removeExchange = (index: number) => {
        if (exchanges.length <= MIN_EXCHANGES) return;
        setExchanges((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !currentContent._id || !isToday) return;

        const normalized = exchanges.map((row) => ({
            participant1Line: row.participant1Line.trim(),
            participant2Line: row.participant2Line.trim(),
        }));

        if (normalized.length < MIN_EXCHANGES || normalized.length > MAX_EXCHANGES) {
            setSubmitStatus({
                type: 'error',
                message: `Submit between ${MIN_EXCHANGES} and ${MAX_EXCHANGES} exchanges.`,
            });
            return;
        }

        for (let i = 0; i < normalized.length; i++) {
            if (!normalized[i].participant1Line || !normalized[i].participant2Line) {
                setSubmitStatus({
                    type: 'error',
                    message: `Exchange ${i + 1}: fill in both ${participant1} and ${participant2} lines.`,
                });
                return;
            }
        }

        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const { progress } = await submitConversationPractice(currentContent._id, normalized);
            setSubmitStatus({ type: 'success', message: 'Practice saved! You earned participation points.' });
            await loadSubmission();
            onSubmissionSuccess?.(progress);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Failed to submit practice.');
            setSubmitStatus({ type: 'error', message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getExchangeReview = (index: number): boolean | null => {
        const v = existingSubmission?.exchangeValidations?.find((e) => e.exchangeIndex === index);
        return v ? v.isCorrect : null;
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 2.5, sm: 3 },
                width: theme.frameWidth,
                maxWidth: theme.frameMaxWidth,
                minWidth: { xs: 0, sm: 360 },
                mx: 'auto',
            }}
        >
            <ConversationChat
                dialogue={dialogue}
                participant1={participant1}
                participant2={participant2}
                scenarioTitle={scenarioTitle}
                scenarioTitleHi={scenarioTitleHi}
                displayNumber={getContentDisplayNumber(currentContent.sequenceNumber)}
            />

            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    bgcolor: theme.practicePanelBg,
                    border: theme.practiceBorder,
                    boxShadow: theme.cardShadow,
                }}
            >
                <Typography variant="h6" fontWeight={800} sx={{ color: theme.headerText, mb: 0.5 }}>
                    Practice this scenario
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(226, 232, 240, 0.82)', mb: 2 }}>
                    Imagine you are in this situation. Write your own dialogue — at least {MIN_EXCHANGES} and up to{' '}
                    {MAX_EXCHANGES} exchanges ({participant1} on the left, {participant2} on the right).
                </Typography>

                {!user && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Sign in to save your practice for today&apos;s conversation.
                    </Alert>
                )}

                {!isToday && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        This is a past conversation — browse the sample only. Submit practice on today&apos;s scenario.
                    </Alert>
                )}

                {submissionLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={28} sx={{ color: theme.accent }} />
                    </Box>
                )}

                {existingSubmission && isToday && (
                    <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            You already submitted practice for this conversation.
                        </Alert>
                        <EvaluationStatusBanner
                            variant="onDark"
                            isCorrect={existingSubmission.isCorrect}
                            evaluationPoints={existingSubmission.evaluationPoints}
                            pointsEarned={existingSubmission.pointsEarned}
                            feedback={existingSubmission.feedback}
                            reviewedAt={existingSubmission.reviewedAt}
                        />
                        <Box sx={{ mb: 2 }}>
                            {existingSubmission.exchanges.map((row, idx) => {
                                const review = getExchangeReview(idx);
                                return (
                                    <Box
                                        key={idx}
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 1.5,
                                            border: '1px solid',
                                            borderColor:
                                                review === true
                                                    ? alpha('#34d399', 0.7)
                                                    : review === false
                                                      ? alpha('#ef4444', 0.7)
                                                      : alpha(theme.accent, 0.35),
                                            bgcolor:
                                                review === true
                                                    ? alpha('#34d399', 0.12)
                                                    : review === false
                                                      ? alpha('#ef4444', 0.12)
                                                      : alpha(theme.accent, 0.08),
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: theme.bubbleLabel, fontWeight: 700 }}>
                                            Exchange {idx + 1}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: theme.bubbleOtherText, mt: 0.5 }}>
                                            <strong>{existingSubmission.participant1}:</strong> {row.participant1Line}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: theme.bubbleOtherText, mt: 0.5 }}>
                                            <strong>{existingSubmission.participant2}:</strong> {row.participant2Line}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </>
                )}

                {submitStatus && (
                    <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                        {submitStatus.message}
                    </Alert>
                )}

                {isToday && user && !existingSubmission && !submissionLoading && (
                    <Box component="form" onSubmit={handleSubmit}>
                        {exchanges.map((row, index) => (
                            <Box
                                key={index}
                                sx={{
                                    mb: 1.5,
                                    p: { xs: 1.25, md: 1.5 },
                                    borderRadius: 2,
                                    border: `1px solid ${alpha(theme.accent, 0.3)}`,
                                    bgcolor: alpha(theme.chatBg, 0.6),
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 1,
                                    }}
                                >
                                    <Chip
                                        size="small"
                                        label={`Exchange ${index + 1}`}
                                        sx={{
                                            fontWeight: 700,
                                            bgcolor: alpha(theme.accent, 0.15),
                                            color: theme.accent,
                                        }}
                                    />
                                    {exchanges.length > MIN_EXCHANGES && (
                                        <IconButton
                                            size="small"
                                            aria-label="Remove exchange"
                                            onClick={() => removeExchange(index)}
                                            sx={{ color: theme.headerMuted }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                        columnGap: 1.5,
                                        rowGap: 1,
                                        width: '100%',
                                    }}
                                >
                                    <Box sx={{ width: '100%', minWidth: 0 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: theme.bubbleLabel,
                                                fontWeight: 700,
                                                display: 'block',
                                                mb: 0.5,
                                            }}
                                        >
                                            ← {participant1}
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            multiline
                                            minRows={1}
                                            maxRows={2}
                                            placeholder={`What does ${participant1} say?`}
                                            value={row.participant1Line}
                                            onChange={(e) =>
                                                updateExchange(index, 'participant1Line', e.target.value)
                                            }
                                            disabled={isSubmitting}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: alpha(theme.bubbleOther, 0.5),
                                                    color: theme.bubbleOtherText,
                                                    alignItems: 'flex-start',
                                                },
                                                '& .MuiInputBase-input': { py: 0.75 },
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ width: '100%', minWidth: 0 }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: theme.bubbleLabel,
                                                fontWeight: 700,
                                                display: 'block',
                                                mb: 0.5,
                                                textAlign: { xs: 'left', md: 'right' },
                                            }}
                                        >
                                            {participant2} →
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            multiline
                                            minRows={1}
                                            maxRows={2}
                                            placeholder={`What do you (${participant2}) say?`}
                                            value={row.participant2Line}
                                            onChange={(e) =>
                                                updateExchange(index, 'participant2Line', e.target.value)
                                            }
                                            disabled={isSubmitting}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: alpha(theme.bubbleUser, 0.4),
                                                    color: theme.bubbleUserText,
                                                    alignItems: 'flex-start',
                                                },
                                                '& .MuiInputBase-input': { py: 0.75 },
                                            }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                    <ExchangePreview
                                        participant1={participant1}
                                        participant2={participant2}
                                        exchange={row}
                                    />
                                </Box>
                            </Box>
                        ))}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Button
                                type="button"
                                variant="outlined"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={addExchange}
                                disabled={exchanges.length >= MAX_EXCHANGES || isSubmitting}
                                sx={{
                                    borderColor: alpha(theme.accent, 0.5),
                                    color: theme.accent,
                                }}
                            >
                                Add exchange ({exchanges.length}/{MAX_EXCHANGES})
                            </Button>
                        </Box>

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                            sx={{
                                fontWeight: 700,
                                textTransform: 'none',
                                bgcolor: theme.accent,
                                '&:hover': { bgcolor: theme.accentDark },
                            }}
                        >
                            {isSubmitting ? 'Submitting…' : 'Submit practice'}
                        </Button>
                    </Box>
                )}

                {peerContents && onOpenPeer && accentColor && (() => {
                    const canGoNext = canShowNextNavigation(currentContent.date, hasNext);
                    const slots = buildTierNavSlots({
                        kind: 'conversation',
                        contents: peerContents,
                        openLinked: onOpenPeer,
                        sequential: {
                            kind: 'conversation',
                            hasPrevious,
                            hasNext: canGoNext,
                            onPrev: () => void handleNavigation('prev'),
                            onNext: () => void handleNavigation('next'),
                            loading: isLoadingNav,
                        },
                    });
                    return (
                        <ActivityTierNavFooter
                            variant="dark"
                            accentColor={accentColor}
                            left={slots.left}
                            center={slots.center}
                            right={slots.right}
                        />
                    );
                })()}
            </Paper>
        </Box>
    );
};

export default PracticalConversationActivity;
