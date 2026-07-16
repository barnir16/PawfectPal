import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
  Chip,
} from "@mui/material";
import {
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Pets as PetsIcon,
  Settings as SettingsIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import { useLocalization } from "../../../../contexts/LocalizationContext";
import { LanguageSwitcher } from "../../../../components/common/LanguageSwitcher";
import { useTheme as useAppTheme } from "../../../../contexts/ThemeContext";

/**
 * Preferences stored in localStorage.
 * Dark mode is excluded here — it's owned by ThemeContext and persisted
 * to 'pawfectPal_theme'. Everything else lives in 'pawfectPal_preferences'.
 */
interface EmergencyContactEntry {
  name: string;
  phone: string;
}

interface StoredPreferences {
  notifications: boolean;
  emailAlerts: boolean;
  reminderFrequency: "daily" | "weekly" | "monthly";
  emergencyContacts: {
    primaryVet: EmergencyContactEntry;
    emergencyVet: EmergencyContactEntry;
    petSitter: EmergencyContactEntry;
  };
  privacySettings: {
    shareData: boolean;
    locationTracking: boolean;
  };
}

const EMPTY_CONTACT: EmergencyContactEntry = { name: "", phone: "" };

/**
 * Older saved preferences stored each emergency contact as a single free-text
 * string (e.g. "Dr. Smith - (555) 123-4567"). Migrate those into the
 * structured {name, phone} shape so existing users don't lose their data.
 */
function migrateContact(value: unknown): EmergencyContactEntry {
  if (value && typeof value === "object" && "name" in (value as object)) {
    const entry = value as Partial<EmergencyContactEntry>;
    return { name: entry.name || "", phone: entry.phone || "" };
  }
  if (typeof value === "string" && value.trim()) {
    // Best-effort split on a trailing " - phone" pattern; otherwise keep the
    // whole legacy string as the name so nothing is silently dropped.
    const match = value.match(/^(.*?)[\s-]*([\d()+\-\s]{7,})$/);
    if (match) {
      return { name: match[1].trim(), phone: match[2].trim() };
    }
    return { name: value.trim(), phone: "" };
  }
  return { ...EMPTY_CONTACT };
}

const DEFAULT_PREFS: StoredPreferences = {
  notifications: true,
  emailAlerts: true,
  reminderFrequency: "weekly",
  emergencyContacts: {
    primaryVet: { ...EMPTY_CONTACT },
    emergencyVet: { ...EMPTY_CONTACT },
    petSitter: { ...EMPTY_CONTACT },
  },
  privacySettings: { shareData: false, locationTracking: false },
};

const PREFS_KEY = "pawfectPal_preferences";

const Settings: React.FC = () => {
  // Dark mode is owned entirely by ThemeContext — no duplicate state here.
  const { mode, setTheme } = useAppTheme();
  const { t, currentLanguage, isRTL } = useLocalization();

  const [prefs, setPrefs] = useState<StoredPreferences>(DEFAULT_PREFS);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load persisted preferences once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.emergencyContacts) {
          parsed.emergencyContacts = {
            primaryVet: migrateContact(parsed.emergencyContacts.primaryVet),
            emergencyVet: migrateContact(parsed.emergencyContacts.emergencyVet),
            petSitter: migrateContact(parsed.emergencyContacts.petSitter),
          };
        }
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      /* ignore parse errors, keep defaults */
    }
  }, []);

  // Persist preferences to localStorage (synchronous — no fake delay needed)
  const savePrefs = (next: StoredPreferences) => {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const updatePref = <K extends keyof StoredPreferences>(key: K, value: StoredPreferences[K]) => {
    savePrefs({ ...prefs, [key]: value });
  };

  const updateContact = (
    key: keyof StoredPreferences["emergencyContacts"],
    field: keyof EmergencyContactEntry,
    value: string
  ) => {
    savePrefs({
      ...prefs,
      emergencyContacts: {
        ...prefs.emergencyContacts,
        [key]: { ...prefs.emergencyContacts[key], [field]: value },
      },
    });
  };

  const updatePrivacy = (key: keyof StoredPreferences["privacySettings"], value: boolean) => {
    savePrefs({ ...prefs, privacySettings: { ...prefs.privacySettings, [key]: value } });
  };

  const isDark = mode === "dark";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <SettingsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          {t("settings.title")}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("pets.customizeExperience")}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Language */}
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

        {/* Theme */}
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

              {/* Toggle with icons — reads directly from ThemeContext mode */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LightModeIcon color={isDark ? "disabled" : "warning"} />
                <Switch
                  checked={isDark}
                  onChange={() => setTheme(isDark ? "light" : "dark")}
                  color="primary"
                />
                <DarkModeIcon color={isDark ? "primary" : "disabled"} />
                <Typography variant="body2" color="text.secondary">
                  {isDark ? t("settings.darkMode") : t("settings.lightMode")}
                </Typography>
              </Box>

              <Typography variant="caption" display="block" sx={{ mt: 1, color: "text.secondary" }}>
                {isDark ? t("pets.darkThemeBenefits") : t("pets.lightThemeBenefits")}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification preferences — simple local toggles */}
        {/* Push notifications require a service worker + VAPID backend not yet set up. */}
        {/* For now we store the user's intent in localStorage. */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6">{t("settings.notifications")}</Typography>
                </Box>
              }
              sx={{
                flexWrap: 'wrap',
                '& .MuiCardHeader-action': { m: 0, alignSelf: 'center' },
              }}
              action={
                <Chip
                  label={t('settings.comingSoon') || 'Coming soon'}
                  size="small"
                  variant="outlined"
                  color="default"
                  sx={{ ml: isRTL ? 0 : 1, mr: isRTL ? 1 : 0 }}
                />
              }
            />
            <CardContent>
              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon>
                    <NotificationsIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("settings.appNotifications")}
                    secondary={t("settings.appNotificationsDesc")}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={prefs.notifications}
                      onChange={(e) => updatePref("notifications", e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem disableGutters>
                  <ListItemIcon>
                    <NotificationsIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("settings.emailAlerts")}
                    secondary={t("settings.emailAlertsDesc")}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={prefs.emailAlerts}
                      onChange={(e) => updatePref("emailAlerts", e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem disableGutters>
                  <ListItemIcon>
                    <PetsIcon fontSize="small" color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("settings.reminderFrequency")}
                    secondary={t("settings.reminderFrequencyDesc")}
                  />
                  <ListItemSecondaryAction>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select
                        value={prefs.reminderFrequency}
                        onChange={(e: SelectChangeEvent) =>
                          updatePref(
                            "reminderFrequency",
                            e.target.value as "daily" | "weekly" | "monthly"
                          )
                        }
                      >
                        <MenuItem value="daily">{t("settings.daily")}</MenuItem>
                        <MenuItem value="weekly">{t("settings.weekly")}</MenuItem>
                        <MenuItem value="monthly">{t("settings.monthly")}</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
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

              <List disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon>
                    <PetsIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("pets.sharePetData")}
                    secondary={t("pets.allowSharing")}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={prefs.privacySettings.shareData}
                      onChange={(e) => updatePrivacy("shareData", e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem disableGutters>
                  <ListItemIcon>
                    <LocationIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t("pets.locationTracking")}
                    secondary={t("pets.allowGPS")}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={prefs.privacySettings.locationTracking}
                      onChange={(e) => updatePrivacy("locationTracking", e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="outlined" size="small">
                  {t("pets.privacyPolicy")}
                </Button>
                <Button variant="outlined" size="small">
                  {t("pets.dataExport")}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contacts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PhoneIcon color="primary" />
                  <Typography variant="h6">{t("pets.emergencyContacts")}</Typography>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("pets.storeContacts")}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("pets.primaryVet")}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 1.5, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.contactName")}
                  value={prefs.emergencyContacts.primaryVet.name}
                  onChange={(e) => updateContact("primaryVet", "name", e.target.value)}
                  placeholder={t("settings.primaryVetNamePlaceholder")}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.contactPhone")}
                  value={prefs.emergencyContacts.primaryVet.phone}
                  onChange={(e) => updateContact("primaryVet", "phone", e.target.value)}
                  placeholder={t("settings.phonePlaceholder")}
                />
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("pets.emergencyVet")}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 1.5, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.contactName")}
                  value={prefs.emergencyContacts.emergencyVet.name}
                  onChange={(e) => updateContact("emergencyVet", "name", e.target.value)}
                  placeholder={t("settings.emergencyVetNamePlaceholder")}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.contactPhone")}
                  value={prefs.emergencyContacts.emergencyVet.phone}
                  onChange={(e) => updateContact("emergencyVet", "phone", e.target.value)}
                  placeholder={t("settings.phonePlaceholder")}
                />
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("pets.petSitter")}
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.contactName")}
                  value={prefs.emergencyContacts.petSitter.name}
                  onChange={(e) => updateContact("petSitter", "name", e.target.value)}
                  placeholder={t("settings.petSitterNamePlaceholder")}
                />
                <TextField
                  fullWidth
                  size="small"
                  label={t("settings.contactPhone")}
                  value={prefs.emergencyContacts.petSitter.phone}
                  onChange={(e) => updateContact("petSitter", "phone", e.target.value)}
                  placeholder={t("settings.phonePlaceholder")}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* About */}
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
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("pets.version")}: 1.0.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("pets.builtWith")} React & FastAPI
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button variant="outlined" size="small">
                  {t("pets.helpSupport")}
                </Button>
                <Button variant="outlined" size="small">
                  {t("pets.aboutPawfectPal")}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Auto-save toast */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={2000}
        onClose={() => setSaveSuccess(false)}
        message={t("pets.changesSaved")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
};

export default Settings;
