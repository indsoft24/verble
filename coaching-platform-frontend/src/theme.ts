// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    components: {
        MuiGrid: {
            styleOverrides: {
                root: {
                    '&.MuiGrid-container': {
                        '--Grid-columnSpacing': '18px', // Reduced from default 24px to 18px
                    },
                },
            },
        },
    },
});

export default theme;
