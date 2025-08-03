import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  ListItemIcon,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  CloudUpload as CloudUploadIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}

export const Settings = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Pet Ln, San Francisco, CA 94107",
    theme: "system",
    language: "en",
    notifications: {
      email: true,
      push: true,
      reminders: true,
      promotions: false,
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...(formData as any)[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleSave = () => {
    console.log("Saving settings:", formData);
    setIsEditing(false);
    // Add API call to save settings
  };

  const handleCancel = () => {
    // Reset form data to initial values
    // In a real app, you would fetch the current settings from your state/API
    setIsEditing(false);
  };

  const handleLogout = () => {
    // Handle logout logic
    console.log("Logging out...");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
        {isEditing ? (
          <Box>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              color="primary"
            >
              Save Changes
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          bgcolor: "background.paper",
          borderRadius: 1,
        }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Settings tabs"
          sx={{
            borderRight: 1,
            borderColor: "divider",
            minWidth: 200,
            "& .MuiTab-root": {
              alignItems: "flex-start",
              textTransform: "none",
              fontSize: "0.9rem",
              "&.Mui-selected": {
                color: theme.palette.primary.main,
                fontWeight: 500,
              },
            },
          }}
        >
          <Tab
            icon={<AccountIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Account"
            {...a11yProps(0)}
          />
          <Tab
            icon={<NotificationsIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Notifications"
            {...a11yProps(1)}
          />
          <Tab
            icon={<PaletteIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Appearance"
            {...a11yProps(2)}
          />
          <Tab
            icon={<SecurityIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Security"
            {...a11yProps(3)}
          />
          <Tab
            icon={<LanguageIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Language & Region"
            {...a11yProps(4)}
          />
          <Tab
            icon={<CloudUploadIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Backup & Sync"
            {...a11yProps(5)}
          />
          <Tab
            icon={<HelpIcon sx={{ mr: 1 }} />}
            iconPosition="start"
            label="Help & Support"
            {...a11yProps(6)}
          />
        </Tabs>

        <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
          <TabPanel value={tabValue} index={0}>
            <Card>
              <CardHeader title="Account Information" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      margin="normal"
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardHeader title="Danger Zone" />
              <Divider />
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1">Delete Account</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Permanently delete your account and all associated data
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => console.log("Delete account")}
                  >
                    Delete Account
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardHeader title="Notification Preferences" />
              <Divider />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive email notifications"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={formData.notifications.email}
                      onChange={handleInputChange}
                      name="notifications.email"
                      disabled={!isEditing}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Push Notifications"
                    secondary="Receive push notifications on this device"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={formData.notifications.push}
                      onChange={handleInputChange}
                      name="notifications.push"
                      disabled={!isEditing}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Reminders"
                    secondary="Get reminders for pet care tasks"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={formData.notifications.reminders}
                      onChange={handleInputChange}
                      name="notifications.reminders"
                      disabled={!isEditing}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Promotional Emails"
                    secondary="Receive promotional emails and updates"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={formData.notifications.promotions}
                      onChange={handleInputChange}
                      name="notifications.promotions"
                      disabled={!isEditing}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardHeader title="Appearance" />
              <Divider />
              <CardContent>
                <TextField
                  select
                  fullWidth
                  label="Theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="system">System Default</MenuItem>
                </TextField>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardHeader title="Security" />
              <Divider />
              <List>
                <ListItem>
                  <ListItemText
                    primary="Change Password"
                    secondary="Last changed 3 months ago"
                  />
                  <Button variant="outlined">Change</Button>
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add an extra layer of security"
                  />
                  <Button variant="outlined">Enable</Button>
                </ListItem>
              </List>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Card>
              <CardHeader title="Language & Region" />
              <Divider />
              <CardContent>
                <TextField
                  select
                  fullWidth
                  label="Language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Date Format"
                  name="dateFormat"
                  value="mm/dd/yyyy"
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                >
                  <MenuItem value="mm/dd/yyyy">MM/DD/YYYY</MenuItem>
                  <MenuItem value="dd/mm/yyyy">DD/MM/YYYY</MenuItem>
                  <MenuItem value="yyyy-mm-dd">YYYY-MM-DD</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Time Format"
                  name="timeFormat"
                  value="12h"
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  margin="normal"
                >
                  <MenuItem value="12h">12-hour (2:30 PM)</MenuItem>
                  <MenuItem value="24h">24-hour (14:30)</MenuItem>
                </TextField>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <Card>
              <CardHeader title="Backup & Sync" />
              <Divider />
              <CardContent>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  Backup Now
                </Button>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Last backup: {new Date().toLocaleString()}
                </Typography>
                <FormControlLabel
                  control={<Switch />}
                  label="Enable automatic backups"
                />
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={6}>
            <Card>
              <CardHeader title="Help & Support" />
              <Divider />
              <List>
                <ListItem button>
                  <ListItemText primary="Help Center" />
                </ListItem>
                <Divider component="li" />
                <ListItem button>
                  <ListItemText primary="Contact Support" />
                </ListItem>
                <Divider component="li" />
                <ListItem button>
                  <ListItemText primary="Terms of Service" />
                </ListItem>
                <Divider component="li" />
                <ListItem button>
                  <ListItemText primary="Privacy Policy" />
                </ListItem>
                <Divider component="li" />
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{ color: "error" }}
                  />
                </ListItem>
              </List>
            </Card>
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
