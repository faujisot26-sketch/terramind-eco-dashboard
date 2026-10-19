export async function fetchGeminiWithBackoff(url: string, payload: any, maxRetries = 2): Promise<any> {
  let delay = 1000;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries - 1) {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
          continue;
        }
        let detail = response.statusText;
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) {
            detail = errBody.error.message;
          }
        } catch (_) {}
        throw new Error(`[HTTP ${response.status}] ${detail}`);
      }
      return await response.json();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

export function getGeminiEndpoint(customKey?: string): string | null {
  let key = customKey?.trim();
  if (!key) {
    return null;
  }
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(key)}`;
}
