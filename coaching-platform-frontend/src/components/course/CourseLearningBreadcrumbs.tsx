import React from 'react';
import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { courseLearningTheme } from './courseLearningTheme';

export interface CourseBreadcrumbItem {
    label: string;
    to?: string;
}

export interface CourseLearningBreadcrumbsProps {
    items: CourseBreadcrumbItem[];
}

const CourseLearningBreadcrumbs: React.FC<CourseLearningBreadcrumbsProps> = ({ items }) => (
    <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
            mb: courseLearningTheme.breadcrumbMb,
            '& .MuiBreadcrumbs-separator': { color: courseLearningTheme.textMuted },
        }}
    >
        {items.map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast || !item.to) {
                return (
                    <Typography
                        key={`${item.label}-${index}`}
                        sx={{
                            fontSize: 13,
                            fontWeight: isLast ? 600 : 400,
                            maxWidth: { xs: 140, sm: 220 },
                            color: isLast ? courseLearningTheme.textPrimary : courseLearningTheme.textSecondary,
                        }}
                        noWrap
                    >
                        {item.label}
                    </Typography>
                );
            }
            return (
                <MuiLink
                    key={`${item.label}-${index}`}
                    component={RouterLink}
                    to={item.to}
                    underline="hover"
                    sx={{ fontSize: 14, color: courseLearningTheme.textSecondary, maxWidth: { xs: 100, sm: 180 } }}
                    noWrap
                >
                    {item.label}
                </MuiLink>
            );
        })}
    </Breadcrumbs>
);

export default CourseLearningBreadcrumbs;
