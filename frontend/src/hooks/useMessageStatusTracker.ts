import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/chat/chatService';
import type { ChatMessage } from '../types/services/chat';

interface MessageStatusTracker {
  markAsDelivered: (messageId: number) => void;
  markAsRead: (messageId: number) => void;
  updateMessageStatus: (messageId: number, status: 'sent' | 'delivered' | 'read') => void;
}

export const useMessageStatusTracker = (
  messages: ChatMessage[],
  currentUserId?: number
): MessageStatusTracker => {
  const [messageStatuses, setMessageStatuses] = useState<Map<number, 'sent' | 'delivered' | 'read'>>(new Map());
  const deliveredTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const readTimeouts = useRef<Map<number, NodeJS.Timeout>>(new Map());

  // Initialize message statuses from messages
  useEffect(() => {
    const newStatuses = new Map<number, 'sent' | 'delivered' | 'read'>();
    messages.forEach(msg => {
      if (msg.sender_id !== currentUserId) {
        newStatuses.set(msg.id, msg.delivery_status || 'sent');
      }
    });
    setMessageStatuses(newStatuses);
  }, [messages, currentUserId]);

  const markAsDelivered = useCallback(async (messageId: number) => {
    try {
      await chatService.markMessageDelivered(messageId);
      setMessageStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, 'delivered');
        return newMap;
      });
    } catch (error) {
      console.error('Failed to mark message as delivered:', error);
    }
  }, []);

  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await chatService.markMessageRead(messageId);
      setMessageStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, 'read');
        return newMap;
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  const updateMessageStatus = useCallback((messageId: number, status: 'sent' | 'delivered' | 'read') => {
    setMessageStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(messageId, status);
      return newMap;
    });
  }, []);

  // Auto-mark messages as delivered when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(
      msg => msg.sender_id !== currentUserId && 
             msg.delivery_status === 'sent' &&
             !messageStatuses.has(msg.id)
    );

    unreadMessages.forEach(msg => {
      // Clear any existing timeout
      const existingTimeout = deliveredTimeouts.current.get(msg.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set a timeout to mark as delivered (simulating message delivery)
      const timeout = setTimeout(() => {
        markAsDelivered(msg.id);
        deliveredTimeouts.current.delete(msg.id);
      }, 500); // 500ms delay to simulate delivery

      deliveredTimeouts.current.set(msg.id, timeout);
    });

    // Cleanup timeouts for messages that are no longer in the list
    return () => {
      deliveredTimeouts.current.forEach((timeout, messageId) => {
        if (!messages.some(msg => msg.id === messageId)) {
          clearTimeout(timeout);
          deliveredTimeouts.current.delete(messageId);
        }
      });
    };
  }, [messages, currentUserId, markAsDelivered, messageStatuses]);

  // Auto-mark messages as read when user interacts with the chat
  useEffect(() => {
    const deliveredMessages = messages.filter(
      msg => msg.sender_id !== currentUserId && 
             (msg.delivery_status === 'delivered' || messageStatuses.get(msg.id) === 'delivered') &&
             messageStatuses.get(msg.id) !== 'read'
    );

    deliveredMessages.forEach(msg => {
      // Clear any existing timeout
      const existingTimeout = readTimeouts.current.get(msg.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set a timeout to mark as read (simulating user reading)
      const timeout = setTimeout(() => {
        markAsRead(msg.id);
        readTimeouts.current.delete(msg.id);
      }, 2000); // 2 second delay to simulate reading

      readTimeouts.current.set(msg.id, timeout);
    });

    // Cleanup timeouts for messages that are no longer in the list
    return () => {
      readTimeouts.current.forEach((timeout, messageId) => {
        if (!messages.some(msg => msg.id === messageId)) {
          clearTimeout(timeout);
          readTimeouts.current.delete(messageId);
        }
      });
    };
  }, [messages, currentUserId, markAsRead, messageStatuses]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      deliveredTimeouts.current.forEach(timeout => clearTimeout(timeout));
      readTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    markAsDelivered,
    markAsRead,
    updateMessageStatus,
  };
};
