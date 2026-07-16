/**
 * AI-assisted drafting for marketplace service request posts. Given the
 * service type, selected pets, and a little optional context, the backend
 * (Gemini-backed, with a deterministic fallback) returns a ready-to-edit
 * title + description so the owner doesn't have to write the post from
 * scratch. Always resolves — never throws — mirroring the vaccine explainer
 * service's contract.
 */

import { getBaseUrl, getToken } from '../api';

export interface MarketplaceDraftPetInfo {
  name: string;
  type: string;
  breed?: string;
}

export interface MarketplaceDraftResult {
  title: string;
  description: string;
  aiGenerated: boolean;
}

export async function draftMarketplacePost(
  serviceType: string,
  pets: MarketplaceDraftPetInfo[],
  options: {
    location?: string;
    isUrgent?: boolean;
    extraContext?: string;
    promptLanguage?: string;
  } = {}
): Promise<MarketplaceDraftResult | null> {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/ai/marketplace-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        service_type: serviceType,
        pets: pets.map((p) => ({ name: p.name, type: p.type, breed: p.breed })),
        location: options.location,
        is_urgent: options.isUrgent ?? false,
        extra_context: options.extraContext,
        prompt_language: options.promptLanguage ?? 'en',
      }),
    });

    if (!response.ok) {
      throw new Error(`Marketplace draft request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      title: data.title || '',
      description: data.description || '',
      aiGenerated: Boolean(data.ai_generated),
    };
  } catch (error) {
    console.error('Marketplace draft request failed:', error);
    return null;
  }
}
