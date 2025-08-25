// API Configuration for different environments
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

const getApiConfig = (): ApiConfig => {
  // For development, use localhost or your machine's IP address
  // For production, use your actual domain
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    // Use your machine's IP address for mobile development
    // You can find this by running 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
    return {
      baseURL: 'http://192.168.0.117:5000/api', // Your actual IP address
      timeout: 10000, // Increased timeout for database operations
    };
  }
  
  // Production configuration
  return {
    baseURL: 'https://your-production-domain.com/api', // Replace with your actual domain
    timeout: 15000,
  };
};

export const apiConfig = getApiConfig();

// Create API client with proper authentication handling
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = apiConfig.baseURL;
    this.timeout = apiConfig.timeout;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Import AsyncStorage dynamically to avoid circular dependencies
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.default.getItem('authToken');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get authentication token
    const token = await this.getAuthToken();
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Network error occurred');
    }
  }

  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Export the API client instance
export const api = new ApiClient();
export default api;
