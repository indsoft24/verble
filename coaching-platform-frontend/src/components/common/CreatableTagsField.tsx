import React from 'react';
import { Autocomplete, Chip, TextField, type TextFieldProps } from '@mui/material';

export interface CreatableTagsFieldProps
    extends Omit<TextFieldProps, 'value' | 'onChange' | 'defaultValue'> {
    value: string[];
    options?: string[];
    onChange: (tags: string[]) => void;
}

function normalizeTags(raw: (string | null)[]): string[] {
    const seen = new Map<string, string>();
    for (const item of raw) {
        const trimmed = String(item ?? '').trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!seen.has(key)) {
            seen.set(key, trimmed);
        }
    }
    return Array.from(seen.values());
}

const CreatableTagsField: React.FC<CreatableTagsFieldProps> = ({
    value,
    options = [],
    onChange,
    label = 'Tags',
    helperText,
    placeholder,
    ...textFieldProps
}) => {
    const sortedOptions = React.useMemo(() => {
        const merged = new Map<string, string>();
        for (const opt of options) {
            const trimmed = opt.trim();
            if (trimmed) merged.set(trimmed.toLowerCase(), trimmed);
        }
        for (const tag of value) {
            const trimmed = tag.trim();
            if (trimmed) merged.set(trimmed.toLowerCase(), trimmed);
        }
        return Array.from(merged.values()).sort((a, b) => a.localeCompare(b));
    }, [options, value]);

    return (
        <Autocomplete
            multiple
            freeSolo
            options={sortedOptions}
            value={value}
            onChange={(_, newValue) => {
                onChange(normalizeTags(newValue));
            }}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                        <Chip
                            key={key ?? index}
                            variant="outlined"
                            label={option}
                            size="small"
                            {...tagProps}
                        />
                    );
                })
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    {...textFieldProps}
                    label={label}
                    placeholder={placeholder}
                    helperText={helperText}
                />
            )}
        />
    );
};

export default CreatableTagsField;
