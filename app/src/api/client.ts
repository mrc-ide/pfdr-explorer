export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type QueryValue = string | number | readonly (string | number)[] | undefined;

export const apiUrl = (path: string, params: Record<string, QueryValue> = {}): string => {
  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(name, Array.isArray(value) ? value.join(',') : String(value));
  }
  const query = search.toString();
  return query ? `/api${path}?${query}` : `/api${path}`;
};

const errorMessage = (body: unknown): string | undefined =>
  typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
    ? body.error
    : undefined;

export const fetchJson = async <T>(
  path: string,
  params?: Record<string, QueryValue>,
  signal?: AbortSignal,
): Promise<T> => {
  const response = await fetch(apiUrl(path, params), { signal });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new ApiError(response.status, errorMessage(body) ?? `The API answered ${response.status}.`);
  }
  return (await response.json()) as T;
};
