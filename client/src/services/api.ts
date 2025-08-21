import axios from 'axios'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't automatically redirect on 401 - let components handle it
    // This allows for better error handling in the AuthContext
    return Promise.reject(error)
  }
)

// Search API functions
export const searchAPI = {
  // Search items
  searchItems: async (params: {
    q?: string;
    category?: string;
    itemType?: string;
    condition?: string;
    minValue?: number;
    maxValue?: number;
    location?: string;
    radius?: number;
    tags?: string[];
    allowsShipping?: boolean;
    allowsPickup?: boolean;
    allowsMeetup?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/search/items', { params });
    return response.data;
  },

  // Search users
  searchUsers: async (params: {
    q?: string;
    location?: string;
    skills?: string[];
    interests?: string[];
    minTrustScore?: number;
    hasItems?: boolean;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/search/users', { params });
    return response.data;
  },

  // Get search suggestions
  getSuggestions: async (q: string, type: 'items' | 'users' = 'items') => {
    const response = await api.get('/search/suggestions', { 
      params: { q, type } 
    });
    return response.data;
  },

  // Get popular searches
  getPopularSearches: async () => {
    const response = await api.get('/search/popular');
    return response.data;
  }
};

export const categoryAPI = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Get category by slug
  getCategoryBySlug: async (slug: string) => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },

  // Get category statistics
  getCategoryStats: async (slug: string) => {
    const response = await api.get(`/categories/${slug}/stats`);
    return response.data;
  }
};

export const itemsAPI = {
  // Create new item
  createItem: async (itemData: FormData) => {
    const response = await api.post('/items', itemData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get item by ID
  getItem: async (id: string) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  // Update item
  updateItem: async (id: string, itemData: FormData) => {
    const response = await api.put(`/items/${id}`, itemData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload images for item
  uploadImages: async (id: string, images: File[]) => {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });

    const response = await api.patch(`/items/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete item
  deleteItem: async (id: string) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  // Toggle item availability
  toggleItemAvailability: async (id: string) => {
    const response = await api.patch(`/items/${id}/toggle`);
    return response.data;
  },

  // Get user's items
  getUserItems: async (userId: string) => {
    const response = await api.get(`/users/${userId}/items`);
    return response.data;
  }
};

export const tradesAPI = {
  // Get user's trades with optional filtering
  getTrades: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/trades', { params });
    return response.data;
  },

  // Get single trade by ID
  getTrade: async (id: string) => {
    const response = await api.get(`/trades/${id}`);
    return response.data;
  },

  // Update trade status
  updateTradeStatus: async (id: string, data: {
    status: 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
    message?: string;
    cancellationReason?: string;
  }) => {
    const response = await api.patch(`/trades/${id}/status`, data);
    return response.data;
  },

  // Initiate a new trade
  initiateTrade: async (data: {
    responderId: string;
    initiatorItemId?: string;
    responderItemId?: string;
    initiatorMessage?: string;
    swapCredits?: number;
  }) => {
    const response = await api.post('/trades', data);
    return response.data;
  }
};

export const userAPI = {
  // Get current user's profile
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Get user profile by username
  getUserProfile: async (username: string) => {
    const response = await api.get(`/users/profile/${username}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: FormData) => {
    const response = await api.put('/users/me', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get user's items
  getUserItems: async (username: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await api.get(`/users/${username}/items`, { params });
    return response.data;
  },

  // Get user's reviews
  getUserReviews: async (username: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get(`/users/${username}/reviews`, { params });
    return response.data;
  }
};

export const messagesAPI = {
  // Get conversations list
  getConversations: async (params?: {
    limit?: number;
  }) => {
    const response = await api.get('/messages/conversations', { params });
    return response.data;
  },

  // Get messages for a specific trade/conversation
  getMessages: async (tradeId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get(`/messages/trade/${tradeId}`, { params });
    return response.data;
  },

  // Send a message
  sendMessage: async (data: {
    tradeId: string;
    recipientId?: string;
    content: string;
    attachments?: any[];
  }) => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  // Mark messages as read
  markMessagesAsRead: async (messageIds: string[]) => {
    const response = await api.patch('/messages/read', { messageIds });
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  }
};

export default api
