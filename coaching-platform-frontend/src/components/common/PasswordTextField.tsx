import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment, type TextFieldProps } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

type PasswordTextFieldProps = Omit<TextFieldProps, 'type'>;

const PasswordTextField: React.FC<PasswordTextFieldProps> = ({ label, InputProps, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleToggleVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    return (
        <TextField
            {...props}
            label={label}
            type={showPassword ? 'text' : 'password'}
            InputProps={{
                ...InputProps,
                endAdornment: (
                    <>
                        {InputProps?.endAdornment}
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={`toggle ${String(label || 'password')} visibility`}
                                onClick={handleToggleVisibility}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                            >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    </>
                ),
            }}
        />
    );
};

export default PasswordTextField;

