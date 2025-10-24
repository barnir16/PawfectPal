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
import { getBaseUrl, getToken } from "../../services/api";

type HeaderProps = {
  onMenuClick: () => void;
  desktopOpen?: boolean;
};

export const Header = ({ onMenuClick, desktopOpen = true }: HeaderProps) => {
  const { user, setUser, logout, forceLogout } = useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useLocalization();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        width: { sm: desktopOpen ? `calc(100% - 240px)` : `calc(100% - 64px)` },
        ml: { sm: isRTL ? "0px" : desktopOpen ? "240px" : "64px" },
        mr: { sm: isRTL ? (desktopOpen ? "240px" : "64px") : "0px" },
        boxShadow: "none",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        transition: "width 0.3s ease, margin 0.3s ease",
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
          <Typography
            variant="body2"
            sx={{
              color: "inherit",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            {user?.username || "User"}
          </Typography>

          {/* Debug info */}
          <Typography
            variant="caption"
            sx={{
              color: "inherit",
              fontSize: "10px",
              textAlign: isRTL ? "right" : "left",
            }}
          >
            Provider: {user?.is_provider ? "Yes" : "No"}
          </Typography>

          {!user?.is_provider && (
            <Button
              color="inherit"
              variant="contained"
              size="small"
              onClick={() => handleToggleProvider()}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              {t("services.becomeProvider")}
            </Button>
          )}

          <LanguageSwitcher variant="compact" />

          <IconButton
            size="large"
            aria-label="account of current user"
            color="inherit"
            onClick={handleAccountClick}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.dark" }}>
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
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
