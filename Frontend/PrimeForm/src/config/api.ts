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
    /**
     * IMPORTANT:
     * Use the SAME IP that Metro is using (shown in the Expo terminal as
     * "exp://192.168.xxx.xxx:8081"). This is the IP your phone can reach.
     *
     * Right now Metro is running on: http://192.168.254.70:8081
     * So we use that base IP with the backend port 5001.
     */
    const baseURL = 'http://192.168.254.70:5001/api';

    console.log('🔍 API URL (development):', baseURL);

    return {
      baseURL,
      // Keep this reasonable so network issues fail fast instead of hanging the UI
      timeout: 10000, // 10 seconds
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
  // ✅ CRITICAL: Request deduplication - track in-flight requests to prevent duplicate concurrent calls
  private pendingRequests: Map<string, Promise<any>> = new Map();

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

  // ✅ CRITICAL: Generate unique request key for deduplication
  private getRequestKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const requestKey = this.getRequestKey(endpoint, options);

    // ✅ CRITICAL: Check if identical request is already in-flight
    // Only deduplicate GET requests (POST/PUT/DELETE should always execute)
    const isReadRequest = !options.method || options.method === 'GET';
    if (isReadRequest && this.pendingRequests.has(requestKey)) {
      console.log(`🔄 Reusing in-flight request: ${options.method || 'GET'} ${endpoint}`);
      return this.pendingRequests.get(requestKey)!;
    }

    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    console.log(`🔑 Auth Token: ${await this.getAuthToken() ? 'Present' : 'None'}`);

    // Create the request promise
    const requestPromise = (async () => {
      try {
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

            // Gracefully handle known "no active plan" 404 responses without treating them as hard errors.
            if (
              response.status === 404 &&
              errorData &&
              typeof errorData.message === 'string' &&
              (
                errorData.message === 'No active workout plan found' ||
                errorData.message === 'No active diet plan found'
              )
            ) {
              console.log(`ℹ️ API Info (${response.status}):`, errorData);
              return errorData;
            }

            // Gracefully handle 401 "Not authorized" as a soft auth failure
            if (
              response.status === 401 &&
              errorData &&
              typeof errorData.message === 'string' &&
              errorData.message === 'Not authorized to access this route'
            ) {
              console.log(`ℹ️ API Unauthorized (${response.status}):`, errorData);
              return errorData;
            }

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
      } finally {
        // ✅ CRITICAL: Remove from pending requests when done (success or failure)
        if (isReadRequest) {
          this.pendingRequests.delete(requestKey);
        }
      }
    })();

    // ✅ CRITICAL: Store promise for GET requests to enable deduplication
    if (isReadRequest) {
      this.pendingRequests.set(requestKey, requestPromise);
    }

    return requestPromise;
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

  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
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
