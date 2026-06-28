// src/components/features/PuzzleCard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    CircularProgress,
    Alert,
    Divider,
    Chip,
    LinearProgress,
    alpha,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { getAdjacentContent, type DailyContent } from '../../services/dailyContentService';
import { getDisplayTag } from '../../utils/dailyContentDisplayNumber';
import {
    canShowNextNavigation,
} from '../../utils/dailyActivityUi';
import {
    buildTierNavSlots,
    type ActivityKind,
} from '../../utils/activityTierPeerNav';
import ActivityContentHeader from './ActivityContentHeader';
import ActivityTierNavFooter from './ActivityTierNavFooter';
import { getFilledOptionEntries } from '../../utils/quizOptionUtils';
import { activityCardProps } from '../../utils/dailyActivityUi';
import {
    PUZZLE_ACCENT,
    puzzleActivityShellSx,
    puzzleCardContentSx,
    puzzleExplanationBoxSx,
    puzzleFooterHintSx,
    puzzleOptionRowSx,
    puzzleOptionTextSx,
    puzzleOptionsGroupSx,
    puzzleQuestionBlockSx,
    puzzleSubmitButtonSx,
    puzzleQuestionLabelSx,
    puzzleQuestionPromptSx,
    puzzleResultsBoxSx,
    puzzleSubtitleSx,
    puzzleTitleSx,
} from '../../utils/quizActivityStyles';

interface PuzzleCardProps {
    data: DailyContent;
    puzzleType: 'SPOT_CORRECT_SENTENCE' | 'GRAMMAR_FILL_BLANK';
    onSubmissionSuccess?: (progress?: import('../../services/authService').UserProgressSnapshot) => void;
    onContentChange?: (content: DailyContent) => void;
    peerNav?: {
        accentColor: string;
        kind: 'puzzle_spot' | 'puzzle_grammar';
        contents: Partial<Record<ActivityKind, DailyContent | undefined>>;
        openLinked: (content: DailyContent, kind: ActivityKind) => void;
    };
}

interface Question {
    question: string;
    options: string[];
    correct_idx: number;
    explanation?: string;
}

interface Answer {
    questionIndex: number;
    selectedAnswer: number;
}

// Confetti animation keyframes
const confettiFall = keyframes`
    from {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
    }
    to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
    }
`;

// Simple CSS-based Confetti Effect
const ConfettiEffect: React.FC = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1000,
                overflow: 'hidden',
            }}
        >
            {Array.from({ length: 50 }).map((_, i) => {
                const duration = 2 + Math.random() * 2;
                const delay = Math.random() * 0.5;
                const left = Math.random() * 100;
                
                return (
                    <Box
                        key={i}
                        sx={{
                            position: 'absolute',
                            width: 10,
                            height: 10,
                            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                            left: `${left}%`,
                            top: '-10px',
                            animation: `${confettiFall} ${duration}s linear ${delay}s forwards`,
                        }}
                    />
                );
            })}
        </Box>
    );
};

const PuzzleCard: React.FC<PuzzleCardProps> = ({ data, puzzleType, onSubmissionSuccess, peerNav, onContentChange }) => {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<any>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [currentContent, setCurrentContent] = useState<DailyContent>(data);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [isLoadingNav, setIsLoadingNav] = useState(false);
    const submissionRequestIdRef = useRef(0);

    const matchesPuzzleType = (item: DailyContent) =>
        item.metadata?.puzzleType === puzzleType;

    const findAdjacentPuzzle = async (contentId: string, direction: 'prev' | 'next') => {
        let candidate = await getAdjacentContent(contentId, direction);
        let hops = 0;
        while (candidate && !matchesPuzzleType(candidate) && hops < 30) {
            candidate = await getAdjacentContent(candidate._id, direction);
            hops += 1;
        }
        return candidate && matchesPuzzleType(candidate) ? candidate : null;
    };

    const checkAdjacent = async (contentId: string) => {
        const [prevContent, nextContent] = await Promise.all([
            findAdjacentPuzzle(contentId, 'prev'),
            findAdjacentPuzzle(contentId, 'next'),
        ]);
        setHasPrevious(!!prevContent);
        setHasNext(!!nextContent);
    };

    const loadSubmission = useCallback(
        async (puzzleId: string) => {
            const requestId = ++submissionRequestIdRef.current;

            setHasSubmitted(false);
            setSubmissionResult(null);
            setAnswers({});
            setSubmitStatus(null);

            if (!user) return;

            try {
                const response = await apiClient.get(`/submit-puzzle/${puzzleId}`);
                if (requestId !== submissionRequestIdRef.current) return;

                const submission = response.data?.data?.submission;
                if (submission) {
                    setHasSubmitted(true);
                    setSubmissionResult(submission);
                    const submittedAnswers: { [key: number]: number } = {};
                    submission.answers.forEach((ans: { questionIndex: number; selectedAnswer: number }) => {
                        submittedAnswers[ans.questionIndex] = ans.selectedAnswer;
                    });
                    setAnswers(submittedAnswers);
                }
            } catch {
                if (requestId !== submissionRequestIdRef.current) return;
            }
        },
        [user]
    );

    useEffect(() => {
        setCurrentContent(data);
        setShowConfetti(false);
        void checkAdjacent(data._id);
        void loadSubmission(data._id);
    }, [data._id, puzzleType, loadSubmission]);

    const handleNavigation = async (direction: 'prev' | 'next') => {
        setIsLoadingNav(true);
        try {
            const adjacent = await findAdjacentPuzzle(currentContent._id, direction);
            if (adjacent) {
                setCurrentContent(adjacent);
                onContentChange?.(adjacent);
                await checkAdjacent(adjacent._id);
                void loadSubmission(adjacent._id);
            }
        } finally {
            setIsLoadingNav(false);
        }
    };

    const questions: Question[] = currentContent.metadata?.questions || [];

    const handleAnswerChange = (questionIndex: number, value: number) => {
        if (hasSubmitted) return; // Don't allow changes after submission
        setAnswers({
            ...answers,
            [questionIndex]: value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all questions are answered
        if (Object.keys(answers).length !== 5) {
            setSubmitStatus({
                type: 'error',
                message: 'Please answer all 5 questions before submitting.'
            });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const answerArray: Answer[] = Object.keys(answers).map(key => ({
                questionIndex: parseInt(key),
                selectedAnswer: answers[parseInt(key)]
            }));

            const response = await apiClient.post('/submit-puzzle', {
                puzzleId: currentContent._id,
                puzzleType: puzzleType,
                answers: answerArray
            });

            if (response.data?.status === 'success') {
                setSubmitStatus({
                    type: 'success',
                    message: response.data.message || 'Puzzle submitted successfully!'
                });
                setSubmissionResult(response.data.data.submission);
                setHasSubmitted(true);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                onSubmissionSuccess?.(response.data.data.progress);
            } else {
                setSubmitStatus({
                    type: 'error',
                    message: response.data?.message || 'Failed to submit puzzle'
                });
            }
        } catch (error: any) {
            setSubmitStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to submit puzzle. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const puzzleTitle = puzzleType === 'SPOT_CORRECT_SENTENCE' 
        ? 'Spot the Correct Sentence' 
        : 'Correct Use of Grammar';
    const puzzleHeaderLabel =
        puzzleType === 'SPOT_CORRECT_SENTENCE'
            ? 'Puzzle — Spot the Correct Sentence'
            : 'Puzzle — Correct Form of the Verb';
    const displayNumber = getDisplayTag(currentContent.sequenceNumber);

    return (
        <Box sx={puzzleActivityShellSx}>
            {showConfetti && <ConfettiEffect />}

            <Card {...activityCardProps(PUZZLE_ACCENT)}>
            <CardContent sx={puzzleCardContentSx}>
                <Box sx={{ mb: { xs: 2, sm: 2.5 } }}>
                    <ActivityContentHeader
                        contentType="PUZZLE"
                        accentColor={PUZZLE_ACCENT}
                        displayNumber={displayNumber}
                        labelOverride={puzzleHeaderLabel}
                        variant="dark"
                        sx={{ mb: 1.5 }}
                    />

                    <Typography component="h1" sx={puzzleTitleSx(PUZZLE_ACCENT)}>
                        {puzzleTitle}
                    </Typography>
                    <Typography sx={puzzleSubtitleSx}>{currentContent.title}</Typography>
                </Box>

                <Divider sx={{ my: { xs: 2, sm: 2.5 }, borderColor: alpha(PUZZLE_ACCENT, 0.25) }} />

                {hasSubmitted && submissionResult && (
                    <Box sx={puzzleResultsBoxSx(PUZZLE_ACCENT)}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 800, color: '#f8fafc' }}>
                            Your Results
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                                {submissionResult.correctCount} / 5
                            </Typography>
                            <Typography sx={{ color: alpha('#e2e8f0', 0.8) }}>correct</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#4ade80' }}>
                                {submissionResult.pointsEarned} points
                            </Typography>
                            <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.65) }}>
                                earned
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={(submissionResult.correctCount / 5) * 100}
                            sx={{
                                mt: 2,
                                height: 8,
                                borderRadius: 1,
                                bgcolor: alpha('#fff', 0.1),
                                '& .MuiLinearProgress-bar': { bgcolor: PUZZLE_ACCENT },
                            }}
                        />
                    </Box>
                )}

                {/* Questions */}
                <Box component="form" onSubmit={handleSubmit}>
                    {questions.map((question, index) => {
                        const selectedAnswer = answers[index];
                        const isSubmitted = hasSubmitted && submissionResult;
                        const userAnswer = isSubmitted 
                            ? submissionResult.answers.find((a: any) => a.questionIndex === index)
                            : null;
                        const isCorrect = userAnswer?.isCorrect;

                        return (
                            <Box key={index} sx={puzzleQuestionBlockSx(PUZZLE_ACCENT)}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <Typography sx={puzzleQuestionLabelSx}>
                                        Question {index + 1}
                                    </Typography>
                                    {isSubmitted &&
                                        (isCorrect ? (
                                            <CheckCircleIcon sx={{ color: '#4ade80', fontSize: 22 }} />
                                        ) : (
                                            <CancelIcon sx={{ color: '#f87171', fontSize: 22 }} />
                                        ))}
                                </Box>

                                {puzzleType === 'GRAMMAR_FILL_BLANK' ? (
                                    <Typography component="div" sx={puzzleQuestionPromptSx}>
                                        {question.question.split('___').map((part, i) => (
                                            <React.Fragment key={i}>
                                                {part}
                                                {i < question.question.split('___').length - 1 && (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            borderBottom: '2px solid',
                                                            borderColor: PUZZLE_ACCENT,
                                                            px: 0.75,
                                                            fontWeight: 700,
                                                            color: PUZZLE_ACCENT,
                                                        }}
                                                    >
                                                        {'___'}
                                                    </Box>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </Typography>
                                ) : (
                                    <Typography component="div" sx={puzzleQuestionPromptSx}>
                                        {question.question}
                                    </Typography>
                                )}

                                <RadioGroup
                                    value={selectedAnswer !== undefined ? selectedAnswer : ''}
                                    onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                                    sx={puzzleOptionsGroupSx}
                                >
                                    {getFilledOptionEntries(question.options).map(({ text, index: optIndex }) => {
                                        const isSelected = selectedAnswer === optIndex;
                                        const isCorrectOption = optIndex === question.correct_idx;
                                        const showResult = Boolean(isSubmitted && isSelected);

                                        return (
                                            <FormControlLabel
                                                key={optIndex}
                                                value={optIndex}
                                                disabled={hasSubmitted}
                                                control={<Radio size="medium" />}
                                                label={
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Typography sx={puzzleOptionTextSx}>{text}</Typography>
                                                        {showResult &&
                                                            (isCorrect ? (
                                                                <CheckCircleIcon
                                                                    sx={{
                                                                        color: '#4ade80',
                                                                        fontSize: 22,
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <CancelIcon
                                                                    sx={{
                                                                        color: '#f87171',
                                                                        fontSize: 22,
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                            ))}
                                                        {isSubmitted && isCorrectOption && !isSelected && (
                                                            <Chip
                                                                label="Correct"
                                                                size="small"
                                                                sx={{
                                                                    flexShrink: 0,
                                                                    borderColor: alpha('#4ade80', 0.6),
                                                                    color: '#4ade80',
                                                                    height: 26,
                                                                }}
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                sx={puzzleOptionRowSx({
                                                    accent: PUZZLE_ACCENT,
                                                    selected: isSelected,
                                                    showResult,
                                                    isCorrect: Boolean(isCorrect),
                                                    disabled: hasSubmitted,
                                                })}
                                            />
                                        );
                                    })}
                                </RadioGroup>

                                {isSubmitted && question.explanation && (
                                    <Box sx={puzzleExplanationBoxSx}>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 700, mb: 0.5, color: '#7dd3fc' }}
                                        >
                                            Explanation
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.9), lineHeight: 1.5 }}>
                                            {question.explanation}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}

                    {submitStatus && (
                        <Alert severity={submitStatus.type} sx={{ mb: 2 }}>
                            {submitStatus.message}
                        </Alert>
                    )}

                    {!hasSubmitted && (
                        <Box sx={{ mt: { xs: 3, sm: 3.5 }, px: { xs: 0, sm: 0 } }}>
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                fullWidth
                                disableElevation
                                endIcon={
                                    isSubmitting ? (
                                        <CircularProgress size={20} sx={{ color: '#fff' }} />
                                    ) : (
                                        <SendIcon />
                                    )
                                }
                                disabled={
                                    Object.keys(answers).length !== 5 ||
                                    isSubmitting ||
                                    !user
                                }
                                sx={puzzleSubmitButtonSx(PUZZLE_ACCENT)}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                            </Button>
                        </Box>
                    )}

                    {!user && (
                        <Typography
                            variant="body2"
                            sx={{ mt: 2, textAlign: 'center', color: alpha('#e2e8f0', 0.65) }}
                        >
                            Please log in to submit answers.
                        </Typography>
                    )}

                    <Typography variant="body2" sx={puzzleFooterHintSx}>
                        You earn 10 points for each correct answer.
                    </Typography>

                    {peerNav && (() => {
                        const canGoNext = canShowNextNavigation(currentContent.date, hasNext);
                        const slots = buildTierNavSlots({
                            kind: peerNav.kind,
                            contents: peerNav.contents,
                            openLinked: peerNav.openLinked,
                            sequential: {
                                kind: peerNav.kind,
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
                                accentColor={peerNav.accentColor}
                                left={slots.left}
                                center={slots.center}
                                right={slots.right}
                            />
                        );
                    })()}
                </Box>
            </CardContent>
            </Card>
        </Box>
    );
};

export default PuzzleCard;
