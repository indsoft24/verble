import React from 'react';
import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { SITE_OWNER, SITE_REFUND_CREDIT_POLICY, siteOwnerDisplayLine } from '../../config/siteBusiness';

interface SiteLegalNoticeProps {
    variant?: 'footer' | 'panel' | 'inline';
    sx?: SxProps<Theme>;
}

const SiteLegalNotice: React.FC<SiteLegalNoticeProps> = ({ variant = 'inline', sx }) => {
    if (variant === 'footer') {
        return (
            <Box sx={sx}>
                <Typography variant="body2" sx={{ color: 'rgba(203,213,225,0.82)', mb: 0.5 }}>
                    {siteOwnerDisplayLine}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.82)', display: 'block', lineHeight: 1.55 }}>
                    Refund Policy: {SITE_REFUND_CREDIT_POLICY}
                </Typography>
            </Box>
        );
    }

    if (variant === 'panel') {
        return (
            <Box
                sx={{
                    mt: 3,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                    ...sx,
                }}
            >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                    {SITE_OWNER.role}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {SITE_OWNER.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    <strong>Refund Policy:</strong> {SITE_REFUND_CREDIT_POLICY}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={sx}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {siteOwnerDisplayLine}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
                <strong>Refund Policy:</strong> {SITE_REFUND_CREDIT_POLICY}
            </Typography>
        </Box>
    );
};

export default SiteLegalNotice;
