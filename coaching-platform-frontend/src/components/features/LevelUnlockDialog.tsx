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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

interface LevelUnlockDialogProps {
    open: boolean;
    onClose: () => void;
    level: 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE' | null;
    isUnlocked: boolean;
}

const levelInfo = {
    BRONZE: {
        title: 'Bronze Level',
        requirements: [
            '30 consecutive days of practice OR',
            '70% completion rate in last 30 days',
        ],
        benefits: [
            'Access to Daily Stories',
            'Access to Weekly Vocabulary Sets',
            'Access to Phrase of the Day',
            'Earn more points and coins',
        ],
    },
    SILVER: {
        title: 'Silver Level',
        requirements: [
            '60 consecutive days of practice OR',
            '70% completion rate in last 60 days',
        ],
        benefits: [
            'Access to Conversation Practice',
            'Access to Daily Puzzles',
            'Access to all Bronze content',
            'Advanced learning materials',
        ],
    },
    GOLD: {
        title: 'Gold Level',
        requirements: [
            '90 consecutive days of practice OR',
            '70% completion rate in last 90 days',
        ],
        benefits: [
            'Access to Professional Conversations',
            'Access to Famous Speeches',
            'Access to Song Lyrics',
            'Access to Instagram Feeds',
            'Access to AI Prompts',
            'Access to all previous levels',
        ],
    },
    FULL_COURSE: {
        title: 'Full Course',
        requirements: [
            'Purchase Full Course subscription',
            'Complete structured modules',
            'Pass module quizzes (70% score)',
            'Complete certificate assessment',
        ],
        benefits: [
            'Access to all course modules',
            'Structured learning path',
            'Module quizzes and assessments',
            'E-certificate upon completion',
            'Access to all content levels',
        ],
    },
};

const LevelUnlockDialog: React.FC<LevelUnlockDialogProps> = ({ open, onClose, level, isUnlocked }) => {
    const info = level ? levelInfo[level] : null;

    if (!info) {
        return null;
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isUnlocked ? (
                        <CheckCircleIcon color="success" />
                    ) : (
                        <LockIcon color="disabled" />
                    )}
                    <Typography variant="h6">{info.title}</Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Requirements to Unlock:
                    </Typography>
                    <List dense>
                        {info.requirements.map((req, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <LockIcon fontSize="small" color="disabled" />
                                </ListItemIcon>
                                <ListItemText primary={req} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Benefits:
                    </Typography>
                    <List dense>
                        {info.benefits.map((benefit, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <CheckCircleIcon fontSize="small" color="success" />
                                </ListItemIcon>
                                <ListItemText primary={benefit} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LevelUnlockDialog;
