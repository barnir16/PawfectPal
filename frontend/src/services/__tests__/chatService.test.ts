import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatService } from '../../services/chat/chatService'

// Mock the apiClient
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}

vi.mock('../../services/api/apiClient', () => ({
  apiClient: mockApiClient,
}))

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMyConversations', () => {
    it('should fetch conversations successfully', async () => {
      const mockConversations = [
        {
          service_request_id: 1,
          messages: [
            {
              id: 1,
              service_request_id: 1,
              sender_id: 1,
              message: 'Hello',
              message_type: 'text',
              is_read: true,
              is_edited: false,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
          unread_count: 0,
        },
      ]

      mockApiClient.get.mockResolvedValue({ data: mockConversations })

      const result = await chatService.getMyConversations()

      expect(mockApiClient.get).toHaveBeenCalledWith('/chat/my-conversations')
      expect(result).toEqual(mockConversations)
    })

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'))

      await expect(chatService.getMyConversations()).rejects.toThrow('Failed to fetch conversations')
    })
  })

  describe('getConversation', () => {
    it('should fetch a specific conversation', async () => {
      const mockConversation = {
        service_request_id: 1,
        messages: [],
        unread_count: 0,
      }

      mockApiClient.get.mockResolvedValue({ data: mockConversation })

      const result = await chatService.getConversation(1)

      expect(mockApiClient.get).toHaveBeenCalledWith('/chat/conversations/1')
      expect(result).toEqual(mockConversation)
    })
  })

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      const mockMessage = {
        service_request_id: 1,
        message: 'Hello',
        message_type: 'text',
      }

      const mockResponse = {
        id: 1,
        service_request_id: 1,
        sender_id: 1,
        message: 'Hello',
        message_type: 'text',
        is_read: false,
        is_edited: false,
        created_at: '2024-01-01T00:00:00Z',
      }

      mockApiClient.post.mockResolvedValue({ data: mockResponse })

      const result = await chatService.sendMessage(1, mockMessage)

      expect(mockApiClient.post).toHaveBeenCalledWith('/chat/messages', mockMessage)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('markMessageRead', () => {
    it('should mark a message as read', async () => {
      mockApiClient.put.mockResolvedValue({})

      await chatService.markMessageRead(1)

      expect(mockApiClient.put).toHaveBeenCalledWith('/chat/messages/1/read')
    })
  })
})
