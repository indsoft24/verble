import React from 'react';
import { Box, Button } from '@mui/material';
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

const navButtonBaseSx = {
    textTransform: 'none' as const,
    fontWeight: 700,
    minHeight: 44,
    borderRadius: 1.5,
    minWidth: 0,
    px: { xs: 1, sm: 1.75 },
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
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
            px: { xs: 1.25, sm: 2 },
            py: 1,
            boxSizing: 'border-box',
            maxWidth: '100vw',
            overflow: 'hidden',
        }}
    >
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns:
                    secondaryActions.length > 0
                        ? `minmax(0, 1.4fr) repeat(${secondaryActions.length}, minmax(0, 1fr))`
                        : '1fr',
                gap: { xs: 0.75, sm: 1 },
                alignItems: 'stretch',
                maxWidth: 960,
                mx: 'auto',
                width: '100%',
            }}
        >
            <Button
                component={RouterLink}
                to={backTo}
                variant="outlined"
                aria-label={backLabel}
                startIcon={<ArrowBackIcon sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />}
                sx={{
                    ...navButtonBaseSx,
                    borderColor: alpha(courseLearningTheme.accent, 0.5),
                    color: courseLearningTheme.textPrimary,
                    overflow: 'hidden',
                    '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 } },
                    '&:hover': {
                        borderColor: courseLearningTheme.accent,
                        bgcolor: alpha(courseLearningTheme.accent, 0.12),
                    },
                }}
            >
                <Box
                    component="span"
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: { xs: 'none', sm: 'inline' },
                    }}
                >
                    {backLabel}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    Lessons
                </Box>
            </Button>
            {secondaryActions.map((action) => {
                const isNext = action.icon === 'next';
                const isPrev = action.icon === 'prev';
                const isContained = action.variant === 'contained' || isNext;

                return (
                    <Button
                        key={action.to + action.label}
                        component={action.disabled ? 'button' : RouterLink}
                        to={action.disabled ? undefined : action.to}
                        variant={action.variant ?? (isNext ? 'contained' : 'outlined')}
                        disabled={action.disabled}
                        aria-label={action.label}
                        startIcon={isPrev ? <ChevronLeftIcon /> : undefined}
                        endIcon={isNext ? <ChevronRightIcon /> : undefined}
                        sx={{
                            ...navButtonBaseSx,
                            whiteSpace: 'nowrap',
                            ...(isContained
                                ? {
                                      bgcolor: courseLearningTheme.accent,
                                      color: '#fff',
                                      boxShadow: 'none',
                                      '&:hover': { bgcolor: alpha(courseLearningTheme.accent, 0.88), boxShadow: 'none' },
                                      '&.Mui-disabled': {
                                          bgcolor: alpha(courseLearningTheme.accent, 0.3),
                                          color: alpha('#fff', 0.5),
                                      },
                                  }
                                : {
                                      borderColor: alpha(courseLearningTheme.accent, 0.5),
                                      color: courseLearningTheme.textPrimary,
                                      '&:hover': {
                                          borderColor: courseLearningTheme.accent,
                                          bgcolor: alpha(courseLearningTheme.accent, 0.12),
                                      },
                                  }),
                            '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                                display: { xs: 'inline-flex', sm: 'inline-flex' },
                                mx: { xs: 0, sm: undefined },
                            },
                            '& .MuiButton-startIcon': { mr: { xs: 0, sm: -0.5 } },
                            '& .MuiButton-endIcon': { ml: { xs: 0, sm: -0.5 } },
                        }}
                    >
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                            {action.label}
                        </Box>
                    </Button>
                );
            })}
        </Box>
    </Box>
);

export default CourseBottomNav;
