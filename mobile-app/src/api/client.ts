import { API_URL } from '@/lib/config';

/** Error thrown for any non-2xx response, carrying the backend error envelope. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type AuthHandlers = {
  getAccessToken: () => string | null;
  /** Attempts a token refresh; resolves the new access token or null. */
  refreshAccessToken: () => Promise<string | null>;
  onSignOut: () => void;
};

let handlers: AuthHandlers | null = null;

/** Wired once by AuthContext so the client can attach tokens and refresh on 401. */
export function setAuthHandlers(h: AuthHandlers) {
  handlers = h;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean; // default true
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // no/invalid body
  }
  if (!res.ok) {
    const err = (json as { error?: { code?: string; message?: string; details?: unknown } })?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'error',
      err?.message ?? `Request failed (${res.status})`,
      err?.details
    );
  }
  return json as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true } = options;
  const url = buildUrl(path, query);

  const run = async (token: string | null): Promise<Response> =>
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  // Surface connectivity problems clearly instead of a generic failure.
  const safeRun = async (token: string | null): Promise<Response> => {
    try {
      return await run(token);
    } catch {
      throw new ApiError(
        0,
        'network_error',
        `Can't reach the server at ${API_URL}. Make sure the backend is running and your phone is on the same Wi-Fi.`
      );
    }
  };

  let token = auth ? (handlers?.getAccessToken() ?? null) : null;
  let res = await safeRun(token);

  // On expiry, refresh once and retry.
  if (res.status === 401 && auth && handlers) {
    const newToken = await handlers.refreshAccessToken();
    if (newToken) {
      res = await safeRun(newToken);
    } else {
      handlers.onSignOut();
    }
  }

  return parse<T>(res);
}
