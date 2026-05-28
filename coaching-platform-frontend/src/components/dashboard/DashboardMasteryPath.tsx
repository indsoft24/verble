import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    Chip,
    alpha,
    CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { User } from '../../services/authService';
import {
    getChallengeTiers,
    getPremiumTiers,
    showPremiumSection,
    getStreakForDisplayLevel,
    getDisplayMembershipLevel,
    type MembershipTier,
    type TierAccessInfo,
} from '../../utils/userAccessState';

const TIER_META: Record<
    MembershipTier,
    { label: string; subtitle: string; primary: string; features: string[]; icon: React.ReactNode }
> = {
    FREE: {
        label: 'Free',
        subtitle: 'FOUNDATIONAL',
        primary: '#10b981',
        features: ['Word & phrase of the day', 'Pronunciation guides'],
        icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    },
    BRONZE: {
        label: 'Bronze',
        subtitle: '60-DAY CHALLENGE',
        primary: '#f59e0b',
        features: ['One-minute reads', 'Weekly vocab', 'Conversation starters'],
        icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />,
    },
    SILVER: {
        label: 'Silver',
        subtitle: '90-DAY CHALLENGE',
        primary: '#3b82f6',
        features: ['Business English', 'Interview prep', 'Daily puzzles'],
        icon: <StarIcon sx={{ fontSize: 40 }} />,
    },
    GOLD: {
        label: 'Gold',
        subtitle: 'ADVANCED CONTENT',
        primary: '#ca8a04',
        features: ['Expert practice modules', 'Scenes & speeches', 'Professional dialogues'],
        icon: <WorkspacePremiumIcon sx={{ fontSize: 40 }} />,
    },
    FULL_COURSE: {
        label: 'Full Course',
        subtitle: 'MASTER CLASS',
        primary: '#7c3aed',
        features: ['All structured modules', 'Group classes', 'Expert feedback', 'Certification'],
        icon: <AutoAwesomeIcon sx={{ fontSize: 40 }} />,
    },
};

interface DashboardMasteryPathProps {
    user: User;
    onLockedTierClick: (tier: MembershipTier) => void;
}

/**
 * theme.spacing is an array (see theme.ts) — fractional keys like 2.5 resolve to
 * nothing, so padding was 0 and text touched the border. Use integers or px strings.
 */
const CARD_INNER_PADDING = { px: 3, py: 3 };
const FEATURE_PANEL_SX = {
    mt: 2,
    px: 2,
    py: 2,
    borderRadius: 2,
    bgcolor: alpha('#000', 0.25),
};
const FEATURE_LINE_SX = {
    display: 'block',
    color: alpha('#fff', 0.75),
    mb: 1,
    pl: 1,
    pr: 1,
    lineHeight: 1.5,
    '&:last-of-type': { mb: 0 },
};

const ChallengeCard: React.FC<{
    access: TierAccessInfo;
    meta: (typeof TIER_META)[MembershipTier];
    onLockedClick: () => void;
    isYouAreHere: boolean;
    t: (key: string, opts?: Record<string, unknown>) => string;
}> = ({ access, meta, onLockedClick, isYouAreHere, t }) => {
    const locked = access.status === 'locked';
    const completed = access.status === 'completed';
    const active = access.status === 'active';

    return (
        <Box
            role={locked ? 'button' : undefined}
            tabIndex={locked ? 0 : undefined}
            onClick={locked ? onLockedClick : undefined}
            onKeyDown={(e) => {
                if (locked && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onLockedClick();
                }
            }}
            sx={{
                flex: { xs: '1 1 100%', sm: '1 1 200px' },
                minWidth: { xs: 0, sm: 180 },
                maxWidth: { xs: '100%', sm: 320 },
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 3,
                border: '2px solid',
                borderColor: locked ? alpha(meta.primary, 0.35) : meta.primary,
                bgcolor: locked ? alpha('#0f172a', 0.5) : alpha(meta.primary, 0.12),
                ...CARD_INNER_PADDING,
                position: 'relative',
                cursor: locked ? 'pointer' : 'default',
                overflow: 'hidden',
                opacity: locked ? 0.75 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': locked ? { transform: 'translateY(-2px)', boxShadow: 4 } : {},
            }}
        >
            {isYouAreHere && active && (
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        top: { xs: 12, sm: 16 },
                        right: { xs: 12, sm: 16 },
                        color: meta.primary,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    }}
                >
                    {t('dashboard.masteryPath.youAreHere')}
                </Typography>
            )}

            <Typography
                variant="caption"
                sx={{
                    color: alpha('#fff', 0.65),
                    fontWeight: 600,
                    letterSpacing: 1,
                    display: 'block',
                    pr: isYouAreHere && active ? 7 : 0,
                }}
            >
                {meta.label.toUpperCase()} — {meta.subtitle}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2, px: 1, color: meta.primary }}>
                {locked ? (
                    <Box sx={{ position: 'relative' }}>
                        {meta.icon}
                        <LockIcon
                            sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -8,
                                fontSize: 28,
                                color: '#94a3b8',
                            }}
                        />
                    </Box>
                ) : completed ? (
                    <CheckCircleIcon sx={{ fontSize: 56, color: meta.primary }} />
                ) : (
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                            variant="determinate"
                            value={access.progress}
                            size={72}
                            thickness={4}
                            sx={{ color: meta.primary }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                                {access.streak} / {access.target}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff', textAlign: 'center', px: 1 }}>
                {completed
                    ? t('dashboard.masteryPath.challengeComplete')
                    : active
                      ? t('dashboard.masteryPath.dayProgress', { current: access.streak, target: access.target })
                      : meta.label}
            </Typography>

            {active && (
                <Typography variant="body2" sx={{ textAlign: 'center', color: alpha('#fff', 0.7), mt: 1, px: 2 }}>
                    {t('dashboard.masteryPath.daysRemaining', { count: access.daysRemaining })}
                </Typography>
            )}

            <Box sx={FEATURE_PANEL_SX}>
                {meta.features.map((f) => (
                    <Typography key={f} variant="caption" sx={FEATURE_LINE_SX}>
                        • {f}
                    </Typography>
                ))}
            </Box>

            {locked && access.unlockHint && (
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        mt: 2,
                        px: 2,
                        textAlign: 'center',
                        color: alpha('#fff', 0.85),
                        fontWeight: 600,
                        lineHeight: 1.4,
                    }}
                >
                    {access.unlockHint}
                </Typography>
            )}
        </Box>
    );
};

const PremiumCard: React.FC<{
    access: TierAccessInfo;
    meta: (typeof TIER_META)[MembershipTier];
    onLockedClick: () => void;
    t: (key: string) => string;
}> = ({ access, meta, onLockedClick, t }) => {
    const locked = access.status === 'locked';

    return (
        <Box
            sx={{
                flex: { xs: '1 1 100%', sm: '1 1 240px' },
                minWidth: { xs: 0, sm: 220 },
                maxWidth: { xs: '100%', sm: 360 },
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 3,
                border: '2px solid',
                borderColor: alpha(meta.primary, locked ? 0.35 : 0.9),
                background: locked
                    ? `linear-gradient(145deg, ${alpha(meta.primary, 0.15)} 0%, ${alpha('#0f172a', 0.9)} 100%)`
                    : `linear-gradient(145deg, ${alpha(meta.primary, 0.35)} 0%, ${alpha('#1e1b4b', 0.95)} 100%)`,
                ...CARD_INNER_PADDING,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Typography
                variant="caption"
                sx={{ color: alpha('#fff', 0.65), fontWeight: 600, letterSpacing: 1, display: 'block' }}
            >
                {meta.label.toUpperCase()} — {meta.subtitle}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: meta.primary, mt: 1, mb: 2, px: 1 }}>
                {meta.label === 'Gold' ? t('dashboard.masteryPath.expertPractice') : t('dashboard.masteryPath.structuredLearning')}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, color: meta.primary, opacity: locked ? 0.6 : 1 }}>
                <Box sx={{ position: 'relative' }}>
                    {meta.icon}
                    {locked && (
                        <LockIcon sx={{ position: 'absolute', bottom: 0, right: -4, fontSize: 32, color: '#94a3b8' }} />
                    )}
                </Box>
            </Box>

            <Box sx={{ ...FEATURE_PANEL_SX, bgcolor: alpha('#000', 0.3), mb: 2 }}>
                {meta.features.map((f) => (
                    <Typography key={f} variant="caption" sx={{ ...FEATURE_LINE_SX, color: alpha('#fff', 0.8) }}>
                        • {f}
                    </Typography>
                ))}
            </Box>

            {locked ? (
                <Button
                    fullWidth
                    variant="contained"
                    onClick={onLockedClick}
                    component={RouterLink}
                    to="/subscription-plans"
                    sx={{
                        bgcolor: alpha('#fff', 0.15),
                        color: '#fff',
                        fontWeight: 700,
                        py: 2,
                        px: 2,
                        '&:hover': { bgcolor: alpha('#fff', 0.25) },
                    }}
                >
                    {t('dashboard.masteryPath.purchaseToUnlock')}
                </Button>
            ) : (
                <Chip label={t('dashboard.masteryPath.unlocked')} color="success" size="small" sx={{ fontWeight: 700 }} />
            )}
        </Box>
    );
};

const DashboardMasteryPath: React.FC<DashboardMasteryPathProps> = ({ user, onLockedTierClick }) => {
    const { t } = useTranslation();
    const challengeTiers = getChallengeTiers(user);
    const premiumTiers = getPremiumTiers(user);
    const displayLevel = getDisplayMembershipLevel(user);
    const streak = getStreakForDisplayLevel(user);
    const activeChallengeTier = challengeTiers.find((c) => c.status === 'active')?.tier;

    return (
        <Box
            sx={{
                mb: 4,
                borderRadius: 3,
                p: { xs: 2, sm: 3 },
                background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)',
                border: '1px solid',
                borderColor: alpha('#fff', 0.08),
                boxShadow: '0 8px 32px rgba(15, 23, 42, 0.4)',
            }}
        >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                    {t('dashboard.masteryPath.title')}
                </Typography>
                {streak > 0 && (
                    <Chip
                        icon={<LocalFireDepartmentIcon sx={{ color: '#fb923c !important' }} />}
                        label={t('dashboard.masteryPath.streakDays', { count: streak })}
                        sx={{
                            bgcolor: alpha('#fb923c', 0.15),
                            color: '#fdba74',
                            fontWeight: 700,
                            border: `1px solid ${alpha('#fb923c', 0.4)}`,
                        }}
                    />
                )}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'stretch',
                    justifyContent: 'center',
                }}
            >
                {challengeTiers.map((access, index) => (
                    <React.Fragment key={access.tier}>
                        {index > 0 && (
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', color: alpha('#fff', 0.35) }}>
                                <ArrowForwardIcon />
                            </Box>
                        )}
                        <ChallengeCard
                            access={access}
                            meta={TIER_META[access.tier]}
                            onLockedClick={() => onLockedTierClick(access.tier)}
                            isYouAreHere={activeChallengeTier === access.tier}
                            t={t}
                        />
                    </React.Fragment>
                ))}
            </Box>

            {showPremiumSection(user) && (
                <>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mt: 4, mb: 2 }}>
                        {t('dashboard.masteryPath.premiumTitle')}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                        {premiumTiers.map((access) => (
                            <PremiumCard
                                key={access.tier}
                                access={access}
                                meta={TIER_META[access.tier]}
                                onLockedClick={() => onLockedTierClick(access.tier)}
                                t={t}
                            />
                        ))}
                    </Box>
                </>
            )}

            <Typography variant="body2" sx={{ textAlign: 'center', color: alpha('#fff', 0.55), mt: 3, px: 2 }}>
                {t('dashboard.masteryPath.currentLevel', { level: displayLevel.replace('_', ' ') })}
            </Typography>
        </Box>
    );
};

export default DashboardMasteryPath;
