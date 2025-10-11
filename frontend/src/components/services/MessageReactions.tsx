import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { MessageReaction } from '../../types/services/chat';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReactionClick?: (emoji: string) => void;
  currentUserId?: number;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReactionClick,
  currentUserId,
}) => {
  const { t } = useLocalization();

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  if (Object.keys(groupedReactions).length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const count = reactionList.length;
        const hasUserReaction = currentUserId && reactionList.some(r => r.user_id === currentUserId);
        
        return (
          <Tooltip
            key={emoji}
            title={
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {emoji} {count} {count === 1 ? 'reaction' : 'reactions'}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  {reactionList.slice(0, 3).map((reaction, index) => (
                    <Typography key={reaction.id} variant="caption" display="block">
                      {reaction.user_name}
                    </Typography>
                  ))}
                  {reactionList.length > 3 && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                      +{reactionList.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Box>
            }
            arrow
          >
            <Chip
              label={`${emoji} ${count}`}
              size="small"
              variant={hasUserReaction ? 'filled' : 'outlined'}
              color={hasUserReaction ? 'primary' : 'default'}
              onClick={() => onReactionClick?.(emoji)}
              sx={{
                height: 24,
                fontSize: '0.75rem',
                cursor: onReactionClick ? 'pointer' : 'default',
                '&:hover': onReactionClick ? {
                  backgroundColor: (theme) => theme.palette.primary.main,
                  color: (theme) => theme.palette.primary.contrastText,
                } : {},
                transition: 'all 0.2s ease-in-out',
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};
