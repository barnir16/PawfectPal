import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Alert,
  useTheme,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Pets as PetsIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { useLocalization } from "../../../../contexts/LocalizationContext";
import { LanguageSwitcher } from "../../../../components/common/LanguageSwitcher";
import { PushNotificationManager } from "../../../../components/notifications/PushNotificationManager";
import { useAuth } from "../../../../contexts/AuthContext";
import { useTheme as useCustomTheme } from "../../../../contexts/ThemeContext";

interface UserPreferences {
  darkMode: boolean;
  notifications: boolean;
  emailAlerts: boolean;
  pushNotifications: boolean;
  reminderFrequency: "daily" | "weekly" | "monthly";
  emergencyContacts: {
    primaryVet: string;
    emergencyVet: string;
    petSitter: string;
  };
  privacySettings: {
    shareData: boolean;
    allowNotifications: boolean;
    locationTracking: boolean;
  };
}

const Settings: React.FC = () => {
  const muiTheme = useCustomTheme();
  const { t, currentLanguage } = useLocalization();
  const { user } = useAuth();

  const [preferences, setPreferences] = useState<UserPreferences>({
    darkMode: false,
    notifications: true,
    emailAlerts: true,
    pushNotifications: true,
    reminderFrequency: "weekly",
    emergencyContacts: {
      primaryVet: "",
      emergencyVet: "",
      petSitter: "",
    },
    privacySettings: {
      shareData: false,
      allowNotifications: true,
      locationTracking: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load user preferences from localStorage or API
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const saved = localStorage.getItem("pawfectPal_preferences");
        if (saved) {
          const parsed = JSON.parse(saved);
          setPreferences(parsed);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Sync theme with preferences
  useEffect(() => {
    const savedMode = localStorage.getItem("pawfectPal_theme") as
      | "light"
      | "dark";
    if (savedMode && savedMode !== (preferences.darkMode ? "dark" : "light")) {
      setPreferences((prev) => ({
        ...prev,
        darkMode: savedMode === "dark",
      }));
    }
  }, [preferences.darkMode]);

  // Check for changes
  useEffect(() => {
    const saved = localStorage.getItem("pawfectPal_preferences");
    if (saved) {
      const parsed = JSON.parse(saved);
      setHasChanges(JSON.stringify(parsed) !== JSON.stringify(preferences));
    } else {
      setHasChanges(true);
    }
  }, [preferences]);

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmergencyContactChange = (
    key: keyof UserPreferences["emergencyContacts"],
    value: string
  ) => {
    setPreferences((prev) => ({
      ...prev,
      emergencyContacts: { ...prev.emergencyContacts, [key]: value },
    }));
  };

  const handlePrivacySettingChange = (
    key: keyof UserPreferences["privacySettings"],
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      privacySettings: { ...prev.privacySettings, [key]: value },
    }));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage
      localStorage.setItem(
        "pawfectPal_preferences",
        JSON.stringify(preferences)
      );

      setSaveSuccess(true);
      setHasChanges(false);

      // Show success message
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !preferences.darkMode;
    handlePreferenceChange("darkMode", newDarkMode);
    muiTheme.setTheme(newDarkMode ? "dark" : "light");
  };

  const handleNotificationsToggle = () => {
    handlePreferenceChange("notifications", !preferences.notifications);
  };

  const handleEmailAlertsToggle = () => {
    handlePreferenceChange("emailAlerts", !preferences.emailAlerts);
  };

  const handlePushNotificationsToggle = () => {
    handlePreferenceChange("pushNotifications", !preferences.pushNotifications);
  };

  const handleReminderFrequencyChange = (event: SelectChangeEvent) => {
    handlePreferenceChange(
      "reminderFrequency",
      event.target.value as "daily" | "weekly" | "monthly"
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SettingsIcon sx={{ mr: 2, verticalAlign: "middle" }} />
          {t("settings.title")}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("pets.customizeExperience")}
        </Typography>
      </Box>

      {/* Save Button */}
      {hasChanges && (
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={
              isLoading ? <CircularProgress size={20} /> : <SaveIcon />
            }
            onClick={handleSavePreferences}
            disabled={isLoading}
          >
            {isLoading ? t("pets.saving") : t("pets.saveChanges")}
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Language Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LanguageIcon color="primary" />
                  <Typography variant="h6">{t("settings.language")}</Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("pets.chooseLanguage")}
              </Typography>
              <LanguageSwitcher variant="button" showLabel={true} />
              <Alert severity="info" sx={{ mt: 2 }}>
                {t("pets.currentLanguage")}{" "}
                {currentLanguage === "en" ? "English" : "עברית"}
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Theme Settings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PaletteIcon color="primary" />
                  <Typography variant="h6">{t("settings.theme")}</Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("pets.customizeAppearance")}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.darkMode}
                    onChange={handleDarkModeToggle}
                    color="primary"
                  />
                }
                label={
                  preferences.darkMode
                    ? t("settings.darkMode")
                    : t("settings.lightMode")
                }
              />
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                {preferences.darkMode
                  ? t("pets.darkThemeBenefits")
                  : t("pets.lightThemeBenefits")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid size={{ xs: 12 }}>
          <PushNotificationManager />
        </Grid>

        {/* Emergency Contacts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon color="primary" />
                  <Typography variant="h6">
                    {t("pets.emergencyContacts")}
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("pets.storeContacts")}
              </Typography>

              <TextField
                fullWidth
                label={t("pets.primaryVet")}
                value={preferences.emergencyContacts.primaryVet}
                onChange={(e) =>
                  handleEmergencyContactChange("primaryVet", e.target.value)
                }
                placeholder={t("settings.primaryVetPlaceholder")}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                      <PhoneIcon color="action" fontSize="small" />
                    </Box>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={t("pets.emergencyVet")}
                value={preferences.emergencyContacts.emergencyVet}
                onChange={(e) =>
                  handleEmergencyContactChange("emergencyVet", e.target.value)
                }
                placeholder={t("settings.emergencyVetPlaceholder")}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                      <PhoneIcon color="action" fontSize="small" />
                    </Box>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={t("pets.petSitter")}
                value={preferences.emergencyContacts.petSitter}
                onChange={(e) =>
                  handleEmergencyContactChange("petSitter", e.target.value)
                }
                placeholder={t("settings.petSitterPlaceholder")}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                      <PhoneIcon color="action" fontSize="small" />
                    </Box>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Security */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">{t("settings.privacy")}</Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("pets.managePrivacy")}
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <PetsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("pets.sharePetData")}
                    secondary={t("pets.allowSharing")}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={preferences.privacySettings.shareData}
                      onChange={(e) =>
                        handlePrivacySettingChange(
                          "shareData",
                          e.target.checked
                        )
                      }
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("pets.locationTracking")}
                    secondary={t("pets.allowGPS")}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={preferences.privacySettings.locationTracking}
                      onChange={(e) =>
                        handlePrivacySettingChange(
                          "locationTracking",
                          e.target.checked
                        )
                      }
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Box sx={{ mt: 2 }}>
                <Button variant="outlined" color="primary" sx={{ mr: 1 }}>
                  {t("pets.privacyPolicy")}
                </Button>
                <Button variant="outlined" color="primary">
                  {t("pets.dataExport")}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* About & Support */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6">{t("settings.about")}</Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("pets.learnMore")}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {t("pets.version")}: 1.0.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("pets.builtWith")} React and FastAPI
                </Typography>
              </Box>

              <Button variant="outlined" color="primary" sx={{ mr: 1 }}>
                {t("pets.helpSupport")}
              </Button>
              <Button variant="outlined" color="primary">
                {t("pets.aboutPawfectPal")}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        message={t("pets.saveChanges")}
      />
    </Container>
  );
};

export default Settings;
