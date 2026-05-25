// src/components/layout/LanguageSwitcherModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Box, Typography, Button } from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';
import { setLanguageChoiceMade } from '../../i18n/config';
import type { SupportedLanguage } from '../../i18n/config';

/** Decorative chrome matching first-visit language modal (English labels). */
const FLOATING_TAGS: { label: string; top: string; left: string; rotate: number }[] = [
    { label: 'Word of the Day', top: '48%', left: '4%', rotate: -6 },
    { label: 'Voice Practice', top: '58%', left: '72%', rotate: 5 },
    { label: 'One Minute Read', top: '52%', left: '38%', rotate: -3 },
    { label: 'Starter Pack', top: '68%', left: '12%', rotate: 4 },
    { label: 'Bronze Access', top: '72%', left: '48%', rotate: -5 },
    { label: 'Silver Upgrade', top: '62%', left: '18%', rotate: 7 },
    { label: 'AI Learning Buddy', top: '76%', left: '62%', rotate: -4 },
    { label: 'Full Course • 200+ Videos', top: '84%', left: '22%', rotate: 2 },
];

const LanguageSwitcherModal: React.FC = () => {
    const { t } = useTranslation();
    const { language, setLanguage, isLanguageModalOpen, setLanguageModalOpen } = useLanguage();

    const handleClose = () => {
        setLanguageChoiceMade();
        setLanguageModalOpen(false);
    };

    return (
        <Dialog
            open={isLanguageModalOpen}
            onClose={handleClose}
            disableScrollLock={false}
            slotProps={{
                backdrop: {
                    sx: {
                        bgcolor: 'rgba(2, 6, 23, 0.72)',
                        backdropFilter: 'blur(6px)',
                    },
                },
            }}
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    maxWidth: 460,
                    width: 'min(92vw, 460px)',
                    overflow: 'hidden',
                    boxShadow: '0 25px 80px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(148,163,184,0.12)',
                    background: 'linear-gradient(165deg, #070b18 0%, #0f172a 38%, #1e3a5f 100%)',
                    color: '#fff',
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    px: { xs: 3, sm: 4 },
                    pt: { xs: 4, sm: 5 },
                    pb: { xs: 3, sm: 3.5 },
                    minHeight: { xs: 420, sm: 460 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {/* Floating feature pills — background layer */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        opacity: 0.38,
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
                                px: 1.25,
                                py: 0.5,
                                borderRadius: '999px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                color: 'rgba(255,255,255,0.95)',
                                border: '1px solid rgba(255,255,255,0.22)',
                                bgcolor: 'rgba(255,255,255,0.06)',
                                whiteSpace: 'nowrap',
                                maxWidth: '90%',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                            }}
                        >
                            {tag.label}
                        </Box>
                    ))}
                </Box>

                <Box sx={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'center' }}>
                    <Typography
                        component="h2"
                        sx={{
                            fontWeight: 900,
                            fontSize: { xs: '2.25rem', sm: '2.65rem' },
                            letterSpacing: '0.12em',
                            lineHeight: 1.05,
                            mb: 1,
                            textTransform: 'uppercase',
                            textShadow: '0 2px 24px rgba(99, 102, 241, 0.35)',
                        }}
                    >
                        {t('languageModal.title')}
                    </Typography>
                    <Typography
                        sx={{
                            color: 'rgba(255,255,255,0.92)',
                            fontSize: { xs: '0.95rem', sm: '1rem' },
                            fontWeight: 500,
                            mb: { xs: 4, sm: 5 },
                            px: 1,
                            lineHeight: 1.45,
                        }}
                    >
                        {t('languageModal.subtitle')}
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            mb: { xs: 4, sm: 5 },
                        }}
                    >
                        <Button
                            variant={language === 'en' ? 'contained' : 'outlined'}
                            onClick={() => setLanguage('en')}
                            sx={{
                                minWidth: 148,
                                py: 1.75,
                                px: 3,
                                borderRadius: '14px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                textTransform: 'none',
                                ...(language === 'en'
                                    ? {
                                          bgcolor: '#fff',
                                          color: '#0f172a',
                                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                          '&:hover': { bgcolor: 'rgba(255,255,255,0.94)' },
                                      }
                                    : {
                                          borderColor: 'rgba(255,255,255,0.75)',
                                          borderWidth: 1.5,
                                          color: '#fff',
                                          bgcolor: 'transparent',
                                          '&:hover': {
                                              borderColor: '#fff',
                                              bgcolor: 'rgba(255,255,255,0.08)',
                                          },
                                      }),
                            }}
                        >
                            {t('common.english')}
                        </Button>
                        <Button
                            variant={language === 'hi' ? 'contained' : 'outlined'}
                            onClick={() => setLanguage('hi' as SupportedLanguage)}
                            sx={{
                                minWidth: 148,
                                py: 1.75,
                                px: 3,
                                borderRadius: '14px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                textTransform: 'none',
                                ...(language === 'hi'
                                    ? {
                                          bgcolor: '#fff',
                                          color: '#0f172a',
                                          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                          '&:hover': { bgcolor: 'rgba(255,255,255,0.94)' },
                                      }
                                    : {
                                          borderColor: 'rgba(255,255,255,0.75)',
                                          borderWidth: 1.5,
                                          color: '#fff',
                                          bgcolor: 'transparent',
                                          '&:hover': {
                                              borderColor: '#fff',
                                              bgcolor: 'rgba(255,255,255,0.08)',
                                          },
                                      }),
                            }}
                        >
                            {t('common.hindi')}
                        </Button>
                    </Box>

                    <Typography
                        sx={{
                            color: 'rgba(255,255,255,0.88)',
                            fontStyle: 'italic',
                            fontSize: { xs: '0.82rem', sm: '0.9rem' },
                            fontWeight: 500,
                            lineHeight: 1.5,
                            maxWidth: 340,
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
