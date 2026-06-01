import React, { useState } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { resolveBackendMediaUrl } from '../../utils/imageUtils';
import {
    getInstagramEmbedUrl,
    isInstagramPostUrl,
    type NormalizedInstagramPost,
} from '../../utils/mediaUrlUtils';
import ActivitySourceCredit from './ActivitySourceCredit';

const FEED_ACCENT = '#e1306c';

export interface InstagramPostCardProps {
    post: NormalizedInstagramPost;
    index: number;
}

const InstagramPostCard: React.FC<InstagramPostCardProps> = ({ post, index }) => {
    const [imageFailed, setImageFailed] = useState(false);

    const resolvedImage =
        post.imageUrl && !isInstagramPostUrl(post.imageUrl)
            ? resolveBackendMediaUrl(post.imageUrl)
            : '';
    const showImage = Boolean(resolvedImage) && !imageFailed;
    const embedUrl = getInstagramEmbedUrl(post.postLink);

    return (
        <Box
            sx={{
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${alpha(FEED_ACCENT, 0.35)}`,
                bgcolor: alpha('#1a1f2e', 0.5),
            }}
        >
            {showImage ? (
                <Box
                    sx={{
                        width: '100%',
                        aspectRatio: '1',
                        bgcolor: '#000',
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        component="img"
                        src={resolvedImage}
                        alt={`Instagram post ${index + 1}`}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImageFailed(true)}
                    />
                </Box>
            ) : embedUrl ? (
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 540,
                        mx: 'auto',
                        bgcolor: '#000',
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            paddingTop: '125%',
                            width: '100%',
                        }}
                    >
                        <Box
                            component="iframe"
                            src={embedUrl}
                            title={`Instagram embed ${index + 1}`}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                border: 0,
                            }}
                            allow="encrypted-media"
                        />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        py: 6,
                        px: 2,
                        textAlign: 'center',
                        background: `linear-gradient(135deg, ${alpha(FEED_ACCENT, 0.15)} 0%, ${alpha('#0f172a', 0.9)} 100%)`,
                    }}
                >
                    <Typography variant="body2" sx={{ color: alpha('#e2e8f0', 0.6) }}>
                        {post.caption ? 'Post preview' : 'No image — add an upload or Instagram post URL in admin'}
                    </Typography>
                </Box>
            )}

            {post.caption && (
                <Box sx={{ p: 2, borderTop: `1px solid ${alpha(FEED_ACCENT, 0.2)}` }}>
                    <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-line', color: alpha('#e2e8f0', 0.92), lineHeight: 1.7 }}
                    >
                        {post.caption}
                    </Typography>
                </Box>
            )}

            <Box
                sx={{
                    px: 2,
                    pb: 2,
                    pt: post.caption ? 0 : 2,
                    borderTop: post.caption ? 'none' : `1px solid ${alpha(FEED_ACCENT, 0.2)}`,
                }}
            >
                <ActivitySourceCredit
                    creditLabel={post.credit}
                    creditUrl={post.creditUrl}
                    postLink={post.postLink}
                    accentColor={FEED_ACCENT}
                />
            </Box>
        </Box>
    );
};

export default InstagramPostCard;
