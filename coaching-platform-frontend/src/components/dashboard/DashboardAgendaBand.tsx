import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import {
    AGENDA_BAND_PADDING,
    AGENDA_GAP,
    AGENDA_HEADER_PY,
    agendaGridColumns2,
    agendaGridColumns3,
} from './dashboardAgendaLayout';

export type AgendaTileColumns = 2 | 3;

export interface DashboardAgendaBandProps {
    headerLabel: string;
    borderColor: string;
    /** How many tiles per row on desktop (2 = Free/Bronze, 3 = Silver). */
    tileColumns?: AgendaTileColumns;
    locked?: boolean;
    lockMessage?: string;
    onLockedSectionClick?: () => void;
    ribbon?: string | null;
    children: React.ReactNode;
}

const DashboardAgendaBand: React.FC<DashboardAgendaBandProps> = ({
    headerLabel,
    borderColor,
    tileColumns = 2,
    locked = false,
    lockMessage = 'COMPLETE THE CHALLENGE TO UNLOCK',
    onLockedSectionClick,
    ribbon = null,
    children,
}) => {
    const gridColumns = tileColumns === 3 ? agendaGridColumns3 : agendaGridColumns2;

    return (
        <Box
            sx={{
                position: 'relative',
                mb: 3,
                borderRadius: 3,
                border: `2px solid ${alpha(borderColor, locked ? 0.35 : 0.85)}`,
                bgcolor: '#0d1117',
                overflow: 'hidden',
                boxShadow: `0 4px 24px ${alpha(borderColor, 0.12)}`,
            }}
        >
            {ribbon && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        right: -28,
                        zIndex: 3,
                        width: 100,
                        py: 1,
                        textAlign: 'center',
                        transform: 'rotate(45deg)',
                        bgcolor: borderColor,
                        color: '#0d1117',
                        fontWeight: 900,
                        fontSize: '0.65rem',
                        letterSpacing: 1,
                        boxShadow: `0 2px 8px ${alpha(borderColor, 0.4)}`,
                    }}
                >
                    {ribbon}
                </Box>
            )}

            <Box
                sx={{
                    px: AGENDA_BAND_PADDING,
                    py: AGENDA_HEADER_PY,
                    borderBottom: `1px solid ${alpha(borderColor, 0.25)}`,
                }}
            >
                <Typography
                    variant="overline"
                    sx={{
                        fontWeight: 800,
                        letterSpacing: 1.5,
                        color: borderColor,
                        fontSize: '0.7rem',
                        lineHeight: 1.4,
                    }}
                >
                    {headerLabel}
                </Typography>
            </Box>

            <Box sx={{ position: 'relative', p: AGENDA_BAND_PADDING }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: gridColumns,
                        gap: AGENDA_GAP,
                        alignItems: 'stretch',
                        width: '100%',
                        filter: locked ? 'grayscale(0.4) brightness(0.6)' : 'none',
                        pointerEvents: locked ? 'none' : 'auto',
                    }}
                >
                    {children}
                </Box>

                {locked && (
                    <Box
                        role="button"
                        tabIndex={0}
                        onClick={onLockedSectionClick}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && onLockedSectionClick) {
                                e.preventDefault();
                                onLockedSectionClick();
                            }
                        }}
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            bgcolor: alpha('#0f172a', 0.72),
                            cursor: 'pointer',
                            px: 2,
                            zIndex: 2,
                        }}
                    >
                        <LockIcon sx={{ fontSize: 36, color: alpha('#fff', 0.85) }} />
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: 1.2,
                                color: '#fff',
                                textAlign: 'center',
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                            }}
                        >
                            {lockMessage}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default DashboardAgendaBand;
