import { config } from '../config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(config.apiBase + path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': config.csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    if (text) data = JSON.parse(text);
  } catch {
    // Server returned a non-JSON body (e.g. HTML login redirect on 401).
    // data stays null; the res.ok check below will build an ApiError from statusText.
  }

  if (!res.ok) {
    const raw = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const msg = (typeof raw.message === 'string' ? raw.message : null) || res.statusText;
    const errors = raw.errors as Record<string, string[]> | undefined;
    throw new ApiError(res.status, msg, errors);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
