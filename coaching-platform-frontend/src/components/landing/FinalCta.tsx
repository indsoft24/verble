import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Reveal from './Reveal';
import LandingContainer from './LandingContainer';
import { SECTION_PADDING_Y, SECTION_PADDING_X, BUTTON_GAP, TYPO, SPACING } from '../../landing/designSystem';

type FinalCtaProps = {
    onPrimaryCta: () => void;
    onSecondaryCta: () => void;
};

const FinalCta: React.FC<FinalCtaProps> = ({ onPrimaryCta, onSecondaryCta }) => {
    const { t } = useTranslation();
    return (
    <Box
        component="section"
        sx={{
            py: { xs: SECTION_PADDING_Y.xs, sm: SECTION_PADDING_Y.sm, md: SECTION_PADDING_Y.md },
            px: SECTION_PADDING_X,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#020617',
        }}
    >
        <Box
            sx={{
                position: 'absolute',
                inset: 0,
                background:
                    'radial-gradient(circle at top, rgba(91,108,255,0.45), transparent 60%), radial-gradient(circle at bottom, rgba(143,107,255,0.35), transparent 60%)',
                opacity: 0.95,
                pointerEvents: 'none',
            }}
        />
        <LandingContainer maxWidth={720} sx={{ position: 'relative', zIndex: 1 }}>
            <Reveal>
                <Stack spacing={SPACING.lg} alignItems="center" textAlign="center">
                    <Typography
                        variant="overline"
                        sx={{
                            letterSpacing: '0.22em',
                            color: '#E5E7EB',
                            fontWeight: 600,
                            fontSize: TYPO.bodySmall,
                        }}
                    >
                        {t('landing.finalCtaOverline')}
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            fontSize: TYPO.sectionTitle,
                            letterSpacing: '-0.04em',
                            color: '#F9FAFB',
                        }}
                    >
                        {t('landing.finalCtaTitle')}
                    </Typography>
                    <Typography
                        sx={{
                            color: '#E5E7EB',
                            fontSize: TYPO.body,
                            lineHeight: TYPO.lineHeightBody,
                            maxWidth: 520,
                        }}
                    >
                        {t('landing.finalCtaBody')}
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={BUTTON_GAP}
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        <Button
                            size="large"
                            variant="contained"
                            endIcon={<ArrowForwardIcon />}
                            onClick={onPrimaryCta}
                            fullWidth={false}
                            sx={{
                                borderRadius: '999px',
                                px: 5,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: TYPO.body,
                                background: 'linear-gradient(135deg,#FFFFFF,#E5E7EB)',
                                color: '#020617',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': {
                                    background: 'linear-gradient(135deg,#E5E7EB,#D1D5DB)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t('landing.finalCtaPrimary')}
                        </Button>
                        <Button
                            size="large"
                            variant="outlined"
                            onClick={onSecondaryCta}
                            fullWidth={false}
                            sx={{
                                borderRadius: '999px',
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: TYPO.body,
                                borderColor: 'rgba(248,250,252,0.6)',
                                color: '#F9FAFB',
                                width: { xs: '100%', sm: 'auto' },
                                '&:hover': {
                                    borderColor: '#F9FAFB',
                                    background: 'rgba(15,23,42,0.5)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {t('landing.finalCtaSecondary')}
                        </Button>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#E5E7EB', fontSize: TYPO.bodySmall }}>
                        {t('landing.finalCtaCaption')}
                    </Typography>
                </Stack>
            </Reveal>
        </LandingContainer>
    </Box>
    );
};

export default FinalCta;
