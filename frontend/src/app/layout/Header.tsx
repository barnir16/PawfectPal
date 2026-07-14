import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Button,
} from "@mui/material";
import { Person as PersonIcon, Menu as MenuIcon } from "@mui/icons-material";

import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../../components/common/LanguageSwitcher";
import { useLocalization } from "../../contexts/LocalizationContext";

type HeaderProps = {
  onMenuClick: () => void;
  desktopOpen?: boolean;
};

export const Header = ({ onMenuClick, desktopOpen = true }: HeaderProps) => {
  const { user, logout, forceLogout } = useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useLocalization();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const displayName = user?.full_name?.trim() || user?.username || "User";
  const avatarSource = user?.profile_image || user?.profile_picture_url || undefined;
  const avatarFallback = displayName.charAt(0).toUpperCase() || "U";

  const handleAccountClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout if regular logout fails
      await forceLogout(t("auth.logoutFailed"));
      navigate("/auth");
    }
    handleClose();
  };

  const handleAccountSettings = () => {
    navigate("/settings");
    handleClose();
  };

  const handleToggleProvider = () => {
    // Navigate to provider setup page instead of immediately making them a provider
    navigate('/provider-profile-setup');
  };

  const open = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: desktopOpen ? `calc(100% - 240px)` : `calc(100% - 68px)` },
        ml: { sm: isRTL ? "0px" : desktopOpen ? "240px" : "68px" },
        mr: { sm: isRTL ? (desktopOpen ? "240px" : "68px") : "0px" },
        boxShadow: "none",
        bgcolor: "#fff",
        color: "text.primary",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        transition: "width 0.25s ease, margin 0.25s ease",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge={isRTL ? "end" : "start"}
          onClick={onMenuClick}
          sx={{
            mr: isRTL ? 0 : 2,
            ml: isRTL ? 2 : 0,
            display: { sm: "none" },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexDirection: isRTL ? "row-reverse" : "row",
          }}
        >
          {!user?.is_provider && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleToggleProvider()}
              sx={{
                borderColor: "primary.main",
                color: "primary.dark",
                fontWeight: 600,
                fontSize: "0.78rem",
                borderRadius: 50,
                px: 2,
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "#fff",
                  borderColor: "primary.main",
                },
                transition: "all 0.2s ease",
              }}
            >
              {t("services.becomeProvider")}
            </Button>
          )}

          <LanguageSwitcher variant="compact" />

          <IconButton
            size="small"
            aria-label="account of current user"
            onClick={handleAccountClick}
            sx={{ p: 0.5 }}
          >
            <Avatar
              src={avatarSource}
              sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: "0.9rem" }}
            >
              {avatarFallback}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem
              onClick={() => {
                navigate("/profile");
                handleClose();
              }}
            >
              <PersonIcon sx={{ mr: 1 }} />
              {t("navigation.profile")}
            </MenuItem>
            <MenuItem onClick={handleAccountSettings}>
              <SettingsIcon sx={{ mr: 1 }} />
              {t("navigation.settings")}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              {t("auth.logout")}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
