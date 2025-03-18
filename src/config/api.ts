// API Configuration
export const API_BASE_URL = 'http://localhost:5000';

// Helper for constructing API URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Default headers for API requests
export const getDefaultHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Function to check if the server is available
export const checkServerAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    return response.ok;
  } catch (error) {
    return false;
  }
}; 