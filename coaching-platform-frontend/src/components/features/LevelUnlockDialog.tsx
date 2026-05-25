// src/components/features/LevelUnlockDialog.tsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    alpha,
    useTheme,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';

interface LevelUnlockDialogProps {
    open: boolean;
    onClose: () => void;
    level: 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE' | null;
    isUnlocked: boolean;
    /** When opened from a specific activity card */
    activityName?: string | null;
}

const levelAccent: Record<NonNullable<LevelUnlockDialogProps['level']>, string> = {
    BRONZE: '#ea580c',
    SILVER: '#3b82f6',
    GOLD: '#ca8a04',
    FULL_COURSE: '#7c3aed',
};

const levelInfo = {
    BRONZE: {
        title: 'Bronze membership',
        intro: 'Adds daily reading and weekly themed vocabulary on top of your free routine.',
        requirements: [
            'Complete 30 consecutive days of free activities (word & phrase of the day), without skipping a day.',
            'Alternative path: engage with free content on at least 70% of the days in the last 30-day window to unlock Bronze.',
        ],
        benefits: ['One minute read — short story with summary practice', 'Weekly essentials vocabulary — themed word sets'],
    },
    SILVER: {
        title: 'Silver membership',
        intro: 'Conversation-first practice plus structured daily puzzles.',
        requirements: [
            'Complete the Bronze track: 60 consecutive days of Bronze-level activities.',
            'Alternative path: attempt Bronze content on at least 70% of the days in the last 60-day window.',
            'You must already have Bronze unlocked (includes completing the free challenge first).',
        ],
        benefits: [
            'Practical conversations — everyday dialogues',
            'Daily puzzle — spot the correct sentence',
            'Grammar puzzle — choose the correct verb form',
        ],
    },
    GOLD: {
        title: 'Gold membership',
        intro: 'Premium media, scenes, speeches, lyrics, curated feeds, and professional dialogues.',
        requirements: [
            'Purchase an active Gold subscription from Subscription Plans.',
            'Gold also keeps Free, Bronze, and Silver tracks open for the subscription period.',
        ],
        benefits: [
            'Explain the scene / situation',
            'Famous speeches & conversations',
            'Song lyrics study',
            'Curated Instagram feeds',
            'Professional conversations',
        ],
    },
    FULL_COURSE: {
        title: 'Full course',
        intro: 'The complete structured journey: modules, sequential videos, quizzes, and certificate assessment.',
        requirements: [
            'Purchase Full Course at the listed price on the portal, or enroll via seminar at the promotional rate.',
            'Includes everything in Free, Bronze, Silver, and Gold for the subscription period per your plan.',
        ],
        benefits: [
            'All daily tracks above',
            'Module-by-module video path with unlock progression',
            'Module puzzles and final certificate assessment (70% to pass)',
        ],
    },
};

const LevelUnlockDialog: React.FC<LevelUnlockDialogProps> = ({ open, onClose, level, isUnlocked, activityName }) => {
    const theme = useTheme();
    const info = level ? levelInfo[level] : null;
    const accent = level ? levelAccent[level] : theme.palette.primary.main;

    if (!info) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            scroll="body"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                },
            }}
        >
            <Box sx={{ height: 4, width: 1, bgcolor: accent }} />
            <DialogTitle sx={{ pt: 2.5, pb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: 1 }}>
                    How to unlock
                </Typography>
                <Typography variant="h6" component="div" sx={{ fontWeight: 900, mt: 0.5, lineHeight: 1.25 }}>
                    {activityName ? activityName : info.title}
                </Typography>
                {!activityName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
                        {info.intro}
                    </Typography>
                )}
                {activityName && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.55 }}>
                        {info.title}: {info.intro}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent sx={{ px: 3, pb: 1 }}>
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        mb: 2,
                        bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.12 : 0.08),
                        border: '1px solid',
                        borderColor: alpha(accent, 0.25),
                        display: 'flex',
                        gap: 1.5,
                        alignItems: 'flex-start',
                    }}
                >
                    <TipsAndUpdatesOutlinedIcon sx={{ color: accent, mt: 0.25 }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                            Follow these steps
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                            Your streak and daily attempts are tracked automatically. Finish the steps below to open this section in the app.
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Requirements
                </Typography>
                <List dense disablePadding sx={{ mb: 2 }}>
                    {info.requirements.map((req, index) => (
                        <ListItem key={index} alignItems="flex-start" sx={{ py: 0.75, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36, mt: 0.25 }}>
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        bgcolor: 'action.hover',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12,
                                        fontWeight: 800,
                                        color: 'text.secondary',
                                    }}
                                >
                                    {index + 1}
                                </Box>
                            </ListItemIcon>
                            <ListItemText primary={req} primaryTypographyProps={{ variant: 'body2', sx: { lineHeight: 1.55 } }} />
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    What you get
                </Typography>
                <List dense disablePadding>
                    {info.benefits.map((benefit, index) => (
                        <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                {isUnlocked ? (
                                    <CheckCircleOutlineIcon fontSize="small" color="success" />
                                ) : (
                                    <LockOutlinedIcon fontSize="small" color="disabled" />
                                )}
                            </ListItemIcon>
                            <ListItemText primary={benefit} primaryTypographyProps={{ variant: 'body2', sx: { lineHeight: 1.5 } }} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
                <Button onClick={onClose} variant="contained" size="large" fullWidth sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}>
                    Got it
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LevelUnlockDialog;
