import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { Alert, Box } from '@mui/material';

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                pointerEvents: 'none',
                top: { xs: 16, sm: 20 },
                right: { xs: 16, sm: 20 },
                left: { xs: 16, sm: 'auto' },
                alignItems: { xs: 'stretch', sm: 'flex-end' },
                maxWidth: { xs: 'none', sm: 420 },
            }}
        >
            {notifications.map((notification) => (
                <Alert
                    key={notification.id}
                    onClose={() => removeNotification(notification.id)}
                    severity={notification.type}
                    variant="filled"
                    sx={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: { xs: '100%', sm: 400 },
                        wordBreak: 'break-word',
                        boxShadow: 3,
                    }}
                >
                    {notification.message}
                </Alert>
            ))}
        </Box>
    );
};

export default NotificationContainer;
