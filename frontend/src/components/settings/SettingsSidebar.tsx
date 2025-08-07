import { Tabs, Tab, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

interface SettingsSidebarProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  onLogout: () => void;
}

const settingsTabs = [
  { label: 'Profile', icon: <AccountIcon />, index: 0 },
  { label: 'Notifications', icon: <NotificationsIcon />, index: 1 },
  { label: 'Appearance', icon: <PaletteIcon />, index: 2 },
  { label: 'Security', icon: <SecurityIcon />, index: 3 },
  { label: 'Help & Support', icon: <HelpIcon />, index: 4 },
];

export const SettingsSidebar = ({ value, onChange, onLogout }: SettingsSidebarProps) => {
  return (
    <Box sx={{ width: 250, flexShrink: 0, bgcolor: 'background.paper' }}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={onChange}
        aria-label="Settings navigation"
        sx={{ borderRight: 1, borderColor: 'divider' }}
      >
        {settingsTabs.map((tab) => (
          <Tab
            key={tab.index}
            icon={tab.icon}
            iconPosition="start"
            label={tab.label}
            sx={{
              minHeight: 56,
              justifyContent: 'flex-start',
              '&.Mui-selected': {
                backgroundColor: 'action.selected',
              },
            }}
          />
        ))}
      </Tabs>
      
      <List sx={{ mt: 'auto', borderTop: 1, borderColor: 'divider' }}>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout}>
            <ListItemIcon>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText 
              primary={<Typography color="error">Logout</Typography>} 
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default SettingsSidebar;
