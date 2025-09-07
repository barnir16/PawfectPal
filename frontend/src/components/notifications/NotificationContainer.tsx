import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  Box,
  Slide,
  SlideProps,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNotifications, Notification } from '../../contexts/NotificationContext';

interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="left" />;
};

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const handleClose = () => {
    onClose(notification.id);
  };

  const handleActionClick = () => {
    if (notification.action) {
      notification.action.onClick();
    }
    handleClose();
  };

  return (
    <Snackbar
      open={true}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={notification.type}
        onClose={handleClose}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {notification.action && (
              <IconButton
                size="small"
                onClick={handleActionClick}
                color="inherit"
                sx={{ textTransform: 'none' }}
              >
                {notification.action.label}
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={handleClose}
              color="inherit"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{ minWidth: 300, maxWidth: 500 }}
      >
        <AlertTitle>{notification.title}</AlertTitle>
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {notifications.map((notification) => (
        <Box
          key={notification.id}
          sx={{ pointerEvents: 'auto', mb: 1 }}
        >
          <NotificationItem
            notification={notification}
            onClose={removeNotification}
          />
        </Box>
      ))}
    </Box>
  );
};
