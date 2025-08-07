const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    this.setToken(response.token);
    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Finance methods
  async getFinanceData() {
    return this.request('/finance');
  }

  async updateFinanceData(data) {
    return this.request('/finance', {
      method: 'PUT',
      body: data,
    });
  }

  // Documents methods
  async getDocuments() {
    return this.request('/documents');
  }

  async updateDocuments(documents) {
    return this.request('/documents', {
      method: 'PUT',
      body: { documents },
    });
  }

  // Voice diary methods
  async getVoiceDiaryEntries() {
    return this.request('/voice-diary');
  }

  async updateVoiceDiaryEntries(entries) {
    return this.request('/voice-diary', {
      method: 'PUT',
      body: { entries },
    });
  }
}

export const apiClient = new ApiClient();