import React from 'react';
import { Box, Typography, type SxProps, type Theme } from '@mui/material';

type PlanPriceOfferProps = {
    offerLabel: string;
    originalLabel?: string | null;
    /** e.g. light text on dark cards */
    variant?: 'default' | 'onDark';
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'right' | 'center';
    sx?: SxProps<Theme>;
};

const PlanPriceOffer: React.FC<PlanPriceOfferProps> = ({
    offerLabel,
    originalLabel,
    variant = 'default',
    size = 'md',
    align = 'left',
    sx,
}) => {
    const onDark = variant === 'onDark';
    const offerSize =
        size === 'lg' ? { xs: '1.35rem', sm: '1.5rem' } : size === 'sm' ? '0.95rem' : { xs: '1.05rem', sm: '1.15rem' };

    return (
        <Box sx={{ textAlign: align, flexShrink: 0, ...sx }}>
            <Box
                sx={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                    gap: 0.35,
                    minWidth: align === 'right' ? 72 : undefined,
                }}
            >
                <Typography
                    component="span"
                    sx={{
                        fontWeight: 800,
                        lineHeight: 1.2,
                        fontSize: offerSize,
                        color: onDark ? '#fff' : '#0f172a',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {offerLabel}
                </Typography>
                {originalLabel && (
                    <Typography
                        component="span"
                        sx={{
                            fontWeight: 500,
                            fontSize: size === 'lg' ? '0.88rem' : '0.75rem',
                            textDecoration: 'line-through',
                            opacity: onDark ? 0.7 : 0.5,
                            color: onDark ? '#e2e8f0' : '#94a3b8',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {originalLabel}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default PlanPriceOffer;
