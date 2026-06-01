import React from 'react';
import { Box, Button, Typography, alpha } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { isInstagramProfileUrl, isInstagramPostUrl, normalizeHttpUrl } from '../../utils/mediaUrlUtils';

export interface ActivitySourceCreditProps {
    creditLabel?: string;
    creditUrl?: string;
    postLink?: string;
    accentColor?: string;
}

const ActivitySourceCredit: React.FC<ActivitySourceCreditProps> = ({
    creditLabel,
    creditUrl,
    postLink,
    accentColor = '#ca8a04',
}) => {
    const channelUrl = normalizeHttpUrl(creditUrl || '');
    const postUrl = normalizeHttpUrl(postLink || '');
    const label = creditLabel?.trim();

    if (!label && !channelUrl && !postUrl) return null;

    const channelButtonLabel = channelUrl
        ? isInstagramProfileUrl(channelUrl) || isInstagramPostUrl(channelUrl)
            ? 'Follow on Instagram'
            : /youtube\.com/i.test(channelUrl)
              ? 'Visit channel'
              : 'Visit source'
        : null;

    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 1.5,
                py: 1.5,
                px: 0.5,
            }}
        >
            {label && (
                <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.75), fontWeight: 600 }}>
                    Source: {label}
                </Typography>
            )}
            {channelUrl && channelButtonLabel && (
                <Button
                    size="small"
                    variant="outlined"
                    href={channelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{
                        borderColor: alpha(accentColor, 0.6),
                        color: accentColor,
                        fontWeight: 700,
                        textTransform: 'none',
                    }}
                >
                    {channelButtonLabel}
                </Button>
            )}
            {postUrl && postUrl !== channelUrl && (
                <Button
                    size="small"
                    variant="text"
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon fontSize="small" />}
                    sx={{ color: alpha('#e2e8f0', 0.85), fontWeight: 600, textTransform: 'none' }}
                >
                    View post
                </Button>
            )}
        </Box>
    );
};

export default ActivitySourceCredit;
