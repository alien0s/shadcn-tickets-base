import { getStoredToken } from '../features/auth/utils/auth-storage'
import { expireAuthSession, isUnauthorizedApiResponse } from '../features/auth/utils/auth-session'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: {
    message: string
    code: string
    statusCode: number
  }
}

/**
 * Cliente HTTP com tratamento de erros e token automático
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async parseResponseBody<T>(response: Response): Promise<ApiResponse<T> | null> {
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return null
    }

    try {
      return (await response.json()) as ApiResponse<T>
    } catch {
      return null
    }
  }

  private buildError(response: Response, data?: ApiResponse<unknown> | null): Error {
    if (isUnauthorizedApiResponse(response.status, data)) {
      expireAuthSession()
      return new Error(data?.error?.message || data?.message || 'Sessao expirada. Faca login novamente.')
    }

    return new Error(data?.error?.message || data?.message || 'Erro na requisicao')
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getStoredToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    })

    if (response.status == 204) {
      return undefined as T
    }

    const data = await this.parseResponseBody<T>(response)

    if (!response.ok || !data?.success) {
      throw this.buildError(response, data)
      throw new Error(data.error?.message || data.message || 'Erro na requisição')
    }

    return data.data as T
  }

  private async requestWithMeta<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; message?: string; pagination?: ApiResponse<T>['pagination'] }> {
    const token = getStoredToken()

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    })

    if (response.status == 204) {
      return { data: undefined as T }
    }

    const data = await this.parseResponseBody<T>(response)

    if (!response.ok || !data?.success) {
      throw this.buildError(response, data)
      throw new Error(data.error?.message || data.message || 'Erro na requisição')
    }

    return { data: data.data as T, message: data.message, pagination: data.pagination }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  postWithMeta<T>(endpoint: string, body?: unknown): Promise<{ data: T; message?: string }> {
    return this.requestWithMeta<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  getWithMeta<T>(endpoint: string): Promise<{ data: T; message?: string; pagination?: ApiResponse<T>['pagination'] }> {
    return this.requestWithMeta<T>(endpoint, { method: 'GET' })
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })
  }

  patchWithMeta<T>(endpoint: string, body?: unknown): Promise<{ data: T; message?: string; pagination?: ApiResponse<T>['pagination'] }> {
    return this.requestWithMeta<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    })
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(API_URL)
