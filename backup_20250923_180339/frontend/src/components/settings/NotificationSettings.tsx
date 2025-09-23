import { useState } from 'react';
import { Box, FormGroup, FormControlLabel, Switch, Typography, Button } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { SettingsCard } from './SettingsCard';

export interface NotificationSettingsData {
  email: boolean;
  push: boolean;
  reminders: boolean;
  promotions: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationSettingsData;
  onSave: (settings: NotificationSettingsData) => void;
}

export const NotificationSettings = ({ settings, onSave }: NotificationSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsData>({ ...settings });

  const handleToggle = (setting: keyof NotificationSettingsData) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(notificationSettings);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNotificationSettings({ ...settings });
    setIsEditing(false);
  };

  return (
    <SettingsCard 
      title="Notification Preferences"
      subtitle="Customize how you receive notifications"
      action={
        !isEditing ? (
          <Button
            startIcon={<SaveIcon />}
            onClick={() => setIsEditing(true)}
            variant="outlined"
          >
            Edit
          </Button>
        ) : (
          <Box display="flex" gap={1}>
            <Button
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              variant="outlined"
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              variant="contained"
              color="primary"
            >
              Save Changes
            </Button>
          </Box>
        )
      }
    >
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.email}
                onChange={() => handleToggle('email')}
                disabled={!isEditing}
              />
            }
            label={
              <Box>
                <Typography>Email Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive notifications via email
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.push}
                onChange={() => handleToggle('push')}
                disabled={!isEditing}
              />
            }
            label={
              <Box>
                <Typography>Push Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive push notifications on your device
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.reminders}
                onChange={() => handleToggle('reminders')}
                disabled={!isEditing}
              />
            }
            label={
              <Box>
                <Typography>Reminders</Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive reminders for upcoming appointments
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.promotions}
                onChange={() => handleToggle('promotions')}
                disabled={!isEditing}
              />
            }
            label={
              <Box>
                <Typography>Promotional Emails</Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive special offers and promotions
                </Typography>
              </Box>
            }
          />
        </FormGroup>
      </form>
    </SettingsCard>
  );
};

export default NotificationSettings;
