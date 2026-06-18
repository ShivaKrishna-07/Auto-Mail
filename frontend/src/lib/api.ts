const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
        // Avoid redirect loop if already on login page
        if (window.location.pathname !== '/') {
          window.location.href = '/';
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

  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async post(endpoint: string, body?: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }
}

export const api = new ApiClient();
