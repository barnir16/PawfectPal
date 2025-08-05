import { useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography, Grid } from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { SettingsCard } from './SettingsCard';

type ThemePreference = 'light' | 'dark' | 'system';
type Language = 'en' | 'es' | 'fr' | 'de';

interface AppearanceSettingsProps {
  theme: ThemePreference;
  language: Language;
  onSave: (settings: { theme: ThemePreference; language: Language }) => void;
}

export const AppearanceSettings = ({ theme, language, onSave }: AppearanceSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  const handleSave = () => {
    onSave({ theme: currentTheme, language: currentLanguage });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentTheme(theme);
    setCurrentLanguage(language);
    setIsEditing(false);
  };

  return (
    <SettingsCard 
      title="Appearance"
      subtitle="Customize the look and feel"
      action={
        !isEditing ? (
          <Button startIcon={<SaveIcon />} onClick={() => setIsEditing(true)} variant="outlined">
            Edit
          </Button>
        ) : (
          <Box display="flex" gap={1}>
            <Button startIcon={<CancelIcon />} onClick={handleCancel} variant="outlined">
              Cancel
            </Button>
            <Button startIcon={<SaveIcon />} onClick={handleSave} variant="contained">
              Save
            </Button>
          </Box>
        )
      }
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Theme</InputLabel>
            <Select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value as ThemePreference)}
              label="Theme"
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System Default</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Language</InputLabel>
            <Select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value as Language)}
              label="Language"
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </SettingsCard>
  );
};

export default AppearanceSettings;
