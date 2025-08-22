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
      timeout: 10000,
    };
  }
  
  // Production configuration
  return {
    baseURL: 'https://your-production-domain.com/api', // Replace with your actual domain
    timeout: 15000,
  };
};

export const apiConfig = getApiConfig();
export default apiConfig;
