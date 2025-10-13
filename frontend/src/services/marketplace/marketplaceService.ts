import { apiClient } from '../../services/api';
import type { 
  MarketplacePost, 
  MarketplacePostCreate, 
  MarketplacePostUpdate, 
  MarketplacePostSummary 
} from '../../types/services/marketplacePost';

class MarketplaceService {
  /**
   * Create a new marketplace post
   */
  async createPost(post: MarketplacePostCreate): Promise<MarketplacePost> {
    try {
      const response = await apiClient.post<MarketplacePost>('/marketplace-posts/', post);
      return response;
    } catch (error: any) {
      console.error('Failed to create marketplace post:', error);
      throw new Error('Failed to create marketplace post');
    }
  }

  /**
   * Get all marketplace posts with optional filters
   */
  async getPosts(params?: {
    skip?: number;
    limit?: number;
    service_type?: string;
    location?: string;
    is_urgent?: boolean;
  }): Promise<MarketplacePostSummary[]> {
    try {
      let endpoint = '/marketplace-posts/';
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
        if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
        if (params.service_type) queryParams.append('service_type', params.service_type);
        if (params.location) queryParams.append('location', params.location);
        if (params.is_urgent !== undefined) queryParams.append('is_urgent', params.is_urgent.toString());
        if (queryParams.toString()) {
          endpoint += `?${queryParams.toString()}`;
        }
      }
      const response = await apiClient.get<MarketplacePostSummary[]>(endpoint);
      return response;
    } catch (error: any) {
      console.error('Failed to get marketplace posts:', error);
      throw new Error('Failed to get marketplace posts');
    }
  }

  /**
   * Get a specific marketplace post by ID
   */
  async getPost(postId: number): Promise<MarketplacePost> {
    try {
      const response = await apiClient.get<MarketplacePost>(`/marketplace-posts/${postId}`);
      return response;
    } catch (error: any) {
      console.error('Failed to get marketplace post:', error);
      throw new Error('Failed to get marketplace post');
    }
  }

  /**
   * Update a marketplace post
   */
  async updatePost(postId: number, updates: MarketplacePostUpdate): Promise<MarketplacePost> {
    try {
      const response = await apiClient.put<MarketplacePost>(`/marketplace-posts/${postId}`, updates);
      return response;
    } catch (error: any) {
      console.error('Failed to update marketplace post:', error);
      throw new Error('Failed to update marketplace post');
    }
  }

  /**
   * Delete a marketplace post
   */
  async deletePost(postId: number): Promise<void> {
    try {
      await apiClient.delete(`/marketplace-posts/${postId}`);
    } catch (error: any) {
      console.error('Failed to delete marketplace post:', error);
      throw new Error('Failed to delete marketplace post');
    }
  }

  /**
   * Respond to a marketplace post (increment response count)
   */
  async respondToPost(postId: number): Promise<void> {
    try {
      await apiClient.post(`/marketplace-posts/${postId}/respond`);
    } catch (error: any) {
      console.error('Failed to respond to marketplace post:', error);
      throw new Error('Failed to respond to marketplace post');
    }
  }

  /**
   * Get user's own marketplace posts
   */
  async getMyPosts(): Promise<MarketplacePost[]> {
    try {
      const response = await apiClient.get<MarketplacePost[]>('/marketplace-posts/my-posts');
      return response;
    } catch (error: any) {
      console.error('Failed to get my marketplace posts:', error);
      throw new Error('Failed to get my marketplace posts');
    }
  }

  /**
   * Get service types for marketplace posts
   */
  async getServiceTypes(): Promise<Array<{ id: number; name: string; description?: string }>> {
    try {
      const response = await apiClient.get<Array<{ id: number; name: string; description?: string }>>('/provider-profiles/service-types');
      return response;
    } catch (error: any) {
      console.error('Failed to get service types:', error);
      throw new Error('Failed to get service types');
    }
  }
}

export const marketplaceService = new MarketplaceService();
