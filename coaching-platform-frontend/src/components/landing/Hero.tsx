import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Reveal from './Reveal';
import LandingContainer from './LandingContainer';
import {
    HERO_PADDING_Y,
    HERO_COLUMN_GAP,
    BUTTON_GAP,
    TYPO,
    SPACING,
    CARD_BORDER_RADIUS,
} from '../../landing/designSystem';

export type HeroCardItem = {
    label: string;
    icon: typeof PeopleAltIcon;
};

type HeroProps = {
    onPrimaryCta: () => void;
    onSecondaryCta: () => void;
    typingText: string;
    cursorVisible: boolean;
    heroPrompt: string;
    heroCards: HeroCardItem[];
};

const Hero: React.FC<HeroProps> = ({
    onPrimaryCta,
    onSecondaryCta,
    typingText,
    cursorVisible,
    heroPrompt,
    heroCards,
}) => {
    const { t } = useTranslation();
    return (
    <Box
        component="section"
        sx={{
            position: 'relative',
            py: { xs: SPACING.section, md: HERO_PADDING_Y },
            px: SPACING.lg,
            background:
                'radial-gradient(circle at top, rgba(91,108,255,0.18), transparent 60%), linear-gradient(135deg,#020617,#0F172A)',
            overflow: 'hidden',
        }}
    >
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0.45,
                background:
                    'radial-gradient(circle at 10% 20%, rgba(91,108,255,0.35) 0, transparent 50%), radial-gradient(circle at 90% 80%, rgba(143,107,255,0.28) 0, transparent 55%)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
            }}
        />
        <LandingContainer sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={{ xs: SPACING.xxl, md: HERO_COLUMN_GAP }} alignItems="center">
                <Grid size={{ xs: 12, md: 6 }}>
                    <Reveal>
                        <Stack spacing={SPACING.lg}>
                            <Chip
                                label={t('landing.heroChip')}
                                sx={{
                                    alignSelf: { xs: 'center', md: 'flex-start' },
                                    borderRadius: '999px',
                                    px: SPACING.md,
                                    py: 0.5,
                                    fontSize: TYPO.bodySmall,
                                    fontWeight: 600,
                                    bgcolor: 'rgba(15,23,42,0.7)',
                                    color: '#E5E7EB',
                                    border: '1px solid rgba(148,163,184,0.5)',
                                    backdropFilter: 'blur(14px)',
                                }}
                            />
                            <Typography
                                variant="h1"
                                sx={{
                                    fontWeight: 800,
                                    fontSize: { xs: '2.25rem', sm: '2.6rem', md: '3.1rem' },
                                    lineHeight: { xs: 1.12, md: 1.08 },
                                    letterSpacing: '-0.04em',
                                    background: 'linear-gradient(to right,#F9FAFB,#E5E7EB)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textAlign: { xs: 'left', md: 'left' },
                                    maxWidth: 560,
                                }}
                            >
                                {t('landing.heroTitle')}
                            </Typography>
                            <Box
                                component="ul"
                                sx={{
                                    m: 0,
                                    pl: { xs: 2.5, md: 3 },
                                    color: '#9CA3AF',
                                    maxWidth: 560,
                                    display: 'grid',
                                    rowGap: SPACING.sm,
                                    mx: { xs: 'auto', md: 0 },
                                    textAlign: 'left',
                                }}
                            >
                                {[
                                    t('landing.heroPoint1'),
                                    t('landing.heroPoint2'),
                                    t('landing.heroPoint3'),
                                    t('landing.heroPoint4'),
                                ].map((point) => (
                                    <Box
                                        component="li"
                                        key={point}
                                        sx={{
                                            pl: 0.25,
                                            '&::marker': {
                                                color: '#8F6BFF',
                                                fontSize: '0.95rem',
                                            },
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                color: '#9CA3AF',
                                                fontWeight: 400,
                                                fontSize: { xs: '1.05rem', md: TYPO.subtitle },
                                                lineHeight: 1.45,
                                                textAlign: 'left',
                                            }}
                                        >
                                            {point}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={BUTTON_GAP}
                                sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}
                            >
                                <Button
                                    onClick={onPrimaryCta}
                                    size="large"
                                    variant="contained"
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{
                                        borderRadius: '999px',
                                        px: SPACING.xl,
                                        py: 1.5,
                                        fontWeight: 700,
                                        fontSize: TYPO.body,
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg,#5B6CFF,#8F6BFF)',
                                        boxShadow:
                                            '0 18px 40px rgba(91,108,255,0.45), 0 0 0 1px rgba(148,163,184,0.2)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                                            transform: 'translateY(-2px)',
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {t('landing.tryVerbleFree')}
                                </Button>
                                <Button
                                    onClick={onSecondaryCta}
                                    size="large"
                                    variant="outlined"
                                    startIcon={<PlayArrowIcon sx={{ fontSize: 20 }} />}
                                    sx={{
                                        borderRadius: '999px',
                                        px: SPACING.lg,
                                        py: 1.25,
                                        fontWeight: 600,
                                        fontSize: TYPO.body,
                                        textTransform: 'none',
                                        borderColor: 'rgba(148,163,184,0.5)',
                                        color: '#E5E7EB',
                                        background: 'rgba(15,23,42,0.6)',
                                        backdropFilter: 'blur(16px)',
                                        '&:hover': {
                                            borderColor: '#E5E7EB',
                                            background: 'rgba(15,23,42,0.9)',
                                            transform: 'translateY(-2px)',
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {t('landing.watchDemo')}
                                </Button>
                            </Stack>
                            <Stack
                                direction="row"
                                spacing={SPACING.lg}
                                sx={{
                                    justifyContent: { xs: 'center', md: 'flex-start' },
                                    color: '#9CA3AF',
                                    fontSize: TYPO.bodySmall,
                                }}
                            >
                                <Stack spacing={0.5}>
                                    <Typography sx={{ fontWeight: 700, color: '#E5E7EB' }}>12k+</Typography>
                                    <Typography variant="caption">{t('landing.speechesCrafted')}</Typography>
                                </Stack>
                                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(148,163,184,0.3)' }} />
                                <Stack spacing={0.5}>
                                    <Typography sx={{ fontWeight: 700, color: '#E5E7EB' }}>4.9/5</Typography>
                                    <Typography variant="caption">{t('landing.averageRating')}</Typography>
                                </Stack>
                                <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(148,163,184,0.3)' }} />
                                <Stack spacing={0.5}>
                                    <Typography sx={{ fontWeight: 700, color: '#E5E7EB' }}>90 sec</Typography>
                                    <Typography variant="caption">{t('landing.toFirstDraft')}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                    </Reveal>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Reveal delay={150}>
                        <Box sx={{ position: 'relative', maxWidth: 540, ml: { xs: 'auto', md: 0 }, mr: { xs: 'auto', md: 0 } }}>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg,rgba(91,108,255,0.6),rgba(143,107,255,0.2))',
                                    opacity: 0.55,
                                    filter: 'blur(26px)',
                                }}
                            />
                            <Box
                                sx={{
                                    position: 'relative',
                                    borderRadius: CARD_BORDER_RADIUS,
                                    p: SPACING.lg,
                                    bgcolor: 'rgba(15,23,42,0.96)',
                                    border: '1px solid rgba(148,163,184,0.5)',
                                    boxShadow: '0 24px 80px rgba(15,23,42,0.8), 0 0 0 1px rgba(15,23,42,0.9)',
                                    backdropFilter: 'blur(18px)',
                                }}
                            >
                                {/* Header: Verble Assistant + Live draft */}
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{ mb: SPACING.lg }}
                                >
                                    <Stack direction="row" spacing={SPACING.md} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                bgcolor: 'rgba(91,108,255,0.2)',
                                                color: '#E5E7EB',
                                                fontSize: TYPO.bodySmall,
                                                fontWeight: 600,
                                            }}
                                        >
                                            AI
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: '#E5E7EB',
                                                    fontWeight: 600,
                                                    fontSize: TYPO.body,
                                                    lineHeight: 1.25,
                                                }}
                                            >
                                                {t('landing.verbleAssistant')}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{ color: '#9CA3AF', fontSize: TYPO.bodySmall, display: 'block' }}
                                            >
                                                {t('landing.craftingKeynoteOutline')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Chip
                                        size="small"
                                        icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                                        label={t('landing.liveDraft')}
                                        sx={{
                                            borderRadius: '999px',
                                            py: 0.5,
                                            px: 1.5,
                                            bgcolor: 'rgba(22,163,74,0.08)',
                                            color: '#BBF7D0',
                                            border: '1px solid rgba(34,197,94,0.4)',
                                            fontSize: TYPO.bodySmall,
                                            '& .MuiChip-icon': { color: '#22C55E' },
                                        }}
                                    />
                                </Stack>

                                {/* Your prompt */}
                                <Box
                                    sx={{
                                        borderRadius: CARD_BORDER_RADIUS,
                                        p: SPACING.md,
                                        mb: SPACING.lg,
                                        bgcolor: 'rgba(15,23,42,0.9)',
                                        border: '1px solid rgba(55,65,81,0.9)',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#6B7280',
                                            mb: SPACING.xs,
                                            display: 'block',
                                            fontSize: TYPO.bodySmall,
                                        }}
                                    >
                                        {t('landing.yourPrompt')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#E5E7EB',
                                            fontSize: TYPO.body,
                                            lineHeight: TYPO.lineHeightBody,
                                        }}
                                    >
                                        {heroPrompt}
                                    </Typography>
                                </Box>

                                {/* Parameter chips */}
                                <Grid container spacing={SPACING.sm} sx={{ mb: SPACING.lg }}>
                                    {heroCards.map((card) => (
                                        <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
                                            <Box
                                                sx={{
                                                    borderRadius: CARD_BORDER_RADIUS,
                                                    p: SPACING.md,
                                                    bgcolor: 'rgba(15,23,42,0.9)',
                                                    border: '1px solid rgba(55,65,81,0.9)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: SPACING.sm,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '999px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'rgba(91,108,255,0.16)',
                                                        color: '#C7D2FE',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <card.icon sx={{ fontSize: 18 }} />
                                                </Box>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: '#9CA3AF',
                                                        fontSize: TYPO.bodySmall,
                                                        lineHeight: 1.25,
                                                    }}
                                                >
                                                    {card.label}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* AI generated speech */}
                                <Box
                                    sx={{
                                        borderRadius: CARD_BORDER_RADIUS,
                                        p: SPACING.lg,
                                        bgcolor: 'rgba(15,23,42,0.92)',
                                        border: '1px solid rgba(55,65,81,0.9)',
                                        minHeight: 160,
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#6B7280',
                                            mb: SPACING.xs,
                                            display: 'block',
                                            fontSize: TYPO.bodySmall,
                                        }}
                                    >
                                        {t('landing.aiGeneratedSpeech')}
                                    </Typography>
                                    <Typography
                                        component="pre"
                                        sx={{
                                            fontFamily: 'inherit',
                                            whiteSpace: 'pre-wrap',
                                            color: '#E5E7EB',
                                            fontSize: TYPO.body,
                                            lineHeight: TYPO.lineHeightBody,
                                            m: 0,
                                        }}
                                    >
                                        {typingText}
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                width: 2,
                                                height: 18,
                                                ml: 0.25,
                                                bgcolor: cursorVisible ? '#E5E7EB' : 'transparent',
                                                borderRadius: 0.5,
                                                transition: 'background 0.2s ease',
                                                verticalAlign: 'text-bottom',
                                            }}
                                        />
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Delivery coach tooltip */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: -24,
                                    left: -16,
                                    width: 180,
                                    borderRadius: CARD_BORDER_RADIUS,
                                    p: SPACING.md,
                                    bgcolor: 'rgba(15,23,42,0.98)',
                                    border: '1px solid rgba(148,163,184,0.6)',
                                    boxShadow: '0 18px 40px rgba(15,23,42,0.9)',
                                    display: { xs: 'none', md: 'flex' },
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: SPACING.sm,
                                }}
                            >
                                <MicIcon sx={{ fontSize: 24, color: '#93C5FD', flexShrink: 0 }} />
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#9CA3AF',
                                            fontSize: TYPO.bodySmall,
                                            fontWeight: 600,
                                            display: 'block',
                                            mb: 0.25,
                                        }}
                                    >
                                        Delivery coach
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#E5E7EB',
                                            fontSize: TYPO.bodySmall,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        Practice your speech line by line.
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Reveal>
                </Grid>
            </Grid>
        </LandingContainer>
    </Box>
    );
};

export default Hero;
