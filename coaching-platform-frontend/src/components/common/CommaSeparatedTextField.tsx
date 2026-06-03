import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Stack, TextField, type TextFieldProps } from '@mui/material';
import {
    formatCommaSeparatedList,
    parseCommaSeparatedList,
    type ParseCommaSeparatedOptions,
} from '../../utils/commaSeparatedList';

export interface CommaSeparatedTextFieldProps
    extends Omit<TextFieldProps, 'value' | 'onChange' | 'onBlur'> {
    value: string[];
    onChange: (items: string[]) => void;
    /** When this changes, the input resets from `value` (e.g. open edit vs create). */
    syncKey?: string;
    parseOptions?: ParseCommaSeparatedOptions;
    showChips?: boolean;
    onBlur?: TextFieldProps['onBlur'];
}

/**
 * Comma-separated list input: keeps raw text while typing (commas are not swallowed)
 * and updates `value` on each change for save handlers.
 */
const CommaSeparatedTextField: React.FC<CommaSeparatedTextFieldProps> = ({
    value,
    onChange,
    syncKey,
    parseOptions,
    showChips = true,
    helperText,
    onBlur: onBlurProp,
    ...textFieldProps
}) => {
    const [text, setText] = useState(() => formatCommaSeparatedList(value));

    useEffect(() => {
        setText(formatCommaSeparatedList(value));
    }, [syncKey]);

    const parsedPreview = useMemo(() => parseCommaSeparatedList(text, parseOptions), [text, parseOptions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const next = e.target.value;
        setText(next);
        onChange(parseCommaSeparatedList(next, parseOptions));
    };

    const handleBlur: TextFieldProps['onBlur'] = (e) => {
        const normalized = formatCommaSeparatedList(parseCommaSeparatedList(text, parseOptions));
        setText(normalized);
        onChange(parseCommaSeparatedList(normalized, parseOptions));
        onBlurProp?.(e);
    };

    return (
        <Box>
            <TextField
                {...textFieldProps}
                value={text}
                onChange={handleChange}
                onBlur={handleBlur}
                helperText={helperText ?? 'Separate values with commas'}
            />
            {showChips && parsedPreview.length > 0 && (
                <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 0.75, mt: 1.25 }}>
                    {parsedPreview.map((item) => (
                        <Chip
                            key={item}
                            label={item}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default CommaSeparatedTextField;
