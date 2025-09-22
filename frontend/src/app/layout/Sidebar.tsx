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
  Menu as MenuIcon,
} from "@mui/icons-material";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  onDesktopToggle?: (open: boolean) => void;
};

const drawerWidth = 240;
const minimizedWidth = 64;

export const Sidebar = ({ mobileOpen, onClose, onDesktopToggle }: SidebarProps) => {
  const theme = useTheme();
  const location = useLocation();
  const { t, isRTL } = useLocalization();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(!isMobile);

  const menuItems = [
    { text: t('navigation.dashboard'), icon: <DashboardIcon />, path: "/dashboard" },
    { text: t('navigation.pets'), icon: <PetsIcon />, path: "/pets" },
    { text: t('navigation.tasks'), icon: <TasksIcon />, path: "/tasks" },
    { text: t('services.title'), icon: <ServicesIcon />, path: "/services" },
    { text: t('services.bookService'), icon: <BookIcon />, path: "/bookservice" },
    { text: t('navigation.weightTracking'), icon: <PersonIcon />, path: "/weight-tracking" },
    { text: t('navigation.profile'), icon: <PersonIcon />, path: "/profile" },
    { text: t('navigation.settings'), icon: <SettingsIcon />, path: "/settings" },
  ];

  const handleDrawerToggle = () => {
    console.log('Drawer toggle clicked', { isMobile, open, isRTL });
    if (isMobile) {
      onClose();
    } else {
      const newOpen = !open;
      setOpen(newOpen);
      onDesktopToggle?.(newOpen);
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
        {open && (
          <Typography variant="h6" noWrap component="div">
            PawfectPal
          </Typography>
        )}
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            ml: open ? 0 : 'auto',
            mr: open ? 0 : 'auto'
          }}
        >
          <MenuIcon fontSize="small" />
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
              sx={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                minHeight: 48,
                px: open ? 2 : 1.5,
                justifyContent: open ? 'flex-start' : 'center',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
              title={!open ? item.text : undefined} // Show tooltip when minimized
            >
              <ListItemIcon 
                sx={{ 
                  minWidth: open ? 40 : 'auto',
                  justifyContent: 'center',
                  color: location.pathname === item.path ? 'primary.main' : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    textAlign: isRTL ? 'right' : 'left',
                    '& .MuiListItemText-primary': {
                      textAlign: isRTL ? 'right' : 'left',
                      color: location.pathname === item.path ? 'primary.main' : 'inherit'
                    }
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ 
        width: { sm: open ? drawerWidth : minimizedWidth }, 
        flexShrink: { sm: 0 },
        transition: 'width 0.3s ease'
      }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        anchor={isRTL ? "right" : "left"}
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
        variant="persistent"
        anchor={isRTL ? "right" : "left"}
        open={open}
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": { 
            boxSizing: "border-box", 
            width: open ? drawerWidth : minimizedWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflow: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};
