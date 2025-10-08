// API Configuration for different environments
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

const getApiConfig = (): ApiConfig => {
  // For development, try multiple URLs with fallback
  // For production, use your actual domain
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    // Try your network IP first, then fall back to localhost
    const possibleUrls = [
      'http://192.168.48.66:5000/api',  // Primary: your CURRENT network IP
      'http://192.168.75.66:5000/api',  // Fallback: your previous mobile data IP
      'http://192.168.100.33:5000/api', // Fallback: your previous network IP
      'http://192.168.0.117:5000/api',  // Fallback: your old network IP
      'http://localhost:5000/api',      // Fallback: localhost
      'http://127.0.0.1:5000/api',     // Alternative: loopback
    ];
    
    // Use the first URL (localhost) as primary
    const baseURL = possibleUrls[0];
    
    console.log('🔍 Primary API URL:', baseURL);
    console.log('🔄 Fallback URLs:', possibleUrls.slice(1));
    
    return {
      baseURL,
      timeout: 30000, // Increased timeout for heavy operations like workout plan generation
    };
  }
  
  // Production configuration
  return {
    baseURL: 'https://your-production-domain.com/api', // Replace with your actual domain
    timeout: 30000,
  };
};

export const apiConfig = getApiConfig();
export const API_BASE_URL = apiConfig.baseURL;

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
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    console.log(`🔑 Auth Token: ${await this.getAuthToken() ? 'Present' : 'None'}`);
    
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

      console.log(`📤 Request Headers:`, headers);
      if (options.body) {
        console.log(`📦 Request Body:`, options.body);
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      console.log(`📥 Response Headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ HTTP Error: ${response.status}`, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(`✅ Response Data:`, responseData);
      return responseData;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      console.error(`💥 API Error:`, error);
      console.error(`💥 Error Type:`, error.constructor.name);
      console.error(`💥 Error Message:`, error.message);
      console.error(`💥 Error Stack:`, error.stack);
      
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
