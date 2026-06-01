/** Integer theme.spacing only — fractional values break with array-based theme. */
export const AGENDA_GAP = 2;
/** Fixed pixel gap for premium / gold grids (matches production layout tuning). */
export const AGENDA_GRID_GAP = '10px';
export const AGENDA_BAND_PADDING = 2;
export const AGENDA_HEADER_PY = 2;

export const agendaGridColumns2 = {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
} as const;

export const agendaGridColumns3 = {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    md: 'repeat(3, minmax(0, 1fr))',
} as const;

/** 6-column grid: row of 2 tiles (span 3 each), row of 3 tiles (span 2 each). */
export const premiumAgendaGridColumns = {
    xs: '1fr',
    sm: 'repeat(2, minmax(0, 1fr))',
    lg: 'repeat(6, minmax(0, 1fr))',
} as const;

export const premiumTopTileSpan = {
    xs: 'auto',
    lg: 'span 3',
} as const;

export const premiumBottomTileSpan = {
    xs: 'auto',
    sm: 'span 1',
    lg: 'span 2',
} as const;
