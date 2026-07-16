/**
 * AI-backed explainer for a pet's rule-based vaccine suggestions.
 * Turns the deterministic SmartVaccineService output into a short,
 * synthesized, plain-language summary via the backend /ai/vaccine-explainer
 * endpoint. Always resolves (never throws) — the backend itself falls back
 * to a deterministic template when Gemini is unavailable, so the caller
 * only needs to render `explanation` and can use `aiGenerated` to decide
 * whether to show an "AI" badge.
 */

import { getBaseUrl, getToken } from '../api';

export interface VaccineExplainerResult {
  explanation: string;
  aiGenerated: boolean;
}

export interface VaccineExplainerPetInfo {
  name: string;
  type: 'dog' | 'cat' | string;
  ageWeeks?: number;
}

/**
 * Minimal, decoupled input shape — the app currently has two parallel
 * vaccine-suggestion systems (dashboard's SmartVaccineService and the
 * vaccine tracker's own inline logic) with different field names. Callers
 * map their local suggestion shape into this before calling the explainer
 * so this service doesn't need to depend on either one.
 */
export interface VaccineExplainerSuggestionInput {
  vaccineName: string;
  category: string;
  priority: string;
  isOverdue: boolean;
  dueDate?: string;
  reason?: string;
}

const FALLBACK_EXPLANATION_EN =
  "We couldn't generate an explanation right now. Please check the vaccine list below.";
const FALLBACK_EXPLANATION_HE =
  'לא הצלחנו להפיק הסבר כרגע. אנא עיינו ברשימת החיסונים למטה.';

export async function explainVaccinePlan(
  pet: VaccineExplainerPetInfo,
  suggestions: VaccineExplainerSuggestionInput[],
  promptLanguage: string
): Promise<VaccineExplainerResult> {
  try {
    const token = await getToken();
    const response = await fetch(`${getBaseUrl()}/ai/vaccine-explainer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        pet_name: pet.name,
        pet_type: pet.type,
        pet_age_weeks: pet.ageWeeks,
        prompt_language: promptLanguage,
        suggestions: suggestions.map((s) => ({
          vaccine_name: s.vaccineName,
          category: s.category,
          priority: s.priority,
          is_overdue: s.isOverdue,
          due_date: s.dueDate,
          reason: s.reason,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`Vaccine explainer request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      explanation: data.explanation || (promptLanguage === 'he' ? FALLBACK_EXPLANATION_HE : FALLBACK_EXPLANATION_EN),
      aiGenerated: Boolean(data.ai_generated),
    };
  } catch (error) {
    console.error('Vaccine explainer request failed:', error);
    return {
      explanation: promptLanguage === 'he' ? FALLBACK_EXPLANATION_HE : FALLBACK_EXPLANATION_EN,
      aiGenerated: false,
    };
  }
}
