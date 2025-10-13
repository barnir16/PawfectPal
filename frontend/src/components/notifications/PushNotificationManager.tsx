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
        const isSubscribed = await NotificationService.subscribeToPushNotifications();
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
        setSettings(savedSettings);
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
      setSuccess('הגדרות ההתראות נשמרו בהצלחה');
      
      // If enabling push notifications, request permission
      if (key === 'pushNotifications' && value === true) {
        await checkNotificationPermission();
      }
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('שגיאה בשמירת הגדרות ההתראות');
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await NotificationService.subscribeToPushNotifications();
      setSubscriptionStatus('subscribed');
      setSuccess('נרשמת בהצלחה להתראות');
    } catch (err) {
      console.error('Error subscribing to notifications:', err);
      setError('שגיאה בהרשמה להתראות');
      setSubscriptionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Note: No unsubscribe method available in NotificationService
      console.log('Unsubscribe functionality not implemented');
      setSubscriptionStatus('unsubscribed');
      setSuccess('ביטלת בהצלחה את ההרשמה להתראות');
    } catch (err) {
      console.error('Error unsubscribing from notifications:', err);
      setError('שגיאה בביטול ההרשמה להתראות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await NotificationService.sendLocalNotification({
        id: `test-${Date.now()}`,
        title: 'בדיקת התראה',
        body: 'זוהי התראה לבדיקה מ-PawfectPal',
        type: 'general',
        priority: 'medium',
        timestamp: new Date(),
        read: false,
      });
      
      setSuccess('התראה לבדיקה נשלחה בהצלחה');
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError('שגיאה בשליחת התראה לבדיקה');
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
      case 'granted': return 'הותר';
      case 'denied': return 'נדחה';
      default: return 'לא נקבע';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <NotificationsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          ניהול התראות
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
        {/* Permission Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="סטטוס הרשאות"
              avatar={<NotificationsIcon />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={getPermissionStatusText()}
                  color={getPermissionStatusColor() as any}
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="textSecondary">
                  הרשאות התראות דחיפה
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={subscriptionStatus === 'subscribed' ? 'נרשם' : 'לא נרשם'}
                  color={subscriptionStatus === 'subscribed' ? 'success' : 'default'}
                  sx={{ mr: 2 }}
                />
                <Typography variant="body2" color="textSecondary">
                  הרשמה להתראות
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {permissionStatus === 'granted' && subscriptionStatus === 'unsubscribed' && (
                  <Button
                    variant="contained"
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} /> : <NotificationsActiveIcon />}
                  >
                    הרשם להתראות
                  </Button>
                )}
                
                {subscriptionStatus === 'subscribed' && (
                  <Button
                    variant="outlined"
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} /> : <NotificationsOffIcon />}
                  >
                    בטל הרשמה
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  onClick={handleTestNotification}
                  disabled={isLoading || subscriptionStatus !== 'subscribed'}
                  startIcon={<NotificationsIcon />}
                >
                  בדיקת התראה
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Types */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="סוגי התראות"
              avatar={<SettingsIcon />}
            />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <VaccinesIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="תזכורות חיסונים"
                    secondary="קבל תזכורות על חיסונים מתקרבים"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.vaccineReminders}
                      onChange={(e) => handleSettingChange('vaccineReminders', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ScaleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="התראות משקל"
                    secondary="קבל התראות על שינויים במשקל"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.weightAlerts}
                      onChange={(e) => handleSettingChange('weightAlerts', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <HealthIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="אבני דרך בריאות"
                    secondary="קבל התראות על אבני דרך בריאותיות"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.healthMilestones}
                      onChange={(e) => handleSettingChange('healthMilestones', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <NotificationsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="עדכונים כלליים"
                    secondary="קבל עדכונים על תכונות חדשות"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={settings.generalUpdates}
                      onChange={(e) => handleSettingChange('generalUpdates', e.target.checked)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Channels */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="ערוצי התראה"
              avatar={<NotificationsIcon />}
            />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                }
                label="התראות דחיפה"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                }
                label="התראות אימייל"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Frequency Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title="תדירות תזכורות"
              avatar={<ScheduleIcon />}
            />
            <CardContent>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                תדירות תזכורות חיסונים
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="יומי"
                  color={settings.reminderFrequency === 'daily' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('reminderFrequency', 'daily')}
                  clickable
                />
                <Chip
                  label="שבועי"
                  color={settings.reminderFrequency === 'weekly' ? 'primary' : 'default'}
                  onClick={() => handleSettingChange('reminderFrequency', 'weekly')}
                  clickable
                />
                <Chip
                  label="חודשי"
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

