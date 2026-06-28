import React, { useState } from 'react';
import { Box, Button, Typography, alpha } from '@mui/material';
import type { BilingualSegment } from '../../utils/textSegmentUtils';

export interface BilingualSegmentListProps {
    segments: BilingualSegment[];
    accentColor: string;
}

const BilingualSegmentList: React.FC<BilingualSegmentListProps> = ({ segments, accentColor }) => {
    const [showHindi, setShowHindi] = useState<Record<number, boolean>>({});

    if (segments.length === 0) return null;

    return (
        <Box>
            {segments.map((item, index) => (
                <Box key={index} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        {item.en ? (
                            <Typography
                                variant="body2"
                                sx={{ flex: 1, color: alpha('#e2e8f0', 0.92), lineHeight: 1.7 }}
                            >
                                {item.en}
                            </Typography>
                        ) : (
                            <Box sx={{ flex: 1 }} />
                        )}
                        {item.hi ? (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                    setShowHindi((prev) => ({
                                        ...prev,
                                        [index]: !prev[index],
                                    }))
                                }
                                sx={{
                                    minWidth: 36,
                                    borderColor: alpha(accentColor, 0.5),
                                    color: accentColor,
                                }}
                            >
                                {showHindi[index] ? 'EN' : 'HI'}
                            </Button>
                        ) : null}
                    </Box>
                    {item.hi && showHindi[index] && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: alpha('#e2e8f0', 0.65),
                                fontStyle: 'italic',
                                pl: 2,
                                mt: 0.5,
                                borderLeft: `2px solid ${alpha(accentColor, 0.5)}`,
                                lineHeight: 1.7,
                            }}
                        >
                            {item.hi}
                        </Typography>
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default BilingualSegmentList;
