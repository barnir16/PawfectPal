import { useState } from 'react';
import { Box, Button, TextField, Grid, Avatar, IconButton, Typography } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { SettingsCard } from './SettingsCard';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
}

interface ProfileSettingsProps {
  profile: ProfileData;
  onSave: (data: ProfileData) => void;
}

export const ProfileSettings = ({ profile, onSave }: ProfileSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileData>({ ...profile });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setIsEditing(false);
  };

  return (
    <SettingsCard 
      title="Profile Information"
      subtitle="Update your personal information"
      action={
        !isEditing ? (
          <Button
            startIcon={<EditIcon />}
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
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" justifyContent="center">
            <Box position="relative">
              <Avatar 
                src={formData.avatar} 
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              {isEditing && (
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <input hidden accept="image/*" type="file" />
                  <EditIcon />
                </IconButton>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              multiline
              rows={2}
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </Grid>
        </Grid>
      </Box>
    </SettingsCard>
  );
};

export default ProfileSettings;
