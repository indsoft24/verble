// src/components/layout/LanguageSwitcherModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLanguageChoiceMade, setLanguageChoiceMade } from '../../i18n/config';
import type { SupportedLanguage } from '../../i18n/config';
import { brandAssets } from '../../assets/brandAssets';

/** Decorative feature pills (background layer). */
const FLOATING_TAGS: { label: string; top: string; left: string; rotate: number }[] = [
    { label: 'Word of the Day', top: '46%', left: '3%', rotate: -6 },
    { label: 'Phrase of the Day', top: '50%', left: '55%', rotate: 3 },
    { label: 'One Minute Read', top: '54%', left: '28%', rotate: -3 },
    { label: 'Voice Practice', top: '60%', left: '70%', rotate: 5 },
    { label: 'Bronze Access', top: '66%', left: '8%', rotate: 4 },
    { label: 'Silver Upgrade', top: '70%', left: '42%', rotate: -5 },
    { label: 'AI Learning Buddy', top: '74%', left: '58%', rotate: -4 },
    { label: 'Full Course • 200+ Videos', top: '80%', left: '18%', rotate: 2 },
];

const LanguageSwitcherModal: React.FC = () => {
    const { t } = useTranslation();
    const { language, setLanguage, isLanguageModalOpen, setLanguageModalOpen } = useLanguage();
    const handlePickLanguage = (lang: SupportedLanguage) => {
        setLanguage(lang);
        setLanguageChoiceMade();
    };

    const handleClose = () => {
        setLanguageChoiceMade();
        setLanguageModalOpen(false);
    };

    const handleDialogClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
        if (!getLanguageChoiceMade() && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            return;
        }
        handleClose();
    };

    return (
        <Dialog
            open={isLanguageModalOpen}
            onClose={handleDialogClose}
            disableEscapeKeyDown={!getLanguageChoiceMade()}
            disableScrollLock={false}
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: 'rgba(2, 6, 23, 0.78)',
                        backdropFilter: 'blur(8px)',
                    },
                },
            }}
            PaperProps={{
                sx: {
                    borderRadius: '22px',
                    maxWidth: 480,
                    width: 'min(92vw, 480px)',
                    overflow: 'hidden',
                    boxShadow:
                        '0 28px 90px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                    background:
                        'linear-gradient(168deg, #050a14 0%, #0c1628 32%, #132a4a 58%, #1a3d6b 100%)',
                    color: '#fff',
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    px: { xs: 3, sm: 4 },
                    pt: { xs: 3.5, sm: 4 },
                    pb: { xs: 3.5, sm: 4 },
                    minHeight: { xs: 440, sm: 480 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        opacity: 0.55,
                    }}
                >
                    {FLOATING_TAGS.map((tag) => (
                        <Box
                            key={tag.label}
                            sx={{
                                position: 'absolute',
                                top: tag.top,
                                left: tag.left,
                                transform: `rotate(${tag.rotate}deg)`,
                                px: 1.5,
                                py: 0.6,
                                borderRadius: '999px',
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                color: 'rgba(255,255,255,0.92)',
                                border: '1px solid rgba(255,255,255,0.28)',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            {tag.label}
                        </Box>
                    ))}
                </Box>

                <Box
                    sx={{
                        position: 'absolute',
                        top: -80,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 280,
                        height: 160,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'center' }}>
                    <Box
                        component="img"
                        src={brandAssets.primaryLogo}
                        alt="Verble"
                        sx={{
                            height: { xs: 52, sm: 60 },
                            width: 'auto',
                            objectFit: 'contain',
                            mb: 2,
                            filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))',
                        }}
                    />

                    <Typography
                        component="h2"
                        sx={{
                            fontWeight: 900,
                            fontSize: { xs: '2rem', sm: '2.35rem' },
                            letterSpacing: '0.14em',
                            lineHeight: 1.05,
                            mb: 0.75,
                            textTransform: 'uppercase',
                            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        {t('languageModal.title')}
                    </Typography>

                    <Typography
                        sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: { xs: '0.9rem', sm: '0.98rem' },
                            fontWeight: 500,
                            mb: 0.5,
                            letterSpacing: '0.02em',
                        }}
                    >
                        {t('languageModal.subtitle')}
                    </Typography>

                    <Box
                        sx={{
                            width: 48,
                            height: 3,
                            borderRadius: 2,
                            bgcolor: 'rgba(96, 165, 250, 0.85)',
                            mx: 'auto',
                            mb: { xs: 3, sm: 3.5 },
                        }}
                    />

                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            color: 'rgba(255,255,255,0.65)',
                            mb: 2,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                        }}
                    >
                        {t('languageModal.pickLanguage')}
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            mb: { xs: 3.5, sm: 4 },
                        }}
                    >
                        <Button
                            variant={language === 'en' ? 'contained' : 'outlined'}
                            onClick={() => handlePickLanguage('en')}
                            sx={{
                                minWidth: 152,
                                py: 1.85,
                                px: 3,
                                borderRadius: '999px',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                textTransform: 'none',
                                ...(language === 'en'
                                    ? {
                                          bgcolor: '#fff',
                                          color: '#0f172a',
                                          boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
                                          '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                                      }
                                    : {
                                          borderColor: 'rgba(255,255,255,0.8)',
                                          borderWidth: 2,
                                          color: '#fff',
                                          bgcolor: 'transparent',
                                          '&:hover': {
                                              borderColor: '#fff',
                                              bgcolor: 'rgba(255,255,255,0.1)',
                                          },
                                      }),
                            }}
                        >
                            {t('common.english')}
                        </Button>
                        <Button
                            variant={language === 'hi' ? 'contained' : 'outlined'}
                            onClick={() => handlePickLanguage('hi')}
                            sx={{
                                minWidth: 152,
                                py: 1.85,
                                px: 3,
                                borderRadius: '999px',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                textTransform: 'none',
                                ...(language === 'hi'
                                    ? {
                                          bgcolor: '#fff',
                                          color: '#0f172a',
                                          boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
                                          '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                                      }
                                    : {
                                          borderColor: 'rgba(255,255,255,0.8)',
                                          borderWidth: 2,
                                          color: '#fff',
                                          bgcolor: 'transparent',
                                          '&:hover': {
                                              borderColor: '#fff',
                                              bgcolor: 'rgba(255,255,255,0.1)',
                                          },
                                      }),
                            }}
                        >
                            {t('common.hindi')}
                        </Button>
                    </Box>

                    <Typography
                        sx={{
                            color: 'rgba(255,255,255,0.9)',
                            fontStyle: 'italic',
                            fontSize: { xs: '0.84rem', sm: '0.92rem' },
                            fontWeight: 500,
                            lineHeight: 1.55,
                            maxWidth: 360,
                            mx: 'auto',
                            px: 1,
                        }}
                    >
                        {t('languageModal.slogan')}
                    </Typography>
                </Box>
            </Box>
        </Dialog>
    );
};

export default LanguageSwitcherModal;
