import { alpha, type SxProps, type Theme } from '@mui/material';

export const PUZZLE_ACCENT = '#ec4899';

/** Outer shell — full width on phones, capped on larger screens */
export const puzzleActivityShellSx: SxProps<Theme> = {
    width: '100%',
    maxWidth: { xs: '100%', sm: 720, md: 800 },
    mx: 'auto',
};

export const puzzleCardContentSx: SxProps<Theme> = {
    p: { xs: 2, sm: 3 },
    '&:last-child': { pb: { xs: 2, sm: 3 } },
};

export const puzzleTitleSx = (accent: string): SxProps<Theme> => ({
    fontWeight: 900,
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
    lineHeight: 1.2,
    background: `linear-gradient(135deg, #f8fafc, ${accent})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
});

export const puzzleSubtitleSx: SxProps<Theme> = {
    mt: 0.75,
    color: alpha('#e2e8f0', 0.72),
    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
    lineHeight: 1.45,
};

export const puzzleQuestionBlockSx = (accent: string): SxProps<Theme> => ({
    mb: { xs: 2.5, sm: 3 },
    p: '5px',
    borderRadius: '8px',
    bgcolor: alpha('#fff', 0.04),
    border: `1px solid ${alpha(accent, 0.22)}`,
});

export const puzzleQuestionLabelSx: SxProps<Theme> = {
    m: 0,
    p: '5px',
    fontWeight: 700,
    fontSize: { xs: '0.9375rem', sm: '1rem' },
    color: '#f8fafc',
    mb: 0.5,
};

export const puzzleQuestionPromptSx: SxProps<Theme> = {
    m: 0,
    p: '5px',
    fontWeight: 400,
    fontSize: { xs: '1rem', sm: '1.0625rem' },
    letterSpacing: '0.00938em',
    lineHeight: 1.55,
    color: alpha('#f8fafc', 0.94),
    width: '100%',
    wordBreak: 'break-word',
};

/** Spacing between option rows inside a question */
export const puzzleOptionsGroupSx: SxProps<Theme> = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: { xs: 1.25, sm: 1.5 },
    p: '5px',
    boxSizing: 'border-box',
};

export function puzzleOptionRowSx(options: {
    accent: string;
    selected: boolean;
    showResult?: boolean;
    isCorrect?: boolean;
    disabled?: boolean;
}): SxProps<Theme> {
    const { accent, selected, showResult, isCorrect, disabled } = options;
    let borderColor = alpha(accent, selected ? 0.55 : 0.22);
    let bgcolor = selected ? alpha(accent, 0.14) : alpha('#fff', 0.03);

    if (showResult) {
        if (isCorrect) {
            borderColor = alpha('#22c55e', 0.65);
            bgcolor = alpha('#22c55e', 0.18);
        } else {
            borderColor = alpha('#ef4444', 0.65);
            bgcolor = alpha('#ef4444', 0.14);
        }
    }

    return {
        alignItems: 'center',
        margin: 0,
        ml: 0,
        mr: 0,
        width: '100%',
        minHeight: { xs: 52, sm: 56 },
        boxSizing: 'border-box',
        p: { xs: '12px 14px', sm: '14px 16px' },
        borderRadius: 2,
        border: '1px solid',
        borderColor,
        bgcolor,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
        '&:hover': disabled
            ? {}
            : {
                  borderColor: alpha(accent, 0.5),
                  bgcolor: alpha(accent, 0.1),
              },
        '& .MuiRadio-root': {
            p: 0.5,
            flexShrink: 0,
            alignSelf: 'center',
            color: alpha('#e2e8f0', 0.65),
            '&.Mui-checked': { color: accent },
        },
        '& .MuiFormControlLabel-label': {
            flex: 1,
            minWidth: 0,
            ml: { xs: 1, sm: 1.25 },
            mt: 0,
            display: 'flex',
            alignItems: 'center',
        },
    };
}

export const puzzleOptionTextSx: SxProps<Theme> = {
    flex: 1,
    minWidth: 0,
    fontSize: { xs: '0.9375rem', sm: '1rem' },
    lineHeight: 1.45,
    color: alpha('#f8fafc', 0.92),
    wordBreak: 'break-word',
};

export const puzzleSubmitButtonSx = (accent: string): SxProps<Theme> => ({
    py: 1.5,
    px: 2,
    fontWeight: 700,
    fontSize: '1rem',
    textTransform: 'none',
    color: '#fff',
    bgcolor: accent,
    boxShadow: `0 4px 14px ${alpha(accent, 0.45)}`,
    '&:hover': {
        bgcolor: alpha(accent, 0.9),
        boxShadow: `0 6px 18px ${alpha(accent, 0.5)}`,
    },
    '&.Mui-disabled': {
        bgcolor: alpha(accent, 0.45),
        color: alpha('#fff', 0.92),
        boxShadow: 'none',
    },
});

export const puzzleFooterHintSx: SxProps<Theme> = {
    mt: 2,
    textAlign: 'center',
    color: alpha('#e2e8f0', 0.6),
    fontSize: '0.875rem',
    lineHeight: 1.45,
};

export const puzzleResultsBoxSx = (accent: string): SxProps<Theme> => ({
    mb: 3,
    p: { xs: 1.5, sm: 2 },
    borderRadius: 2,
    bgcolor: alpha(accent, 0.12),
    border: `1px solid ${alpha(accent, 0.35)}`,
});

export const puzzleExplanationBoxSx: SxProps<Theme> = {
    mt: 1.5,
    p: { xs: 1.25, sm: 1.5 },
    borderRadius: 1.5,
    bgcolor: alpha('#38bdf8', 0.12),
    border: `1px solid ${alpha('#38bdf8', 0.28)}`,
};
