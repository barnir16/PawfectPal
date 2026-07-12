import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../utils/StorageHelper', () => ({
  StorageHelper: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    setObject: vi.fn().mockResolvedValue(undefined),
    getObject: vi.fn().mockResolvedValue(null),
  },
}));

import { apiRequest, handleApiError } from './api';
import { StorageHelper } from '../utils/StorageHelper';

const jsonResponse = (body: unknown, status = 200, statusText = '') =>
  new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });

const textResponse = (body: string, status: number, statusText = '') =>
  new Response(body, { status, statusText });

describe('api.ts error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (StorageHelper.getItem as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('apiRequest - happy paths', () => {
    it('returns parsed JSON on success', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ hello: 'world' })));

      const result = await apiRequest<{ hello: string }>('/ping');
      expect(result).toEqual({ hello: 'world' });
    });

    it('returns undefined for a 204 No Content response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
      );

      const result = await apiRequest('/ping');
      expect(result).toBeUndefined();
    });
  });

  describe('apiRequest - network and parsing failures get clear messages', () => {
    it('turns a raw "Failed to fetch" TypeError into a friendly, actionable message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
      );

      await expect(apiRequest('/pets')).rejects.toThrow(
        /reach the server|offline/i
      );

      // Make sure the raw, unhelpful browser message never reaches the caller.
      try {
        await apiRequest('/pets');
        throw new Error('expected apiRequest to throw');
      } catch (error) {
        expect((error as Error).message).not.toBe('Failed to fetch');
        expect((error as any).isNetworkError).toBe(true);
      }
    });

    it('reports being offline distinctly when navigator.onLine is false', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      vi.stubGlobal('navigator', { onLine: false });

      await expect(apiRequest('/pets')).rejects.toThrow(/offline/i);
    });

    it('maps an aborted/timed-out request to a clear timeout message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
      );

      await expect(apiRequest('/pets')).rejects.toThrow(/took too long|timed out/i);
    });

    it('gives a clear message when a 2xx response body is not valid JSON', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response('not json', { status: 200 }))
      );

      await expect(apiRequest('/pets')).rejects.toThrow(/couldn't be read/i);
    });
  });

  describe('apiRequest - retry behavior on 5xx', () => {
    it('retries a 500 with backoff before giving up with a clear server error', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ detail: 'boom' }, 500))
        .mockResolvedValueOnce(jsonResponse({ detail: 'boom' }, 500))
        .mockResolvedValueOnce(jsonResponse({ hello: 'recovered' }, 200));
      vi.stubGlobal('fetch', fetchMock);

      const result = await apiRequest<{ hello: string }>('/flaky');

      expect(result).toEqual({ hello: 'recovered' });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('apiRequest - 401 triggers session-expired handling', () => {
    it('clears the stored token and surfaces a clear re-login message', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          jsonResponse({ detail: 'Could not validate credentials' }, 401)
        )
      );
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await expect(apiRequest('/secure')).rejects.toThrow(/log in again/i);

      expect(StorageHelper.removeItem).toHaveBeenCalledWith('authToken');
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  describe('handleApiError - status-specific messages', () => {
    it('401 with the generic FastAPI detail becomes a friendly session-expired message', async () => {
      const response = jsonResponse({ detail: 'Could not validate credentials' }, 401);
      await expect(handleApiError(response)).rejects.toThrow(/session has expired/i);
    });

    it('401 with a custom detail passes that detail through', async () => {
      const response = jsonResponse({ detail: 'Account disabled' }, 401);
      await expect(handleApiError(response)).rejects.toThrow('Account disabled');
    });

    it('403 without detail gives a permission-denied message', async () => {
      const response = jsonResponse({}, 403);
      await expect(handleApiError(response)).rejects.toThrow(/permission/i);
    });

    it('404 without detail gives a clear not-found message', async () => {
      const response = jsonResponse({}, 404);
      await expect(handleApiError(response)).rejects.toThrow(/couldn't find/i);
    });

    it('404 with detail uses the backend-provided detail', async () => {
      const response = jsonResponse({ detail: 'Pet not found' }, 404);
      await expect(handleApiError(response)).rejects.toThrow('Pet not found');
    });

    it('409 gives a conflict message hinting at a refresh', async () => {
      const response = jsonResponse({}, 409);
      await expect(handleApiError(response)).rejects.toThrow(/conflicts|refresh/i);
    });

    it('422 with an array of field errors lists every offending field', async () => {
      const validationDetail = {
        detail: [
          { loc: ['body', 'weight_kg'], msg: 'must be greater than 0' },
          { loc: ['body', 'pet_id'], msg: 'field required' },
        ],
      };

      // A Response body can only be read once, so each assertion needs its
      // own freshly-constructed Response.
      await expect(handleApiError(jsonResponse(validationDetail, 422))).rejects.toThrow(
        /weight_kg/
      );
      try {
        await handleApiError(jsonResponse(validationDetail, 422));
        throw new Error('expected handleApiError to throw');
      } catch (error) {
        expect((error as Error).message).toContain('pet_id');
        expect((error as Error).message).toContain('must be greater than 0');
      }
    });

    it('422 with a plain string detail still produces a "check your input" message', async () => {
      const response = jsonResponse({ detail: 'Invalid payload' }, 422);
      await expect(handleApiError(response)).rejects.toThrow(/check your input/i);
    });

    it('429 tells the user to slow down', async () => {
      const response = jsonResponse({}, 429);
      await expect(handleApiError(response)).rejects.toThrow(/too quickly|wait/i);
    });

    it('400 without detail gives an actionable validation hint', async () => {
      const response = jsonResponse({}, 400);
      await expect(handleApiError(response)).rejects.toThrow(/check the information/i);
    });

    it('503 reports temporary unavailability rather than a generic error', async () => {
      const response = jsonResponse({}, 503);
      await expect(handleApiError(response)).rejects.toThrow(/temporarily unavailable/i);
    });

    it('500 gives a reassuring, non-blaming message', async () => {
      const response = jsonResponse({}, 500);
      await expect(handleApiError(response)).rejects.toThrow(/went wrong on our end/i);
    });

    it('a non-JSON error body still produces a readable message instead of throwing on parse', async () => {
      const response = textResponse('<html>Bad Gateway</html>', 502, 'Bad Gateway');
      await expect(handleApiError(response)).rejects.toThrow(/temporarily unavailable/i);
    });

    it('an unrecognized status with an unparsable body falls back to a status-aware message', async () => {
      const response = textResponse('totally not json', 418, "I'm a teapot");
      await expect(handleApiError(response)).rejects.toThrow(/418/);
    });

    it('attaches the parsed status and data onto the thrown error for callers that inspect it', async () => {
      const response = jsonResponse({ detail: 'Pet not found' }, 404);
      try {
        await handleApiError(response);
        throw new Error('expected handleApiError to throw');
      } catch (error) {
        expect((error as any).status).toBe(404);
        expect((error as any).data).toEqual({ detail: 'Pet not found' });
      }
    });
  });
});
