/**
 * Time formatting utilities for consistent timestamp display across the app
 */

export interface TimeFormatOptions {
  showSeconds?: boolean;
  showYear?: boolean;
  relativeThreshold?: number; // hours after which to show absolute time
}

/**
 * Format a timestamp to a human-readable relative time
 * Examples: "2m ago", "1h ago", "Yesterday", "Dec 15", "Dec 15, 2023"
 */
export const formatRelativeTime = (
  timestamp: string | Date,
  options: TimeFormatOptions = {}
): string => {
  const {
    showSeconds = false,
    showYear = false,
    relativeThreshold = 24 // Show relative time for up to 24 hours
  } = options;

  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Handle future timestamps
  if (diffInMs < 0) return "Just now";

  // Show relative time for recent messages
  if (diffInHours < relativeThreshold) {
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
  }

  // Show absolute time for older messages
  const isToday = diffInDays === 0;
  const isYesterday = diffInDays === 1;
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' })
    });
  }

  if (isYesterday) {
    return "Yesterday";
  }

  if (isThisYear && !showYear) {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    ...(showYear && { year: 'numeric' })
  });
};

/**
 * Format timestamp for chat list (shows last message time)
 * Examples: "2m", "1h", "Yesterday", "Dec 15"
 */
export const formatChatListTime = (timestamp: string | Date): string => {
  return formatRelativeTime(timestamp, { 
    relativeThreshold: 24,
    showYear: false 
  });
};

/**
 * Format timestamp for message bubbles (shows exact time)
 * Examples: "2:30 PM", "Yesterday 2:30 PM", "Dec 15, 2:30 PM"
 */
export const formatMessageTime = (timestamp: string | Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  const isToday = diffInDays === 0;
  const isYesterday = diffInDays === 1;
  const isThisYear = date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  if (isToday) {
    return timeStr;
  }

  if (isYesterday) {
    return `Yesterday ${timeStr}`;
  }

  if (isThisYear) {
    const dateStr = date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
    return `${dateStr}, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  return `${dateStr}, ${timeStr}`;
};

/**
 * Format timestamp for service requests (shows when posted)
 * Examples: "2m ago", "1h ago", "Yesterday", "Dec 15"
 */
export const formatServiceTime = (timestamp: string | Date): string => {
  return formatRelativeTime(timestamp, { 
    relativeThreshold: 48, // Show relative for up to 2 days
    showYear: false 
  });
};

/**
 * Check if a timestamp is recent (within last hour)
 */
export const isRecentMessage = (timestamp: string | Date): boolean => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours < 1;
};

/**
 * Check if a timestamp is today
 */
export const isToday = (timestamp: string | Date): boolean => {
  const date = new Date(timestamp);
  const now = new Date();
  return date.toDateString() === now.toDateString();
};
