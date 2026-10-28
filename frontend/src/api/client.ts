import type {
  ApiErrorShape,
  CurrentUserResponse,
  LoginResponse,
  Book,
  AuthorTicket,
  CreateTicketInput,
  StreamTokenResponse,
  AdminTicketsQuery,
  AdminTicketListResponse,
  AdminTicketDetail,
  PatchTicketInput,
  ReplyTicketInput,
  AddNoteInput,
  RetryTriageResponse,
  DraftResponse,
  AdminInternalNote,
  TicketMessage,
} from './types';

const TOKEN_KEY = 'bookleaf_auth_token';

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable / quota exceeded
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const BASE_URL = API_BASE_URL;

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.get();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      (netErr as Error).message || 'Unable to connect to BookLeaf server'
    );
  }

  if (!response.ok) {
    let errorShape: ApiErrorShape | null = null;
    try {
      errorShape = (await response.json()) as ApiErrorShape;
    } catch {
      // Response wasn't valid JSON
    }

    if (response.status === 401) {
      tokenStorage.clear();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const code = errorShape?.error?.code || 'HTTP_ERROR';
    const message = errorShape?.error?.message || response.statusText || 'An unexpected error occurred';
    const details = errorShape?.error?.details;

    throw new ApiError(response.status, code, message, details);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  // Auth endpoints
  auth: {
    login: (body: { email: string; password: string }) =>
      api.post<LoginResponse>('/auth/login', body),
    me: () => api.get<CurrentUserResponse>('/auth/me'),
  },

  // Author books
  books: {
    list: () => api.get<Book[]>('/books'),
    getById: (id: string) => api.get<Book>(`/books/${id}`),
  },

  // Author tickets
  tickets: {
    create: (data: CreateTicketInput) => api.post<AuthorTicket>('/tickets', data),
    list: (limit = 50, offset = 0) =>
      api.get<AuthorTicket[]>(`/tickets?limit=${limit}&offset=${offset}`),
    getById: (id: string) => api.get<AuthorTicket>(`/tickets/${id}`),
  },

  // Realtime events
  events: {
    createToken: () => api.post<StreamTokenResponse>('/events/token'),
  },

  // Admin endpoints (T13)
  admin: {
    tickets: {
      list: (params: AdminTicketsQuery = {}) => {
        const sp = new URLSearchParams();
        if (params.status) sp.set('status', params.status);
        if (params.category) sp.set('category', params.category);
        if (params.priority) sp.set('priority', params.priority);
        if (params.from) sp.set('from', params.from);
        if (params.to) sp.set('to', params.to);
        if (params.assignedTo) sp.set('assignedTo', params.assignedTo);
        if (params.q) sp.set('q', params.q);
        if (params.sort) sp.set('sort', params.sort);
        if (params.limit !== undefined) sp.set('limit', String(params.limit));
        if (params.offset !== undefined) sp.set('offset', String(params.offset));
        const qs = sp.toString();
        return api.get<AdminTicketListResponse>(`/admin/tickets${qs ? `?${qs}` : ''}`);
      },
      getById: (id: string) => api.get<AdminTicketDetail>(`/admin/tickets/${id}`),
      patch: (id: string, updates: PatchTicketInput) =>
        api.patch<AdminTicketDetail>(`/admin/tickets/${id}`, updates),
      reply: (id: string, data: ReplyTicketInput) =>
        api.post<TicketMessage>(`/admin/tickets/${id}/reply`, data),
      addNote: (id: string, data: AddNoteInput) =>
        api.post<AdminInternalNote>(`/admin/tickets/${id}/notes`, data),
      retryTriage: (id: string) =>
        api.post<RetryTriageResponse>(`/admin/tickets/${id}/triage`),
      generateDraft: (id: string, options: { regenerate?: boolean } = {}) =>
        api.post<DraftResponse>(`/admin/tickets/${id}/draft`, options),
    },
  },
};
