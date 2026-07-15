import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Avatar,
} from "@mui/material";
import { useLocalization } from "../../contexts/LocalizationContext";
import {
  Dashboard as DashboardIcon,
  Pets as PetsIcon,
  Assignment as TasksIcon,
  EventAvailable as ServicesIcon,
  Search as FindIcon,
  ListAlt as ServiceRequestsIcon,
  Chat as ChatIcon,
  MonitorWeight as WeightIcon,
  Menu as MenuIcon,
  Store as MarketplaceIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  onDesktopToggle?: (open: boolean) => void;
};

const drawerWidth = 240;
const minimizedWidth = 68;

// Sidebar uses a warm charcoal — premium, grounding, high contrast
const SIDEBAR_BG = "#1C1917";
const SIDEBAR_TEXT = "rgba(255,255,255,0.82)";
const SIDEBAR_TEXT_MUTED = "rgba(255,255,255,0.38)";
const SIDEBAR_ACTIVE_BG = "rgba(244,162,97,0.18)";
const SIDEBAR_ACTIVE_COLOR = "#F4A261";
const SIDEBAR_HOVER_BG = "rgba(255,255,255,0.06)";

type NavItem = {
  text: string;
  icon: React.ReactNode;
  path: string;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const Sidebar = ({
  mobileOpen,
  onClose,
  onDesktopToggle,
}: SidebarProps) => {
  const theme = useTheme();
  const location = useLocation();
  const { t, isRTL } = useLocalization();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(!isMobile);
  const { user } = useAuth();
  const isProvider = user?.is_provider;

  const closeMobileDrawerSafely = () => {
    if (!isMobile) return;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    requestAnimationFrame(() => {
      onClose();
    });
  };

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          text: t("navigation.dashboard"),
          icon: <DashboardIcon fontSize="small" />,
          path: "/dashboard",
        },
      ],
    },
    {
      label: t("navigation.care"),
      items: [
        { text: t("navigation.pets"), icon: <PetsIcon fontSize="small" />, path: "/pets" },
        { text: t("navigation.tasks"), icon: <TasksIcon fontSize="small" />, path: "/tasks" },
        {
          text: t("navigation.weightTracking"),
          icon: <WeightIcon fontSize="small" />,
          path: "/weight-tracking",
        },
      ],
    },
    {
      label: t("navigation.services"),
      items: [
        {
          text: t("services.findProviders"),
          icon: <FindIcon fontSize="small" />,
          path: "/bookservice",
        },
        {
          text: t("services.manageBookings"),
          icon: <ServicesIcon fontSize="small" />,
          path: "/services",
        },
        {
          text: t("marketplace.requestBoard") || "Request Board",
          icon: <MarketplaceIcon fontSize="small" />,
          path: "/marketplace",
        },
        ...(isProvider
          ? [
              {
                text: t("services.providerRequestInbox"),
                icon: <ServiceRequestsIcon fontSize="small" />,
                path: "/service-requests",
              },
            ]
          : []),
      ],
    },
    {
      items: [
        { text: t("navigation.chat"), icon: <ChatIcon fontSize="small" />, path: "/chat-list" },
      ],
    },
  ];

  const handleDrawerToggle = () => {
    if (isMobile) {
      closeMobileDrawerSafely();
    } else {
      const newOpen = !open;
      setOpen(newOpen);
      onDesktopToggle?.(newOpen);
    }
  };

  const handleMobileClose = () => {
    closeMobileDrawerSafely();
  };

  const isActive = (path: string) => location.pathname === path;

  const renderNavItem = (item: NavItem) => (
    <ListItem key={item.path} disablePadding sx={{ display: "block", px: 1, py: "1px" }}>
      <ListItemButton
        component={RouterLink}
        to={item.path}
        selected={isActive(item.path)}
        onClick={isMobile ? handleMobileClose : undefined}
        title={!(open || isMobile) ? item.text : undefined}
        sx={{
          flexDirection: "row",
          minHeight: 40,
          borderRadius: "10px",
          px: (open || isMobile) ? 1.5 : 1,
          justifyContent: (open || isMobile) ? "flex-start" : "center",
          color: isActive(item.path) ? SIDEBAR_ACTIVE_COLOR : SIDEBAR_TEXT,
          backgroundColor: isActive(item.path) ? SIDEBAR_ACTIVE_BG : "transparent",
          "&:hover": {
            backgroundColor: isActive(item.path) ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
          },
          "&.Mui-selected": {
            backgroundColor: SIDEBAR_ACTIVE_BG,
            "&:hover": { backgroundColor: SIDEBAR_ACTIVE_BG },
          },
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: (open || isMobile) ? 34 : "auto",
            justifyContent: "center",
            color: isActive(item.path) ? SIDEBAR_ACTIVE_COLOR : SIDEBAR_TEXT,
          }}
        >
          {item.icon}
        </ListItemIcon>
        {(open || isMobile) && (
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: "0.85rem",
              fontWeight: isActive(item.path) ? 600 : 400,
              noWrap: true,
            }}
          />
        )}
        {isActive(item.path) && (open || isMobile) && (
          <Box
            sx={{
              width: 3,
              height: 20,
              borderRadius: 2,
              bgcolor: SIDEBAR_ACTIVE_COLOR,
              flexShrink: 0,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: SIDEBAR_BG,
      }}
    >
      {/* Logo / toggle */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: (open || isMobile) ? "space-between" : "center",
          minHeight: 56,
        }}
      >
        {(open || isMobile) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              🐾
            </Box>
            <Typography
              variant="h6"
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.01em",
              }}
            >
              PawfectPal
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={handleDrawerToggle}
          size="small"
          sx={{
            color: SIDEBAR_TEXT_MUTED,
            ml: (open || isMobile) ? 0 : "auto",
            mr: (open || isMobile) ? 0 : "auto",
            "&:hover": { color: SIDEBAR_TEXT, bgcolor: SIDEBAR_HOVER_BG },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Nav groups */}
      <List sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", pt: 0.5 }}>
        {navGroups.map((group, groupIdx) => (
          <Box key={groupIdx}>
            {/* Section label — only shown when expanded */}
            {group.label && (open || isMobile) && (
              <Typography
                variant="caption"
                sx={{
                  color: SIDEBAR_TEXT_MUTED,
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  px: 2.5,
                  pt: groupIdx === 0 ? 1 : 2,
                  pb: 0.5,
                  display: "block",
                  textAlign: isRTL ? "right" : "left",
                }}
              >
                {group.label}
              </Typography>
            )}
            {/* Divider between unlabeled groups */}
            {groupIdx > 0 && !group.label && (
              <Box sx={{ my: 1, mx: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }} />
            )}
            {group.items.map(renderNavItem)}
          </Box>
        ))}
      </List>

      {/* Footer — user identity */}
      {(open || isMobile) && user && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: "primary.main",
              fontSize: "0.75rem",
            }}
          >
            {(user.full_name?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
          </Avatar>
          <Typography
            variant="caption"
            sx={{ color: SIDEBAR_TEXT, fontWeight: 500 }}
            noWrap
          >
            {user.full_name || user.username}
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {/* Mobile drawer — temporary, slides in on small screens */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: SIDEBAR_BG,
            border: "none",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer — permanent, collapses to icon rail */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : minimizedWidth,
            boxSizing: "border-box",
            bgcolor: SIDEBAR_BG,
            border: "none",
            overflowX: "hidden",
            transition: "width 0.25s ease",
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
};
