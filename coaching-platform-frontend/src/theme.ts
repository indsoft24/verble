// src/theme.ts
import { createTheme } from '@mui/material/styles';

// Default 8px unit; override index 5 (normally 40px) to 15px for section padding
const spacingBase = 8;
const spacing = Array.from({ length: 32 }, (_, i) => (i === 5 ? 15 : i * spacingBase));

const theme = createTheme({
    spacing,
    components: {
        MuiGrid: {
            styleOverrides: {
                root: {
                    '&.MuiGrid-container': {
                        '--Grid-columnSpacing': '12px',
                        '--Grid-rowSpacing': '12px',
                    },
                },
            },
        },
    },
});

export default theme;
