const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  constructor() {
    this.token = typeof localStorage !== 'undefined' ? localStorage.getItem('liferpg_token') : null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('liferpg_token', token);
    } else {
      localStorage.removeItem('liferpg_token');
    }
  }

  getToken() {
    if (!this.token && typeof localStorage !== 'undefined') {
      this.token = localStorage.getItem('liferpg_token');
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const url = `${BASE_URL}${endpoint}`;

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          this.setToken(null);
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        const errorMsg = data.error || (data.message ? data.message : `Grid error: ${res.status}`);
        const err = new Error(errorMsg);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Connection to the grid lost. Check your uplink connection.');
      }
      throw err;
    }
  }

  // Auth endpoints
  signup(data) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  login(data) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Character endpoints
  getCharacter() {
    return this.request('/api/character/me');
  }

  getActivity() {
    return this.request('/api/character/activity');
  }

  updateTheme(theme) {
    return this.request('/api/character/theme', {
      method: 'PATCH',
      body: JSON.stringify({ theme }),
    });
  }

  // Tasks / Missions endpoints
  getMissions(status = '') {
    const query = status ? `?status=${status}` : '';
    return this.request(`/api/tasks${query}`);
  }

  createMission(mission) {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(mission),
    });
  }

  updateMission(id, updates) {
    return this.request(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteMission(id) {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  completeMission(id) {
    return this.request(`/api/tasks/${id}/complete`, {
      method: 'POST',
    });
  }

  // Shop endpoints
  getShopItems() {
    return this.request('/api/shop/items');
  }

  getInventory() {
    return this.request('/api/shop/inventory');
  }

  buyItem(itemId) {
    return this.request(`/api/shop/buy/${itemId}`, {
      method: 'POST',
    });
  }

  equipItem(itemId) {
    return this.request(`/api/shop/equip/${itemId}`, {
      method: 'PATCH',
    });
  }
}

export const api = new ApiClient();
