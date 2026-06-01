import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ValidationColumnId =
    | 'type'
    | 'activity'
    | 'user'
    | 'phone'
    | 'userSubmission'
    | 'submitted'
    | 'actions';

export const VALIDATION_COLUMN_ORDER: ValidationColumnId[] = [
    'type',
    'activity',
    'user',
    'phone',
    'userSubmission',
    'submitted',
    'actions',
];

export const VALIDATION_COLUMN_LABELS: Record<ValidationColumnId, string> = {
    type: 'Type',
    activity: 'Activity',
    user: 'User',
    phone: 'Phone',
    userSubmission: 'User submission',
    submitted: 'Submitted',
    actions: 'Actions',
};

const STORAGE_KEY = 'adminSentenceValidationColumnWidths';

export const DEFAULT_VALIDATION_COLUMN_WIDTHS: Record<ValidationColumnId, number> = {
    type: 140,
    activity: 160,
    user: 140,
    phone: 120,
    userSubmission: 440,
    submitted: 150,
    actions: 120,
};

const MIN_VALIDATION_COLUMN_WIDTHS: Record<ValidationColumnId, number> = {
    type: 90,
    activity: 100,
    user: 100,
    phone: 90,
    userSubmission: 200,
    submitted: 110,
    actions: 90,
};

function loadColumnWidths(): Record<ValidationColumnId, number> {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_VALIDATION_COLUMN_WIDTHS };
        const parsed = JSON.parse(raw) as Partial<Record<ValidationColumnId, number>>;
        const merged = { ...DEFAULT_VALIDATION_COLUMN_WIDTHS };
        for (const id of VALIDATION_COLUMN_ORDER) {
            const w = parsed[id];
            if (typeof w === 'number' && w >= MIN_VALIDATION_COLUMN_WIDTHS[id]) {
                merged[id] = Math.round(w);
            }
        }
        return merged;
    } catch {
        return { ...DEFAULT_VALIDATION_COLUMN_WIDTHS };
    }
}

export function useResizableValidationColumns() {
    const [widths, setWidths] = useState(loadColumnWidths);
    const widthsRef = useRef(widths);
    widthsRef.current = widths;

    const activeResize = useRef<{
        id: ValidationColumnId;
        startX: number;
        startWidth: number;
    } | null>(null);

    const persistWidths = useCallback(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(widthsRef.current));
    }, []);

    const startResize = useCallback((id: ValidationColumnId, clientX: number) => {
        activeResize.current = {
            id,
            startX: clientX,
            startWidth: widthsRef.current[id],
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!activeResize.current) return;
            const { id, startX, startWidth } = activeResize.current;
            const min = MIN_VALIDATION_COLUMN_WIDTHS[id];
            const next = Math.max(min, Math.round(startWidth + (e.clientX - startX)));
            setWidths((prev) => ({ ...prev, [id]: next }));
        };

        const onUp = () => {
            if (!activeResize.current) return;
            activeResize.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            persistWidths();
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [persistWidths]);

    const cellSx = useCallback(
        (id: ValidationColumnId) => ({
            width: widths[id],
            minWidth: widths[id],
            maxWidth: widths[id],
            overflow: 'hidden',
            verticalAlign: 'top' as const,
            boxSizing: 'border-box' as const,
        }),
        [widths]
    );

    const tableMinWidth = useMemo(
        () => VALIDATION_COLUMN_ORDER.reduce((sum, id) => sum + widths[id], 0),
        [widths]
    );

    return {
        widths,
        startResize,
        cellSx,
        tableMinWidth,
        minWidths: MIN_VALIDATION_COLUMN_WIDTHS,
    };
}
