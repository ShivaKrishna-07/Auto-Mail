import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gmail_auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gmail_auth_token');
        localStorage.removeItem('gmail_user_data');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error('Unauthorized');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'API Request failed');
    }
    return data;
  }

  private async fetchWithTimeout(endpoint: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return await this.handleResponse(response);
    } catch (error: any) {
      clearTimeout(id);
      let errorMessage = error.message;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server took too long to respond.';
      }
      
      // Global error toast interceptor
      if (errorMessage !== 'Unauthorized') {
        toast.error(errorMessage);
      }
      
      throw error;
    }
  }

  async get(endpoint: string) {
    return this.fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });
  }

  async post(endpoint: string, body?: any) {
    return this.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const api = new ApiClient();
