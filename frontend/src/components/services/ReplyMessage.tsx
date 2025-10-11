import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import {
  Reply,
  Image,
  InsertDriveFile,
  LocationOn,
  Info,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { ReplyToMessage, MessageType } from '../../types/services/chat';

interface ReplyMessageProps {
  replyTo: ReplyToMessage;
  onReplyClick?: () => void;
  compact?: boolean;
}

export const ReplyMessage: React.FC<ReplyMessageProps> = ({
  replyTo,
  onReplyClick,
  compact = false,
}) => {
  const { t } = useLocalization();

  const getMessageTypeIcon = (messageType: MessageType) => {
    switch (messageType) {
      case 'image':
        return <Image sx={{ fontSize: 14 }} />;
      case 'file':
        return <InsertDriveFile sx={{ fontSize: 14 }} />;
      case 'location':
        return <LocationOn sx={{ fontSize: 14 }} />;
      case 'system':
        return <Info sx={{ fontSize: 14 }} />;
      default:
        return null;
    }
  };

  const getMessagePreview = (messageType: MessageType, preview: string) => {
    switch (messageType) {
      case 'image':
        return t('chat.sharedImage');
      case 'file':
        return t('chat.sharedFile');
      case 'location':
        return t('chat.sharedLocation');
      case 'system':
        return t('chat.systemMessage');
      default:
        return preview;
    }
  };

  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          borderRadius: 1,
          borderLeft: 3,
          borderLeftColor: 'primary.main',
          cursor: onReplyClick ? 'pointer' : 'default',
          '&:hover': onReplyClick ? {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200',
          } : {},
        }}
        onClick={onReplyClick}
      >
        <Reply sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {replyTo.sender_name}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getMessagePreview(replyTo.message_type, replyTo.message_preview)}
        </Typography>
        {getMessageTypeIcon(replyTo.message_type)}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
        borderRadius: 2,
        borderLeft: 4,
        borderLeftColor: 'primary.main',
        cursor: onReplyClick ? 'pointer' : 'default',
        '&:hover': onReplyClick ? {
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
        } : {},
      }}
      onClick={onReplyClick}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Reply sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
          Replying to {replyTo.sender_name}
        </Typography>
      </Stack>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {getMessageTypeIcon(replyTo.message_type)}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getMessagePreview(replyTo.message_type, replyTo.message_preview)}
        </Typography>
        {replyTo.message_type !== 'text' && (
          <Chip
            label={replyTo.message_type}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>
    </Paper>
  );
};
