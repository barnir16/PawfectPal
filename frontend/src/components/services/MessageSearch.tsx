import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search,
  Clear,
  Message,
  Person,
  AccessTime,
} from '@mui/icons-material';
import { useLocalization } from '../../contexts/LocalizationContext';
import { formatMessageTime } from '../../utils/timeUtils';
import type { ChatMessage } from '../../types/services/chat';

interface MessageSearchProps {
  messages: ChatMessage[];
  onMessageClick?: (message: ChatMessage) => void;
  onClose?: () => void;
  open: boolean;
}

interface SearchResult {
  message: ChatMessage;
  matchIndex: number;
  matchLength: number;
  context: string;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  messages,
  onMessageClick,
  onClose,
  open,
}) => {
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    const timeoutId = setTimeout(() => {
      const results = performSearch(messages, searchQuery.trim());
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, messages]);

  const performSearch = (messages: ChatMessage[], query: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    messages.forEach((message) => {
      const messageText = message.message.toLowerCase();
      const matchIndex = messageText.indexOf(lowerQuery);
      
      if (matchIndex !== -1) {
        // Create context around the match
        const start = Math.max(0, matchIndex - 30);
        const end = Math.min(messageText.length, matchIndex + query.length + 30);
        const context = message.message.substring(start, end);
        
        // Add ellipsis if needed
        const contextWithEllipsis = 
          (start > 0 ? '...' : '') + 
          context + 
          (end < message.message.length ? '...' : '');

        results.push({
          message,
          matchIndex: start + (start > 0 ? 3 : 0), // Adjust for ellipsis
          matchLength: query.length,
          context: contextWithEllipsis,
        });
      }
    });

    // Sort by message creation time (newest first)
    return results.sort((a, b) => 
      new Date(b.message.created_at).getTime() - new Date(a.message.created_at).getTime()
    );
  };

  const highlightMatch = (text: string, matchIndex: number, matchLength: number) => {
    if (matchIndex === -1) return text;
    
    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + matchLength);
    const after = text.substring(matchIndex + matchLength);
    
    return (
      <>
        {before}
        <Box component="span" sx={{ backgroundColor: 'yellow', fontWeight: 'bold' }}>
          {match}
        </Box>
        {after}
      </>
    );
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return '🖼️';
      case 'file':
        return '📎';
      case 'location':
        return '📍';
      case 'system':
        return 'ℹ️';
      default:
        return '💬';
    }
  };

  const handleMessageClick = (message: ChatMessage) => {
    onMessageClick?.(message);
    onClose?.();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!open) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: '600px' },
        maxHeight: '70vh',
        zIndex: 1300,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Search Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Search color="primary" />
          <Typography variant="h6" component="h2">
            {t('chat.searchMessages') || 'Search Messages'}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={onClose} size="small">
            <Clear />
          </IconButton>
        </Stack>
        
        <TextField
          fullWidth
          placeholder={t('chat.searchPlaceholder') || 'Search in messages...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
          autoFocus
        />
      </Box>

      {/* Search Results */}
      <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
        {isSearching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!isSearching && searchQuery && searchResults.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {t('chat.noSearchResults') || 'No messages found matching your search.'}
            </Typography>
          </Box>
        )}

        {!isSearching && !searchQuery && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {t('chat.searchHint') || 'Type to search through your messages...'}
            </Typography>
          </Box>
        )}

        {!isSearching && searchResults.length > 0 && (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
              </Typography>
            </Box>
            
            <List sx={{ p: 0 }}>
              {searchResults.map((result, index) => (
                <React.Fragment key={result.message.id}>
                  <ListItem
                    button
                    onClick={() => handleMessageClick(result.message)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {result.message.sender?.username?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {result.message.sender?.username || 'Unknown User'}
                          </Typography>
                          <Chip
                            label={getMessageTypeIcon(result.message.message_type)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            <AccessTime sx={{ fontSize: 12, mr: 0.5 }} />
                            {formatMessageTime(result.message.created_at)}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.4,
                          }}
                        >
                          {highlightMatch(result.context, result.matchIndex, result.matchLength)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </>
        )}
      </Box>
    </Paper>
  );
};
