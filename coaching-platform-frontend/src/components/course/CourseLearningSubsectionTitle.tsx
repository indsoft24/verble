import React from 'react';
import { Typography, type TypographyProps } from '@mui/material';
import { courseLearningSubsectionTitleSx } from './courseLearningTheme';

export type CourseLearningSubsectionTitleProps = TypographyProps;

const CourseLearningSubsectionTitle: React.FC<CourseLearningSubsectionTitleProps> = ({
    children,
    sx,
    ...rest
}) => (
    <Typography
        variant="subtitle2"
        component="h6"
        sx={{ ...courseLearningSubsectionTitleSx, ...sx }}
        {...rest}
    >
        {children}
    </Typography>
);

export default CourseLearningSubsectionTitle;
