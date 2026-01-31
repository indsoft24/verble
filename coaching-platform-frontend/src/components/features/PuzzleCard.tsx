// src/components/features/PuzzleCard.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    CircularProgress,
    Alert,
    Divider,
    Chip,
    LinearProgress
} from '@mui/material';
import { keyframes } from '@emotion/react';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { type DailyContent } from '../../services/dailyContentService';

interface PuzzleCardProps {
    data: DailyContent;
    puzzleType: 'SPOT_CORRECT_SENTENCE' | 'GRAMMAR_FILL_BLANK';
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

const PuzzleCard: React.FC<PuzzleCardProps> = ({ data, puzzleType }) => {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [submissionResult, setSubmissionResult] = useState<any>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    useEffect(() => {
        // Check if user has already submitted
        const checkSubmission = async () => {
            if (!user) return;
            try {
                const response = await apiClient.get(`/submit-puzzle/${data._id}`);
                if (response.data?.data?.submission) {
                    setHasSubmitted(true);
                    setSubmissionResult(response.data.data.submission);
                    // Pre-populate answers from submission
                    const submittedAnswers: { [key: number]: number } = {};
                    response.data.data.submission.answers.forEach((ans: any) => {
                        submittedAnswers[ans.questionIndex] = ans.selectedAnswer;
                    });
                    setAnswers(submittedAnswers);
                }
            } catch (error) {
                // No submission found, which is fine
            }
        };
        checkSubmission();
    }, [data._id, user]);

    const questions: Question[] = data.metadata?.questions || [];

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
                puzzleId: data._id,
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

    return (
        <Card
            elevation={4}
            sx={{
                maxWidth: 800,
                margin: '0 auto',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Confetti Effect */}
            {showConfetti && <ConfettiEffect />}

            <CardContent sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Daily Puzzle
                        </Typography>
                        <Chip label={data.level} size="small" color="primary" />
                    </Box>
                    
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                        }}
                    >
                        {puzzleTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {data.title}
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Results Summary (if submitted) */}
                {hasSubmitted && submissionResult && (
                    <Box sx={{ mb: 4, p: 2, backgroundColor: 'primary.light', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                            Your Results
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {submissionResult.correctCount} / 5
                            </Typography>
                            <Typography variant="body1">
                                Correct Answers
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {submissionResult.pointsEarned} points
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                earned
                            </Typography>
                        </Box>
                        <LinearProgress 
                            variant="determinate" 
                            value={(submissionResult.correctCount / 5) * 100} 
                            sx={{ mt: 2, height: 8, borderRadius: 1 }}
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
                            <Box key={index} sx={{ mb: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                        Question {index + 1}
                                    </Typography>
                                    {isSubmitted && (
                                        isCorrect ? (
                                            <CheckCircleIcon color="success" />
                                        ) : (
                                            <CancelIcon color="error" />
                                        )
                                    )}
                                </Box>

                                {puzzleType === 'GRAMMAR_FILL_BLANK' ? (
                                    <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
                                        {question.question.split('___').map((part, i) => (
                                            <React.Fragment key={i}>
                                                {part}
                                                {i < question.question.split('___').length - 1 && (
                                                    <Box component="span" sx={{ 
                                                        borderBottom: '2px solid',
                                                        borderColor: 'primary.main',
                                                        px: 1,
                                                        fontWeight: 'bold',
                                                        color: 'primary.main'
                                                    }}>
                                                        {'___'}
                                                    </Box>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </Typography>
                                ) : (
                                    <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem' }}>
                                        {question.question}
                                    </Typography>
                                )}

                                <FormControl component="fieldset" fullWidth>
                                    <RadioGroup
                                        value={selectedAnswer !== undefined ? selectedAnswer : ''}
                                        onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                                    >
                                        {question.options.map((option, optIndex) => {
                                            const isSelected = selectedAnswer === optIndex;
                                            const isCorrectOption = optIndex === question.correct_idx;
                                            const showResult = isSubmitted && isSelected;

                                            return (
                                                <FormControlLabel
                                                    key={optIndex}
                                                    value={optIndex}
                                                    control={<Radio />}
                                                    disabled={hasSubmitted}
                                                    label={
                                                        <Box sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 1,
                                                            p: 1,
                                                            borderRadius: 1,
                                                            backgroundColor: showResult 
                                                                ? (isCorrect ? 'success.light' : 'error.light')
                                                                : 'transparent',
                                                            width: '100%'
                                                        }}>
                                                            <Typography variant="body1">
                                                                {option}
                                                            </Typography>
                                                            {showResult && (
                                                                isCorrect ? (
                                                                    <CheckCircleIcon color="success" fontSize="small" />
                                                                ) : (
                                                                    <CancelIcon color="error" fontSize="small" />
                                                                )
                                                            )}
                                                            {isSubmitted && isCorrectOption && !isSelected && (
                                                                <Chip 
                                                                    label="Correct Answer" 
                                                                    size="small" 
                                                                    color="success" 
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    }
                                                    sx={{
                                                        mb: 1,
                                                        border: showResult 
                                                            ? (isCorrect ? '2px solid' : '2px solid')
                                                            : '1px solid',
                                                        borderColor: showResult 
                                                            ? (isCorrect ? 'success.main' : 'error.main')
                                                            : 'divider',
                                                        borderRadius: 1,
                                                        '&:hover': {
                                                            backgroundColor: hasSubmitted ? 'transparent' : 'action.hover'
                                                        }
                                                    }}
                                                />
                                            );
                                        })}
                                    </RadioGroup>
                                </FormControl>

                                {isSubmitted && question.explanation && (
                                    <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                            Explanation:
                                        </Typography>
                                        <Typography variant="body2">
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
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                endIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                disabled={
                                    Object.keys(answers).length !== 5 ||
                                    isSubmitting ||
                                    !user
                                }
                                sx={{ minWidth: 200 }}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                            </Button>
                        </Box>
                    )}

                    {!user && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            Please log in to submit answers.
                        </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                        You earn 10 points for each correct answer.
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default PuzzleCard;
