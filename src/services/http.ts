const REQUEST_TIMEOUT = 12000;

export async function fetchJson<T>(url: string, timeoutMs = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    globalThis.clearTimeout(timer);
  }
}
