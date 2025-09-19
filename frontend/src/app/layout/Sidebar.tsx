import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { useLocalization } from "../../contexts/LocalizationContext";
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Assignment as TasksIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  EventAvailable as ServicesIcon,
  PostAdd as BookIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const drawerWidth = 240;

export const Sidebar = ({ mobileOpen, onClose }: SidebarProps) => {
  const theme = useTheme();
  const location = useLocation();
  const { t } = useLocalization();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(!isMobile);

  const menuItems = [
    {
      text: t("navigation.dashboard"),
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    { text: t("navigation.pets"), icon: <PetsIcon />, path: "/pets" },
    { text: t("navigation.tasks"), icon: <TasksIcon />, path: "/tasks" },
    { text: t("services.title"), icon: <ServicesIcon />, path: "/services" },
    {
      text: t("services.bookService"),
      icon: <BookIcon />,
      path: "/bookservice",
    },
    {
      text: t("navigation.weightTracking"),
      icon: <PersonIcon />,
      path: "/weight-tracking",
    },
    { text: t("navigation.profile"), icon: <PersonIcon />, path: "/profile" },
    {
      text: t("navigation.settings"),
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  const handleDrawerToggle = () => {
    if (isMobile) {
      onClose();
    } else {
      setOpen(!open);
    }
  };

  const drawer = (
    <div>
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" noWrap component="div">
          PawfectPal
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          {theme.direction === "rtl" ? (
            <ChevronRightIcon />
          ) : (
            <ChevronLeftIcon />
          )}
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={onClose}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
        open={open}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};
