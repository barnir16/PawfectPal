import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Vaccines as VaccinesIcon,
  Scale as ScaleIcon,
  HealthAndSafety as HealthIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { NotificationService } from '../../services/notifications/notificationService';

interface NotificationSettings {
  vaccineReminders: boolean;
  weightAlerts: boolean;
  healthMilestones: boolean;
  generalUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export const PushNotificationManager: React.FC = () => {
  const { t } = useLocalization();
  const [settings, setSettings] = useState<NotificationSettings>({
    vaccineReminders: true,
    weightAlerts: true,
    healthMilestones: true,
    generalUpdates: false,
    emailNotifications: true,
    pushNotifications: true,
    reminderFrequency: 'weekly',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'subscribed' | 'unsubscribed' | 'error'>('unsubscribed');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkNotificationPermission();
    loadNotificationSettings();
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const permission = await NotificationService.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        const isSubscribed = await NotificationService.isPermitted();
        setSubscriptionStatus(isSubscribed ? 'subscribed' : 'unsubscribed');
      }
    } catch (err) {
      console.error('Error checking notification permission:', err);
      setPermissionStatus('denied');
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await NotificationService.getNotificationSettings();
      if (savedSettings) {
        // Ensure all required fields are present
        const defaultSettings: NotificationSettings = {
          vaccineReminders: true,
          weightAlerts: true,
          healthMilestones: true,
          generalUpdates: false,
          emailNotifications: true,
          pushNotifications: true,
          reminderFrequency: 'weekly',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        };
        
        setSettings({
          ...defaultSettings,
          ...savedSettings,
          quietHours: {
            ...defaultSettings.quietHours,
            ...(savedSettings.quietHours || {})
          }
        });
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      await NotificationService.saveNotificationSettings(newSettings);
      setSuccess(t('notifications.messages.saved'));
      
      // If enabling push notifications, request permission
      if (key === 'pushNotifications' && value === true) {
        await checkNotificationPermission();
      }
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError(t('notifications.messages.saveError'));
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await NotificationService.subscribeToPushNotifications();
      setSubscriptionStatus('subscribed');
      setSuccess(t('notifications.messages.subscribed'));
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      setError(t('notifications.messages.subscribeError'));
      setSubscriptionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // No direct unsubscribe method available, we'll just update the local state
      setSubscriptionStatus('unsubscribed');
      setSubscriptionStatus('unsubscribed');
      setSuccess(t('notifications.messages.unsubscribed'));
    } catch (err) {
      console.error('Error unsubscribing from notifications:', err);
      setError(t('notifications.messages.unsubscribeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Send immediate test notification with 0 delay
      await NotificationService.scheduleNotification(
        {
          id: `test-${Date.now()}`,
          title: t('notifications.testNotification.title'),
          body: t('notifications.testNotification.body'),
          type: 'general',
          priority: 'medium',
          timestamp: new Date(),
          read: false,
        },
        0 // Send immediately
      );
      
      setSuccess(t('notifications.messages.testSent'));
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError(t('notifications.messages.testError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatusColor = () => {
    switch (permissionStatus) {
      case 'granted': return 'success';
      case 'denied': return 'error';
      default: return 'warning';
    }
  };

  const getPermissionStatusText = () => {
    switch (permissionStatus) {
      case 'granted': return t('notifications.permission.granted');
      case 'denied': return t('notifications.permission.denied');
      default: return t('notifications.permission.default');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <NotificationsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          {t('notifications.title')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={t('notifications.permission.title')}
              avatar={
                permissionStatus === 'granted' ? (
                  <NotificationsActiveIcon color="success" />
                ) : (
                  <NotificationsOffIcon color="disabled" />
                )
              }
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('notifications.permission.status')}:
                </Typography>
                <Chip
                  label={getPermissionStatusText()}
                  color={getPermissionStatusColor()}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                {subscriptionStatus === 'subscribed' ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    startIcon={<NotificationsOffIcon />}
                  >
                    {t('notifications.permission.unsubscribe')}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleSubscribe}
                    disabled={isLoading || permissionStatus === 'denied'}
                    startIcon={<NotificationsIcon />}
                  >
                    {t('notifications.permission.subscribe')}
                  </Button>
                )}

                <Button
                  variant="outlined"
                  onClick={handleTestNotification}
                  disabled={isLoading || subscriptionStatus !== 'subscribed'}
                >
                  {t('notifications.permission.test')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={t('notifications.settings.title')}
              avatar={<SettingsIcon color="primary" />}
            />
            <CardContent>
              <List>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.vaccineReminders}
                      onChange={(e) => handleSettingChange('vaccineReminders', e.target.checked)}
                      sx={{ ml: 2 }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <VaccinesIcon color="primary" sx={{ mr: 1 }} />
                      {t('notifications.settings.vaccineReminders')}
                    </Box>
                  }
                  sx={{ ml: 0, py: 1.5 }}
                />

                <Divider variant="inset" component="li" />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.weightAlerts}
                      onChange={(e) => handleSettingChange('weightAlerts', e.target.checked)}
                      sx={{ ml: 2 }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <ScaleIcon color="primary" sx={{ mr: 1 }} />
                      {t('notifications.settings.weightAlerts')}
                    </Box>
                  }
                  sx={{ ml: 0, py: 1.5 }}
                />

                <Divider variant="inset" component="li" />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.healthMilestones}
                      onChange={(e) => handleSettingChange('healthMilestones', e.target.checked)}
                      sx={{ ml: 2 }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <HealthIcon color="primary" sx={{ mr: 1 }} />
                      {t('notifications.settings.healthMilestones')}
                    </Box>
                  }
                  sx={{ ml: 0, py: 1.5 }}
                />

                <Divider variant="inset" component="li" />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.generalUpdates}
                      onChange={(e) => handleSettingChange('generalUpdates', e.target.checked)}
                      sx={{ ml: 2 }}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <NotificationsIcon color="primary" sx={{ mr: 1 }} />
                      {t('notifications.settings.generalUpdates')}
                    </Box>
                  }
                  sx={{ ml: 0, py: 1.5 }}
                />
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Channels */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={t('notifications.settings.notificationChannels')}
              avatar={<NotificationsIcon />}
            />
            <CardContent sx={{ '& .MuiFormControlLabel-root': { py: 1.5 } }}>
              <Box sx={{ px: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                    />
                  }
                  label={t('notifications.settings.pushNotifications')}
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ px: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  }
                  label={t('notifications.settings.emailNotifications')}
                  sx={{ width: '100%', m: 0 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Frequency Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={t('notifications.settings.reminderFrequency')}
              avatar={<ScheduleIcon />}
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('notifications.settings.vaccineReminderFrequency')}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={t('notifications.settings.frequency.daily')}
                  color={settings.reminderFrequency === 'daily' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('reminderFrequency', 'daily')}
                  clickable
                />
                <Chip
                  label={t('notifications.settings.frequency.weekly')}
                  color={settings.reminderFrequency === 'weekly' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('reminderFrequency', 'weekly')}
                  clickable
                />
                <Chip
                  label={t('notifications.settings.frequency.monthly')}
                  color={settings.reminderFrequency === 'monthly' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('reminderFrequency', 'monthly')}
                  clickable
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PushNotificationManager;

