import React from 'react';
import {
    Box,
    Button,
    alpha,
    useMediaQuery,
    useTheme,
    type SxProps,
    type Theme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
    activityNavCenterButtonSx,
    activityNavSideButtonSx,
} from '../../utils/dailyActivityUi';

export interface NavFooterSlot {
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
}

export type ActivityTierNavFooterLayout = 'inline' | 'stacked' | 'auto';

export interface ActivityTierNavFooterProps {
    accentColor: string;
    variant?: 'dark' | 'light';
    /**
     * `auto` (default): stacked on narrow screens when center + side nav exist;
     * grid inline on wider screens. `stacked` / `inline` force that layout.
     */
    layout?: ActivityTierNavFooterLayout;
    left?: NavFooterSlot;
    center?: NavFooterSlot;
    right?: NavFooterSlot;
    sx?: SxProps<Theme>;
}

const shellBorderSx = (borderColor: string) => ({
    mt: 3,
    pt: 2,
    borderTop: `1px solid ${borderColor}`,
});

/**
 * Bottom navigation: prev (left) · peer link (center, outlined) · next (right).
 */
const ActivityTierNavFooter: React.FC<ActivityTierNavFooterProps> = ({
    accentColor,
    variant = 'dark',
    layout = 'auto',
    left,
    center,
    right,
    sx,
}) => {
    const muiTheme = useTheme();
    const isNarrow = useMediaQuery(muiTheme.breakpoints.down('sm'));

    const showLeft = Boolean(left?.label);
    const showCenter = Boolean(center?.onClick);
    const showRight = Boolean(right?.label);
    if (!showLeft && !showCenter && !showRight) return null;

    const isDark = variant === 'dark';
    const borderColor = alpha(accentColor, isDark ? 0.25 : 0.35);

    const useStacked =
        layout === 'stacked' ||
        (layout === 'auto' && isNarrow && showCenter && (showLeft || showRight));

    const renderSide = (slot: NavFooterSlot | undefined, side: 'left' | 'right') => {
        if (!slot?.label) {
            if (useStacked) {
                return <Box sx={{ flex: '1 1 0', minWidth: 0 }} />;
            }
            return null;
        }
        const icon = side === 'left' ? <ArrowBackIcon fontSize="small" /> : <ArrowForwardIcon fontSize="small" />;
        const clickable = Boolean(slot.onClick) && !slot.disabled && !slot.loading;

        return (
            <Button
                variant="text"
                startIcon={side === 'left' ? icon : undefined}
                endIcon={side === 'right' ? icon : undefined}
                onClick={clickable ? slot.onClick : undefined}
                aria-disabled={!clickable}
                tabIndex={clickable ? 0 : -1}
                sx={activityNavSideButtonSx({
                    disabled: !clickable,
                    accentColor,
                    side,
                    inStackedRow: useStacked,
                    isDark,
                })}
            >
                {slot.loading ? 'Loading…' : slot.label}
            </Button>
        );
    };

    const centerClickable =
        showCenter && Boolean(center!.onClick) && !center!.disabled && !center!.loading;

    const centerButton = showCenter ? (
        <Button
            variant="outlined"
            size="medium"
            fullWidth={useStacked}
            onClick={centerClickable ? center!.onClick : undefined}
            aria-disabled={!centerClickable}
            tabIndex={centerClickable ? 0 : -1}
            sx={activityNavCenterButtonSx({
                disabled: !centerClickable,
                accentColor,
                isDark,
                fullWidth: useStacked,
            })}
        >
            {center!.label}
        </Button>
    ) : null;

    if (useStacked) {
        return (
            <Box
                sx={[
                    shellBorderSx(borderColor),
                    {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        pt: 2.5,
                    },
                    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
                ]}
            >
                {centerButton}
                {(showLeft || showRight) && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            width: '100%',
                            minWidth: 0,
                        }}
                    >
                        {renderSide(left, 'left')}
                        {renderSide(right, 'right')}
                    </Box>
                )}
            </Box>
        );
    }

    const hasThreeColumns = showLeft && showCenter && showRight;

    if (hasThreeColumns) {
        return (
            <Box
                sx={[
                    shellBorderSx(borderColor),
                    {
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
                        alignItems: 'center',
                        columnGap: { xs: 1, sm: 1.5 },
                        rowGap: 1,
                        width: '100%',
                        minWidth: 0,
                    },
                    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
                ]}
            >
                <Box sx={{ minWidth: 0, justifySelf: 'start', width: '100%' }}>
                    {renderSide(left, 'left')}
                </Box>
                <Box sx={{ justifySelf: 'center', maxWidth: '100%' }}>{centerButton}</Box>
                <Box sx={{ minWidth: 0, justifySelf: 'end', width: '100%' }}>
                    {renderSide(right, 'right')}
                </Box>
            </Box>
        );
    }

    return (
        <Box
            sx={[
                shellBorderSx(borderColor),
                {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    width: '100%',
                    minWidth: 0,
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {renderSide(left, 'left') ?? <Box sx={{ flex: '1 1 0', minWidth: 0 }} />}
            {centerButton}
            {renderSide(right, 'right') ?? <Box sx={{ flex: '1 1 0', minWidth: 0 }} />}
        </Box>
    );
};

export default ActivityTierNavFooter;
