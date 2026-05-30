import React, { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import type { TiptapEditorProps } from './TiptapEditor';

const TiptapEditor = lazy(() => import('./TiptapEditor'));

const LazyTiptapEditor: React.FC<TiptapEditorProps> = (props) => (
    <Suspense
        fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <CircularProgress size={32} />
            </Box>
        }
    >
        <TiptapEditor {...props} />
    </Suspense>
);

export default LazyTiptapEditor;
