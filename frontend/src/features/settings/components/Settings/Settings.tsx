import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";
import { useAuth } from "../../../../contexts/AuthContext";
import SettingsSidebar from "../../../../components/settings/SettingsSidebar";
import ProfileSettings from "../../../../components/settings/ProfileSettings";
import NotificationSettings from "../../../../components/settings/NotificationSettings";
import AppearanceSettings from "../../../../components/settings/AppearanceSettings";
import AccountSettings from "../../../../components/settings/AccountSettings";
type ThemePreference = "light" | "dark" | "system";
type Language = "en" | "es" | "fr" | "de";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  reminders: boolean;
  promotions: boolean;
}

const Settings = () => {
  const { logout, forceLogout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    address: "123 Pet Ln, San Francisco, CA 94107",
    avatar: "https://i.pravatar.cc/300",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    reminders: true,
    promotions: false,
  });

  const [appearance, setAppearance] = useState({
    theme: "system" as ThemePreference,
    language: "en" as Language,
  });

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProfileSave = async (updatedProfile: UserProfile) => {
    // In a real app, you would make an API call here
    console.log("Saving profile:", updatedProfile);
    setProfile(updatedProfile);
    return true;
  };

  const handleNotificationsSave = async (
    updatedNotifications: NotificationSettings
  ) => {
    // In a real app, you would make an API call here
    console.log("Saving notifications:", updatedNotifications);
    setNotifications(updatedNotifications);
    return true;
  };

  const handleAppearanceSave = async (updatedAppearance: {
    theme: ThemePreference;
    language: Language;
  }) => {
    // In a real app, you would make an API call here
    console.log("Saving appearance:", updatedAppearance);
    setAppearance(updatedAppearance);
    // Here you would also apply the theme
    return true;
  };

  const handlePasswordChange = async (
    _currentPassword: string,
    _newPassword: string
  ) => {
    // In a real app, you would make an API call here
    console.log("Changing password");
    // Simulate API call
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  };

  const handleAccountDelete = () => {
    // In a real app, you would show a confirmation dialog first
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      console.log("Deleting account");
      // Handle account deletion
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      await forceLogout("Logout failed. Please try logging in again.");
      navigate("/auth");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
        <SettingsSidebar
          value={activeTab}
          onChange={handleTabChange}
          onLogout={handleLogout}
        />

        <Box flexGrow={1}>
          <Typography variant="h4" component="h1" gutterBottom>
            Settings
          </Typography>

          <Box sx={{ display: activeTab === 0 ? "block" : "none" }}>
            <ProfileSettings profile={profile} onSave={handleProfileSave} />
          </Box>

          <Box sx={{ display: activeTab === 1 ? "block" : "none" }}>
            <NotificationSettings
              settings={notifications}
              onSave={handleNotificationsSave}
            />
          </Box>

          <Box sx={{ display: activeTab === 2 ? "block" : "none" }}>
            <AppearanceSettings
              theme={appearance.theme}
              language={appearance.language}
              onSave={handleAppearanceSave}
            />
          </Box>

          <Box sx={{ display: activeTab === 3 ? "block" : "none" }}>
            <AccountSettings
              onPasswordChange={handlePasswordChange}
              onAccountDelete={handleAccountDelete}
            />
          </Box>

          {/* Help & Support tab */}
          <Box sx={{ display: activeTab === 4 ? "block" : "none", mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Help & Support
            </Typography>
            <Typography paragraph>
              If you need assistance, please contact our support team at
              support@pawfectpal.com or call us at (555) 123-4567.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;
