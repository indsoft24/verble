import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert, alpha } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DashboardAgendaBand from './DashboardAgendaBand';
import DashboardAgendaTile from './DashboardAgendaTile';

export const TIER_COLORS = {
    FREE: '#14b8a6',
    BRONZE: '#ea580c',
    SILVER: '#3b82f6',
    GOLD: '#ca8a04',
    FULL_COURSE: '#7c3aed',
} as const;

export interface ActivityTileConfig {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    accentColor: string;
    emptyToday?: boolean;
    onOpen?: () => void;
}

export interface DashboardActivitiesPanelProps {
    isBronzeUp: boolean;
    isSilverUp: boolean;
    isGoldOrFull: boolean;
    tierHasFullCourse: boolean;
    freeTiles: ActivityTileConfig[];
    bronzeTiles: ActivityTileConfig[];
    silverTiles: ActivityTileConfig[];
    goldTopTiles: ActivityTileConfig[];
    goldBottomTiles: ActivityTileConfig[];
    fullCourseHero: {
        modulesTitle: string;
        modulesSubtitle: string;
        accessTitle: string;
        accessSubtitle: string;
    };
    fullCourseBenefits: ActivityTileConfig[];
    onLockedTier: (tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'FULL_COURSE') => void;
    isLoading?: boolean;
    error?: string | null;
}

const sectionHeadingSx = {
    fontWeight: 900,
    mb: 2,
    color: '#0f172a',
    letterSpacing: -0.5,
};

const premiumHeadingSx = {
    ...sectionHeadingSx,
    mt: 4,
    color: alpha('#ca8a04', 0.95),
};

const DashboardActivitiesPanel: React.FC<DashboardActivitiesPanelProps> = ({
    isBronzeUp,
    isSilverUp,
    isGoldOrFull,
    tierHasFullCourse,
    freeTiles,
    bronzeTiles,
    silverTiles,
    goldTopTiles,
    goldBottomTiles,
    fullCourseHero,
    fullCourseBenefits,
    onLockedTier,
    isLoading = false,
    error = null,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const lockMsg = t('dashboard.agenda.completeChallengeToUnlock');

    const renderTiles = (
        tiles: ActivityTileConfig[],
        sectionLocked: boolean,
        onSectionLocked?: () => void
    ) =>
        tiles.map((tile) => (
            <DashboardAgendaTile
                key={tile.id}
                title={tile.title}
                subtitle={tile.subtitle}
                icon={tile.icon}
                accentColor={tile.accentColor}
                sectionLocked={sectionLocked}
                emptyToday={tile.emptyToday}
                onClick={sectionLocked ? onSectionLocked : tile.onOpen}
            />
        ));

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>;
    }

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h5" component="h2" sx={sectionHeadingSx}>
                {t('dashboard.todaysActivities')}
            </Typography>

            <DashboardAgendaBand
                headerLabel={t('dashboard.agenda.freeHeader')}
                borderColor={TIER_COLORS.FREE}
                locked={false}
            >
                {renderTiles(freeTiles, false)}
            </DashboardAgendaBand>

            <DashboardAgendaBand
                headerLabel={t('dashboard.agenda.bronzeHeader')}
                borderColor={TIER_COLORS.BRONZE}
                locked={!isBronzeUp}
                lockMessage={lockMsg}
                onLockedSectionClick={() => onLockedTier('BRONZE')}
            >
                {renderTiles(bronzeTiles, !isBronzeUp, () => onLockedTier('BRONZE'))}
            </DashboardAgendaBand>

            <DashboardAgendaBand
                headerLabel={t('dashboard.agenda.silverHeader')}
                borderColor={TIER_COLORS.SILVER}
                locked={!isSilverUp}
                lockMessage={lockMsg}
                onLockedSectionClick={() => onLockedTier('SILVER')}
            >
                {renderTiles(silverTiles, !isSilverUp, () => onLockedTier('SILVER'))}
            </DashboardAgendaBand>

            <Typography variant="h5" component="h2" sx={premiumHeadingSx}>
                {t('dashboard.premiumContent')}
            </Typography>

            <DashboardAgendaBand
                headerLabel={t('dashboard.agenda.goldHeader')}
                borderColor={TIER_COLORS.GOLD}
                locked={!isGoldOrFull}
                lockMessage={lockMsg}
                onLockedSectionClick={() => onLockedTier('GOLD')}
                ribbon={t('dashboard.agenda.proRibbon') as 'PRO'}
            >
                <Box
                    sx={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                        gap: 1.5,
                    }}
                >
                    {goldTopTiles.map((tile) => (
                        <DashboardAgendaTile
                            key={tile.id}
                            title={tile.title}
                            subtitle={tile.subtitle}
                            icon={tile.icon}
                            accentColor={tile.accentColor}
                            sectionLocked={!isGoldOrFull}
                            emptyToday={tile.emptyToday}
                            onClick={!isGoldOrFull ? () => onLockedTier('GOLD') : tile.onOpen}
                        />
                    ))}
                </Box>
                <Box
                    sx={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 1.5,
                        mt: 0,
                    }}
                >
                    {goldBottomTiles.map((tile) => (
                        <DashboardAgendaTile
                            key={tile.id}
                            title={tile.title}
                            subtitle={tile.subtitle}
                            icon={tile.icon}
                            accentColor={tile.accentColor}
                            sectionLocked={!isGoldOrFull}
                            emptyToday={tile.emptyToday}
                            onClick={!isGoldOrFull ? () => onLockedTier('GOLD') : tile.onOpen}
                        />
                    ))}
                </Box>
            </DashboardAgendaBand>

            <DashboardAgendaBand
                headerLabel={t('dashboard.agenda.fullCourseHeader')}
                borderColor={TIER_COLORS.FULL_COURSE}
                locked={!tierHasFullCourse}
                lockMessage={lockMsg}
                onLockedSectionClick={() => onLockedTier('FULL_COURSE')}
                ribbon={t('dashboard.agenda.ultimateRibbon') as 'ULTIMATE'}
            >
                <Box
                    sx={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                        gap: 1.5,
                    }}
                >
                    <DashboardAgendaTile
                        variant="hero"
                        title={fullCourseHero.modulesTitle}
                        subtitle={fullCourseHero.modulesSubtitle}
                        icon={<AutoAwesomeIcon />}
                        accentColor={TIER_COLORS.FULL_COURSE}
                        sectionLocked={!tierHasFullCourse}
                        onClick={
                            tierHasFullCourse
                                ? () => navigate('/my-courses')
                                : () => onLockedTier('FULL_COURSE')
                        }
                    />
                    <DashboardAgendaTile
                        variant="hero"
                        title={fullCourseHero.accessTitle}
                        subtitle={fullCourseHero.accessSubtitle}
                        icon={<WorkspacePremiumIcon />}
                        accentColor={TIER_COLORS.FULL_COURSE}
                        sectionLocked={!tierHasFullCourse}
                        onClick={
                            tierHasFullCourse
                                ? () => navigate('/my-courses')
                                : () => onLockedTier('FULL_COURSE')
                        }
                    />
                </Box>
                <Box
                    sx={{
                        gridColumn: '1 / -1',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 1.5,
                    }}
                >
                    {fullCourseBenefits.map((tile) => (
                        <DashboardAgendaTile
                            key={tile.id}
                            title={tile.title}
                            subtitle={tile.subtitle}
                            icon={tile.icon}
                            accentColor={tile.accentColor}
                            sectionLocked={!tierHasFullCourse}
                            onClick={
                                tierHasFullCourse
                                    ? () => navigate('/my-courses')
                                    : () => onLockedTier('FULL_COURSE')
                            }
                        />
                    ))}
                </Box>
            </DashboardAgendaBand>
        </Box>
    );
};

export default DashboardActivitiesPanel;
