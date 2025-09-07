import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocalization } from '../../../contexts/LocalizationContext';
import { useNotifications } from '../../../contexts/NotificationContext';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    vaccineReminders: boolean;
  };
}

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLocalization();
  const { addNotification } = useNotifications();
  
  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    username: user?.username || '',
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    country: 'Israel',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    notifications: {
      email: true,
      push: true,
      taskReminders: true,
      vaccineReminders: true,
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load user profile data
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from the backend
      // For now, we'll use the user data from auth context
      setProfile(prev => ({
        ...prev,
        id: user?.id || '',
        username: user?.username || '',
        email: user?.email || '',
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real implementation, this would save to the backend
      // For now, we'll just update the local state
      await updateUser(profile);
      
      setIsEditing(false);
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfile(); // Reset to original data
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: keyof UserProfile['notifications'], value: boolean) => {
    setProfile(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [field]: value
      }
    }));
  };

  if (isLoading && !profile.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('profile.title', 'User Profile')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Picture and Basic Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title={t('profile.personalInfo', 'Personal Information')}
              action={
                !isEditing ? (
                  <IconButton onClick={() => setIsEditing(true)}>
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Box>
                    <IconButton onClick={handleSave} disabled={isLoading}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={handleCancel} disabled={isLoading}>
                      <CancelIcon />
                    </IconButton>
                  </Box>
                )
              }
            />
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                <Avatar
                  sx={{ width: 100, height: 100, mb: 2 }}
                  src={profile.avatar}
                >
                  {profile.firstName?.[0] || profile.username[0]}
                </Avatar>
                <Typography variant="h6">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.username
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.email}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label={t('profile.firstName', 'First Name')}
                value={profile.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
              <TextField
                fullWidth
                label={t('profile.lastName', 'Last Name')}
                value={profile.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
              <TextField
                fullWidth
                label={t('profile.phone', 'Phone Number')}
                value={profile.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title={t('profile.contactInfo', 'Contact Information')} />
            <CardContent>
              <TextField
                fullWidth
                label={t('profile.email', 'Email Address')}
                value={profile.email}
                disabled
                margin="normal"
                helperText={t('profile.emailHelper', 'Email cannot be changed')}
              />
              <TextField
                fullWidth
                label={t('profile.address', 'Address')}
                value={profile.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label={t('profile.city', 'City')}
                value={profile.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
              <TextField
                fullWidth
                label={t('profile.country', 'Country')}
                value={profile.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title={t('profile.preferences', 'Preferences')} />
            <CardContent>
              <TextField
                fullWidth
                select
                label={t('profile.language', 'Language')}
                value={profile.language || 'en'}
                onChange={(e) => handleInputChange('language', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="en">English</option>
                <option value="he">עברית</option>
              </TextField>

              <TextField
                fullWidth
                select
                label={t('profile.timezone', 'Timezone')}
                value={profile.timezone || ''}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                SelectProps={{
                  native: true,
                }}
              >
                <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </TextField>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                {t('profile.notifications', 'Notifications')}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {t('profile.emailNotifications', 'Email Notifications')}
                  </Typography>
                  <Button
                    variant={profile.notifications?.email ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleNotificationChange('email', !profile.notifications?.email)}
                    disabled={!isEditing}
                  >
                    {profile.notifications?.email ? 'On' : 'Off'}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {t('profile.taskReminders', 'Task Reminders')}
                  </Typography>
                  <Button
                    variant={profile.notifications?.taskReminders ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleNotificationChange('taskReminders', !profile.notifications?.taskReminders)}
                    disabled={!isEditing}
                  >
                    {profile.notifications?.taskReminders ? 'On' : 'Off'}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    {t('profile.vaccineReminders', 'Vaccine Reminders')}
                  </Typography>
                  <Button
                    variant={profile.notifications?.vaccineReminders ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleNotificationChange('vaccineReminders', !profile.notifications?.vaccineReminders)}
                    disabled={!isEditing}
                  >
                    {profile.notifications?.vaccineReminders ? 'On' : 'Off'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isEditing && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {t('common.save', 'Save')}
          </Button>
        </Box>
      )}
    </Box>
  );
};
