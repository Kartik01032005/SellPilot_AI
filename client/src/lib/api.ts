const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type ApiResponse<T = Record<string, any>> = {
  success: boolean;
  message?: string;
  code?: string;
  data?: any;
} & T;

export class ApiClient {
  private static token: string | null = null;

  public static setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('sellpilot_token', token);
      } else {
        localStorage.removeItem('sellpilot_token');
      }
    }
  }

  public static getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('sellpilot_token');
    }
    return this.token;
  }

  public static async request<T = Record<string, any>>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Request failed with status ${response.status}`,
          code: data.code || 'API_ERROR',
          ...data,
        } as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred',
        code: 'NETWORK_ERROR',
      } as ApiResponse<T>;
    }
  }

  public static async checkHealth() {
    return this.request<{ status: string }>('/api/health');
  }
}
