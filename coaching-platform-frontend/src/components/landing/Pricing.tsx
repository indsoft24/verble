import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Card, Chip, Divider, Grid, Stack, Typography, useTheme } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import Reveal from './Reveal';
import LandingSection from './LandingSection';
import LandingContainer from './LandingContainer';
import { CARD_PADDING, CARD_BORDER_RADIUS, TYPO, SPACING, CARD_GAP } from '../../landing/designSystem';

/** Uniform card height (fixed, not derived from tallest sibling in the row). */
const PRICING_CARD_PX = 460;

export type PricingPlan = {
    name: string;
    price: string;
    period: string;
    highlight: string;
    features: string[];
};

type PricingProps = {
    plans: PricingPlan[];
    onCta: () => void;
};

function isFreePlan(plan: PricingPlan): boolean {
    const p = plan.price.replace(/[₹,\s]/g, '');
    return p === '0' || plan.price.includes('₹0') || /^[\$€]?0($|\.)/.test(plan.price.trim());
}

const Pricing: React.FC<PricingProps> = ({ plans, onCta }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const featuredName = useMemo((): string => {
        const full = plans.find((p: PricingPlan) => p.name.toLowerCase().includes('full course'));
        if (full) return full.name;
        const gold = plans.find((p: PricingPlan) => p.name.toLowerCase().includes('gold'));
        if (gold) return gold.name;
        const pro = plans.find((p: PricingPlan) => p.name === 'Pro');
        if (pro) return pro.name;
        return plans.length >= 3 ? plans[Math.floor(plans.length / 2)]?.name ?? '' : '';
    }, [plans]);

    const ctaLabelFn = (plan: PricingPlan): string => {
        if (isFreePlan(plan)) return t('landing.ctaStartFree');
        if (plan.name.toLowerCase().includes('silver')) return t('landing.ctaUpgradeSilver');
        return t('landing.ctaGetStarted');
    };

    const scrollFadeBg = (featured: boolean) =>
        featured
            ? isDark
                ? 'linear-gradient(to bottom, rgba(15,23,42,0), rgba(15,23,42,0.92) 65%, rgba(15,23,42,0.98))'
                : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.92) 65%, rgba(255,255,255,0.98))'
            : isDark
              ? 'linear-gradient(to bottom, rgba(15,23,42,0), rgba(15,23,42,0.72) 65%, rgba(15,23,42,0.78))'
              : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.78) 65%, rgba(255,255,255,0.86))';

    return (
        <LandingSection bgcolor={isDark ? '#020617' : '#F1F5F9'}>
            <LandingContainer>
                <Box
                    sx={{
                        position: 'relative',
                        borderRadius: CARD_BORDER_RADIUS + 2,
                        overflow: 'hidden',
                        p: { xs: SPACING.lg, md: SPACING.xl },
                        border: isDark ? '1px solid rgba(71,85,105,0.55)' : '1px solid rgba(226,232,240,0.9)',
                        background: isDark
                            ? 'linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.96) 50%, rgba(30,27,75,0.25) 100%)'
                            : 'linear-gradient(165deg, #FFFFFF 0%, #F8FAFC 35%, #EEF2FF 100%)',
                        boxShadow: isDark ? '0 24px 80px rgba(2,6,23,0.45)' : '0 20px 60px rgba(15,23,42,0.08)',
                        '@keyframes pricingBlob': {
                            '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.5 },
                            '50%': { transform: 'translate(12px, -18px) scale(1.05)', opacity: 0.65 },
                        },
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '-40%',
                            right: '-15%',
                            width: 'min(420px, 85vw)',
                            height: 'min(420px, 85vw)',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 68%)',
                            pointerEvents: 'none',
                            animation: 'pricingBlob 12s ease-in-out infinite',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: '-35%',
                            left: '-10%',
                            width: 'min(360px, 75vw)',
                            height: 'min(360px, 75vw)',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 65%)',
                            pointerEvents: 'none',
                            animation: 'pricingBlob 14s ease-in-out infinite reverse',
                        }}
                    />

                    <Box sx={{ position: 'relative' }}>
                        <Reveal>
                            <Stack spacing={SPACING.md} alignItems="center" sx={{ mb: { xs: 4, md: 5 }, textAlign: 'center' }}>
                                <Chip
                                    icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 18 }} />}
                                    label={t('landing.pricingChip')}
                                    size="small"
                                    sx={{
                                        borderRadius: '999px',
                                        fontWeight: 600,
                                        bgcolor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                                        color: isDark ? '#C7D2FE' : '#4338CA',
                                        border: isDark ? '1px solid rgba(129,140,248,0.35)' : '1px solid rgba(129,140,248,0.35)',
                                        '& .MuiChip-icon': { color: 'inherit' },
                                    }}
                                />
                                <Typography
                                    component="h2"
                                    sx={{
                                        fontWeight: 800,
                                        fontSize: TYPO.sectionTitle,
                                        letterSpacing: '-0.04em',
                                        maxWidth: 720,
                                        color: isDark ? '#F9FAFB' : '#0F172A',
                                        lineHeight: 1.15,
                                    }}
                                >
                                    {t('landing.pricingTitle')}
                                </Typography>
                                <Typography
                                    sx={{
                                        color: 'text.secondary',
                                        fontSize: TYPO.body,
                                        maxWidth: 560,
                                        lineHeight: 1.65,
                                    }}
                                >
                                    {t('landing.pricingSubtitle')}
                                </Typography>
                            </Stack>
                        </Reveal>

                        <Grid container spacing={CARD_GAP}>
                            {plans.map((plan: PricingPlan, index: number) => {
                                const featured = plan.name === featuredName;
                                return (
                                    <Grid key={`${plan.name}-${index}`} size={{ xs: 12, sm: 6, md: 4, lg: plans.length > 4 ? 3 : 4 }}>
                                        <Reveal delay={Math.min(index * 55, 220)}>
                                            <Box sx={{ width: '100%', minWidth: 0 }}>
                                            <Card
                                                elevation={0}
                                                sx={{
                                                    position: 'relative',
                                                    width: '100%',
                                                    minWidth: 0,
                                                    minHeight: PRICING_CARD_PX,
                                                    height: PRICING_CARD_PX,
                                                    maxHeight: PRICING_CARD_PX,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    borderRadius: CARD_BORDER_RADIUS,
                                                    p: CARD_PADDING,
                                                    overflow: 'hidden',
                                                    boxSizing: 'border-box',
                                                    bgcolor: featured
                                                        ? isDark
                                                            ? 'rgba(15,23,42,0.92)'
                                                            : 'rgba(255,255,255,0.94)'
                                                        : isDark
                                                          ? 'rgba(15,23,42,0.72)'
                                                          : 'rgba(255,255,255,0.78)',
                                                    backdropFilter: 'blur(14px)',
                                                    border: featured
                                                        ? '2px solid rgba(129,140,248,0.75)'
                                                        : isDark
                                                          ? '1px solid rgba(148,163,184,0.2)'
                                                          : '1px solid rgba(203,213,225,0.65)',
                                                    boxShadow: featured
                                                        ? isDark
                                                            ? '0 20px 50px rgba(2,6,23,0.55), 0 0 0 1px rgba(99,102,241,0.25)'
                                                            : '0 16px 48px rgba(79,70,229,0.18), 0 0 0 1px rgba(99,102,241,0.12)'
                                                        : isDark
                                                          ? '0 12px 32px rgba(2,6,23,0.35)'
                                                          : '0 8px 28px rgba(15,23,42,0.07)',
                                                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-6px)',
                                                        boxShadow: featured
                                                            ? isDark
                                                                ? '0 26px 60px rgba(2,6,23,0.6)'
                                                                : '0 22px 56px rgba(79,70,229,0.22)'
                                                            : isDark
                                                              ? '0 18px 40px rgba(2,6,23,0.45)'
                                                              : '0 14px 36px rgba(15,23,42,0.11)',
                                                    },
                                                    '&::before': featured
                                                        ? {
                                                              content: '""',
                                                              position: 'absolute',
                                                              top: 0,
                                                              left: 0,
                                                              right: 0,
                                                              height: 4,
                                                              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #3B82F6)',
                                                          }
                                                        : undefined,
                                                }}
                                            >
                                                {/* A — Header (title + price); bounded so footer never clips */}
                                                <Box
                                                    sx={{
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 3,
                                                    }}
                                                >
                                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 700,
                                                                fontSize: TYPO.subtitle,
                                                                color: featured ? (isDark ? '#F9FAFB' : '#0F172A') : undefined,
                                                                lineHeight: 1.3,
                                                                pr: 0.5,
                                                            }}
                                                        >
                                                            {plan.name}
                                                        </Typography>
                                                        {featured ? (
                                                            <Chip
                                                                label={t('landing.pricingPopular')}
                                                                size="small"
                                                                sx={{
                                                                    borderRadius: '999px',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.7rem',
                                                                    height: 26,
                                                                    flexShrink: 0,
                                                                    bgcolor: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)',
                                                                    color: isDark ? '#86EFAC' : '#15803D',
                                                                    border: '1px solid rgba(34,197,94,0.35)',
                                                                }}
                                                            />
                                                        ) : null}
                                                    </Stack>

                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: { xs: '1.65rem', md: '1.85rem' },
                                                                letterSpacing: '-0.03em',
                                                                color: featured ? (isDark ? '#F9FAFB' : '#0F172A') : undefined,
                                                                lineHeight: 1.1,
                                                            }}
                                                        >
                                                            {plan.price}
                                                        </Typography>
                                                        <Typography
                                                            sx={{
                                                                mt: 0.35,
                                                                color: featured
                                                                    ? isDark
                                                                        ? '#94A3B8'
                                                                        : '#64748B'
                                                                    : 'text.secondary',
                                                                fontSize: TYPO.bodySmall,
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {plan.period}
                                                        </Typography>
                                                    </Box>

                                                    <Typography
                                                        component="p"
                                                        title={plan.highlight}
                                                        sx={{
                                                            m: 0,
                                                            color: featured
                                                                ? isDark
                                                                    ? '#CBD5E1'
                                                                    : '#475569'
                                                                : 'text.secondary',
                                                            fontSize: TYPO.bodySmall,
                                                            lineHeight: 1.5,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {plan.highlight}
                                                    </Typography>

                                                    <Divider
                                                        sx={{
                                                            borderColor: featured
                                                                ? isDark
                                                                    ? 'rgba(71,85,105,0.6)'
                                                                    : 'rgba(226,232,240,0.95)'
                                                                : 'divider',
                                                        }}
                                                    />
                                                </Box>

                                                {/* B — Feature list only (scroll); C — footer with mt-auto */}
                                                <Box
                                                    sx={{
                                                        position: 'relative',
                                                        flex: 1,
                                                        minHeight: 0,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        mt: 3,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            flex: 1,
                                                            minHeight: 0,
                                                            overflowY: 'auto',
                                                            overflowX: 'hidden',
                                                            pr: 1.5,
                                                            scrollBehavior: 'smooth',
                                                            WebkitOverflowScrolling: 'touch',
                                                            scrollbarWidth: 'none',
                                                            msOverflowStyle: 'none',
                                                            '&::-webkit-scrollbar': { display: 'none' },
                                                        }}
                                                    >
                                                        <Stack spacing={1}>
                                                            {plan.features.map((feature: string, fi: number) => (
                                                                <Stack
                                                                    key={`${plan.name}-${fi}-${feature.slice(0, 48)}`}
                                                                    direction="row"
                                                                    spacing={1.25}
                                                                    alignItems="flex-start"
                                                                >
                                                                    <CheckCircleRoundedIcon
                                                                        sx={{
                                                                            fontSize: 20,
                                                                            color: '#22C55E',
                                                                            opacity: featured ? 1 : 0.85,
                                                                            mt: 0.15,
                                                                            flexShrink: 0,
                                                                        }}
                                                                    />
                                                                    <Typography
                                                                        sx={{
                                                                            color: featured
                                                                                ? isDark
                                                                                    ? '#E2E8F0'
                                                                                    : '#334155'
                                                                                : 'text.secondary',
                                                                            fontSize: TYPO.bodySmall,
                                                                            lineHeight: 1.5,
                                                                            wordBreak: 'break-word',
                                                                        }}
                                                                    >
                                                                        {feature}
                                                                    </Typography>
                                                                </Stack>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                    <Box
                                                        aria-hidden
                                                        sx={{
                                                            pointerEvents: 'none',
                                                            position: 'absolute',
                                                            left: 0,
                                                            right: 12,
                                                            bottom: 0,
                                                            height: 36,
                                                            background: scrollFadeBg(featured),
                                                        }}
                                                    />
                                                </Box>

                                                <Box sx={{ flexShrink: 0, mt: 'auto', pt: 3 }}>
                                                    <Button
                                                        fullWidth
                                                        size="large"
                                                        variant={featured ? 'contained' : 'outlined'}
                                                        onClick={onCta}
                                                        sx={{
                                                            borderRadius: '999px',
                                                            textTransform: 'none',
                                                            fontWeight: 700,
                                                            fontSize: TYPO.bodySmall,
                                                            py: 1.15,
                                                            ...(featured
                                                                ? {
                                                                      background: 'linear-gradient(135deg,#5B6CFF,#7C3AED)',
                                                                      boxShadow: '0 10px 28px rgba(91,108,255,0.35)',
                                                                      '&:hover': {
                                                                          background: 'linear-gradient(135deg,#4F46E5,#6D28D9)',
                                                                          boxShadow: '0 14px 32px rgba(91,108,255,0.42)',
                                                                      },
                                                                  }
                                                                : {
                                                                        borderColor: isDark ? 'rgba(148,163,184,0.45)' : 'rgba(148,163,184,0.65)',
                                                                        color: isDark ? '#E2E8F0' : '#334155',
                                                                        '&:hover': {
                                                                            borderColor: '#6366F1',
                                                                            bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
                                                                        },
                                                                  }),
                                                        }}
                                                    >
                                                        {ctaLabelFn(plan)}
                                                    </Button>
                                                </Box>
                                            </Card>
                                            </Box>
                                        </Reveal>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                </Box>
            </LandingContainer>
        </LandingSection>
    );
};

export default Pricing;
