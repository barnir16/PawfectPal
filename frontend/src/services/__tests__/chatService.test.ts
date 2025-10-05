import { describe, it, expect, vi } from 'vitest';
import { chatService } from '../../services/chat/chatService';

// Mock the apiClient
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('ChatService', () => {
  it('should be defined', () => {
    expect(chatService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof chatService.getMyConversations).toBe('function');
    expect(typeof chatService.getConversation).toBe('function');
    expect(typeof chatService.sendMessage).toBe('function');
    expect(typeof chatService.markMessageRead).toBe('function');
    expect(typeof chatService.shareLocation).toBe('function');
    expect(typeof chatService.sendServiceUpdate).toBe('function');
  });
});
