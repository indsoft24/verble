import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { Snackbar, Alert, Box } from '@mui/material';

const NotificationContainer: React.FC = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
            }}
        >
            {notifications.map(notification => (
                <Snackbar
                    key={notification.id}
                    open={true}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => removeNotification(notification.id)}
                        severity={notification.type}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            ))}
        </Box>
    );
};

export default NotificationContainer;