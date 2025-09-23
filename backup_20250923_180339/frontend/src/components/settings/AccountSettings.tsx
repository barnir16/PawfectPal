import { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Divider } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, Lock as LockIcon } from '@mui/icons-material';
import { SettingsCard } from './SettingsCard';

interface AccountSettingsProps {
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<boolean>;
  onAccountDelete: () => void;
}

export const AccountSettings = ({ onPasswordChange, onAccountDelete }: AccountSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const success = await onPasswordChange(currentPassword, newPassword);
    if (success) {
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsEditing(false);
      setError('');
    } else {
      setError('Current password is incorrect');
    }
  };

  const handleCancel = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setIsEditing(false);
  };

  return (
    <SettingsCard 
      title="Account Settings"
      subtitle="Manage your account security"
      action={
        !isEditing ? (
          <Button 
            startIcon={<LockIcon />} 
            onClick={() => setIsEditing(true)}
            variant="outlined"
          >
            Change Password
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
              onClick={handleSave}
              variant="contained"
              color="primary"
            >
              Save Changes
            </Button>
          </Box>
        )
      }
    >
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {isEditing ? (
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            margin="normal"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Use this section to update your account password or manage your account settings.
        </Typography>
      )}

      <Divider sx={{ my: 4 }} />
      
      <Box>
        <Typography variant="h6" color="error" gutterBottom>
          Danger Zone
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Deleting your account will permanently remove all your data from our servers. 
          This action cannot be undone.
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={onAccountDelete}
        >
          Delete My Account
        </Button>
      </Box>
    </SettingsCard>
  );
};

export default AccountSettings;
