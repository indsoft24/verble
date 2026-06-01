import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { courseLearningTheme, courseBottomNavZIndex } from './courseLearningTheme';

export interface CourseBottomNavAction {
    label: string;
    to: string;
    variant?: 'contained' | 'outlined';
    disabled?: boolean;
    icon?: 'prev' | 'next';
}

export interface CourseBottomNavProps {
    backLabel: string;
    backTo: string;
    secondaryActions?: CourseBottomNavAction[];
}

const navButtonSx = {
    textTransform: 'none' as const,
    fontWeight: 700,
    minHeight: 44,
    borderRadius: 1.5,
    flex: { xs: 1, sm: 'none' },
    whiteSpace: 'nowrap' as const,
};

const CourseBottomNav: React.FC<CourseBottomNavProps> = ({
    backLabel,
    backTo,
    secondaryActions = [],
}) => (
    <Box
        component="nav"
        aria-label="Course navigation"
        sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: courseBottomNavZIndex,
            bgcolor: courseLearningTheme.surfaceRaised,
            borderTop: `1px solid ${alpha(courseLearningTheme.accent, 0.35)}`,
            boxShadow: `0 -4px 24px ${alpha('#000', 0.35)}`,
            pb: courseLearningTheme.bottomNavSafePadding,
            px: { xs: 1.5, sm: 2 },
            py: 1,
        }}
    >
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            sx={{ maxWidth: 960, mx: 'auto', width: '100%' }}
        >
            <Button
                component={RouterLink}
                to={backTo}
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                sx={{
                    ...navButtonSx,
                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                    color: courseLearningTheme.textPrimary,
                    minWidth: { xs: 'auto', sm: 160 },
                    '&:hover': {
                        borderColor: courseLearningTheme.accent,
                        bgcolor: alpha(courseLearningTheme.accent, 0.12),
                    },
                }}
            >
                {backLabel}
            </Button>
            {secondaryActions.map((action) => (
                <Button
                    key={action.to + action.label}
                    component={action.disabled ? 'button' : RouterLink}
                    to={action.disabled ? undefined : action.to}
                    variant={action.variant ?? (action.icon === 'next' ? 'contained' : 'outlined')}
                    disabled={action.disabled}
                    startIcon={action.icon === 'prev' ? <ChevronLeftIcon /> : undefined}
                    endIcon={action.icon === 'next' ? <ChevronRightIcon /> : undefined}
                    sx={{
                        ...navButtonSx,
                        ...(action.variant === 'contained' || action.icon === 'next'
                            ? {
                                  bgcolor: courseLearningTheme.accent,
                                  color: '#fff',
                                  boxShadow: 'none',
                                  '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.88), boxShadow: 'none' },
                                  '&.Mui-disabled': { bgcolor: alpha(courseLearningTheme.accent, 0.3), color: alpha('#fff', 0.5) },
                              }
                            : {
                                  borderColor: alpha(courseLearningTheme.accent, 0.5),
                                  color: courseLearningTheme.textPrimary,
                                  '&:hover': {
                                      borderColor: courseLearningTheme.accent,
                                      bgcolor: alpha(courseLearningTheme.accent, 0.12),
                                  },
                              }),
                    }}
                >
                    {action.label}
                </Button>
            ))}
        </Stack>
    </Box>
);

export default CourseBottomNav;
