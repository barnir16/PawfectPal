import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Reply,
  MoreVert,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { ChatMessage } from '../../types/services/chat';

interface ReplyButtonProps {
  message: ChatMessage;
  onReply: (message: ChatMessage) => void;
  onReact?: (message: ChatMessage, emoji: string) => void;
  onCopy?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  disabled?: boolean;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const ReplyButton: React.FC<ReplyButtonProps> = ({
  message,
  onReply,
  onReact,
  onCopy,
  onDelete,
  disabled = false,
}) => {
  const { t } = useLocalization();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleReply = () => {
    onReply(message);
    handleClose();
  };

  const handleReact = (emoji: string) => {
    onReact?.(message, emoji);
    handleClose();
  };

  const handleCopy = () => {
    onCopy?.(message);
    handleClose();
  };

  const handleDelete = () => {
    onDelete?.(message);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('chat.reply') || 'Reply'}>
        <IconButton
          size="small"
          onClick={handleReply}
          disabled={disabled}
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
          }}
        >
          <Reply fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="More actions">
        <IconButton
          size="small"
          onClick={handleClick}
          disabled={disabled}
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        {/* Reactions */}
        {onReact && (
          <>
            {REACTION_EMOJIS.map((emoji) => (
              <MenuItem
                key={emoji}
                onClick={() => handleReact(emoji)}
                sx={{ minWidth: 120 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
                </ListItemIcon>
                <ListItemText primary={emoji} />
              </MenuItem>
            ))}
            <MenuItem disabled sx={{ borderTop: 1, borderColor: 'divider', mt: 0.5 }} />
          </>
        )}

        {/* Copy */}
        {onCopy && (
          <MenuItem onClick={handleCopy}>
            <ListItemIcon>
              <span>📋</span>
            </ListItemIcon>
            <ListItemText primary="Copy message" />
          </MenuItem>
        )}

        {/* Delete */}
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <span>🗑️</span>
            </ListItemIcon>
            <ListItemText primary="Delete message" />
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
