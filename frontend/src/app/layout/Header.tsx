import { AppBar, IconButton, Toolbar, Box, Menu, MenuItem, Typography, Avatar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "../../components/common/LanguageSwitcher";
import { useLocalization } from "../../contexts/LocalizationContext";

type HeaderProps = {
  onMenuClick: () => void;
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout, forceLogout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLocalization();
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
      await forceLogout("Logout failed. Please try logging in again.");
      navigate("/auth");
    }
    handleClose();
  };

  const handleAccountSettings = () => {
    navigate("/settings");
    handleClose();
  };

  const open = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: "240px" },
        boxShadow: "none",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'inherit' }}>
            {user?.username || 'User'}
          </Typography>
          <LanguageSwitcher variant="compact" />
          <IconButton
            size="large"
            aria-label="account of current user"
            color="inherit"
            onClick={handleAccountClick}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleAccountSettings}>
              <SettingsIcon sx={{ mr: 1 }} />
              {t('navigation.settings')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              {t('navigation.logout')}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
