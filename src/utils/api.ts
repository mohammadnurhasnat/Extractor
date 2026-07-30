export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; text: string; error?: string }> {
  try {
    const response = await fetch(input, init);
    const text = await response.text();
    let data: T | null = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Non-JSON response (e.g., plain text "Rate exceeded.", HTML error page)
    }
    if (!response.ok) {
      const errorMsg = (data as any)?.error || (data as any)?.message || text.slice(0, 150) || `HTTP error ${response.status}`;
      return { ok: false, status: response.status, data, text, error: errorMsg };
    }
    return { ok: true, status: response.status, data, text };
  } catch (err: any) {
    return { ok: false, status: 0, data: null, text: '', error: err?.message || 'Network request failed' };
  }
}
