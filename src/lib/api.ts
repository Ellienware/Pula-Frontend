const BASE = import.meta.env.VITE_API_BASE_URL || "/api";

let token: string | null = localStorage.getItem("momo_token")

export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem("momo_token", t)
  else localStorage.removeItem("momo_token")
}

export function getToken() {
  return token
}

export class ApiError extends Error {
  status: number
  code?: string
  /** Present on unexpected 500s — reference this when reporting a bug (see GlobalExceptionHandler). */
  requestId?: string
  constructor(status: number, message: string, code?: string, requestId?: string) {
    super(requestId ? `${message} (ref: ${requestId})` : message)
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const body = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = body?.message || res.statusText || "Request failed"
    throw new ApiError(res.status, message, body?.code, body?.requestId)
  }
  return body as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown, headers?: Record<string, string>) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined, headers }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
}
