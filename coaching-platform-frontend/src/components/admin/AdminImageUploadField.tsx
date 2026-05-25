import React, { useId, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Alert,
    TextField,
    Collapse,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadDailyContentImage } from '../../services/dailyContentAdminService';

export interface AdminImageUploadFieldProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    /** Show optional manual URL field */
    allowUrlEdit?: boolean;
}

const AdminImageUploadField: React.FC<AdminImageUploadFieldProps> = ({
    label,
    value,
    onChange,
    disabled = false,
    allowUrlEdit = true,
}) => {
    const inputId = useId();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUrlField, setShowUrlField] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please choose an image file (JPEG, PNG, WebP, or GIF).');
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const { imageUrl } = await uploadDailyContentImage(file);
            onChange(imageUrl);
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? String((err as { message: string }).message)
                    : 'Image upload failed.';
            setError(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {label}
            </Typography>

            <input
                id={inputId}
                type="file"
                accept="image/*"
                hidden
                disabled={disabled || uploading}
                onChange={handleFileChange}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <label htmlFor={inputId}>
                    <Button
                        variant="outlined"
                        component="span"
                        startIcon={uploading ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                        disabled={disabled || uploading}
                    >
                        {uploading ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
                    </Button>
                </label>
                {value && (
                    <Button size="small" onClick={() => onChange('')} disabled={disabled || uploading}>
                        Remove
                    </Button>
                )}
                {allowUrlEdit && (
                    <Button size="small" onClick={() => setShowUrlField((v) => !v)} disabled={disabled}>
                        {showUrlField ? 'Hide URL' : 'Paste URL instead'}
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}

            {value && (
                <Box
                    sx={{
                        mt: 2,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                    }}
                >
                    <Box
                        component="img"
                        src={value}
                        alt="Preview"
                        sx={{
                            maxWidth: '100%',
                            maxHeight: 180,
                            objectFit: 'contain',
                            borderRadius: 1,
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </Box>
            )}

            <Collapse in={showUrlField}>
                <TextField
                    fullWidth
                    size="small"
                    label="Image URL"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    sx={{ mt: 1 }}
                    helperText="Optional: paste a direct image link if you are not uploading a file."
                />
            </Collapse>
        </Box>
    );
};

export default AdminImageUploadField;
