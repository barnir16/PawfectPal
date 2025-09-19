import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Language as LanguageIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';

interface LanguageSwitcherProps {
  variant?: 'button' | 'icon' | 'compact';
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'button',
  showLabel = true,
}) => {
  const theme = useTheme();
  const { currentLanguage, setLanguage, getSupportedLanguages } = useLocalization();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLanguageChange = (language: string) => {
    setLanguage(language as 'en' | 'he');
    setAnchorEl(null);
    setIsOpen(false);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setIsOpen(true);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsOpen(false);
  };

  const supportedLanguages = getSupportedLanguages();
  const currentLangInfo = supportedLanguages.find(lang => lang.code === currentLanguage);

  if (variant === 'icon') {
    return (
      <Box>
        <IconButton
          onClick={handleClick}
          sx={{ color: theme.palette.text.primary }}
          aria-label="Change language"
        >
          <LanguageIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={isOpen}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === currentLanguage}
            >
              <ListItemIcon>
                <Typography variant="h6">{language.flag}</Typography>
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">{language.name}</Typography>
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box>
        <Button
          onClick={handleClick}
          startIcon={<TranslateIcon />}
          size="small"
          variant="outlined"
          sx={{ 
            minWidth: 'auto', 
            px: 1,
            color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary,
            borderColor: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.divider,
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.primary.main,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          {currentLangInfo?.flag}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={isOpen}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === currentLanguage}
            >
              <ListItemIcon>
                <Typography variant="h6">{language.flag}</Typography>
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">{language.name}</Typography>
              </ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  // Default button variant
  return (
    <Box>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        variant="outlined"
        size="medium"
        sx={{ minWidth: 120 }}
      >
        {showLabel && (
          <Typography variant="body2" sx={{ mr: 1 }}>
            {currentLangInfo?.name}
          </Typography>
        )}
        {currentLangInfo?.flag}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === currentLanguage}
          >
            <ListItemIcon>
              <Typography variant="h6">{language.flag}</Typography>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">{language.name}</Typography>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
