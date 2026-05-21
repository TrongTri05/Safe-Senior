// // ============================================
// // CLIENT-SIDE AUTO-REFRESH IMPLEMENTATION
// // ============================================
//
// // File: api.ts (hoặc api.js)
// import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
//
// // ============================================
// // 1. CONFIGURATION
// // ============================================
//
// const API_BASE_URL = 'http://localhost:8080/api/v1';
// const TOKEN_STORAGE_KEY = 'accessToken';
// const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
//
// // ============================================
// // 2. AXIOS INSTANCE
// // ============================================
//
// const apiClient = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
//
// // ============================================
// // 3. TOKEN STORAGE UTILITIES
// // ============================================
//
// interface TokenStorage {
//   accessToken: string | null;
//   refreshToken: string | null;
// }
//
// const tokenStorage: TokenStorage = {
//   accessToken: null,
//   refreshToken: null,
// };
//
// /**
//  * Set both access and refresh tokens
//  */
// export const setTokens = (accessToken: string, refreshToken: string): void => {
//   tokenStorage.accessToken = accessToken;
//   tokenStorage.refreshToken = refreshToken;
//   localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
//   localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
//   console.log('[TokenStorage] Tokens set successfully');
// };
//
// /**
//  * Get access token
//  */
// export const getAccessToken = (): string | null => {
//   if (!tokenStorage.accessToken) {
//     tokenStorage.accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
//   }
//   return tokenStorage.accessToken;
// };
//
// /**
//  * Get refresh token
//  */
// export const getRefreshToken = (): string | null => {
//   if (!tokenStorage.refreshToken) {
//     tokenStorage.refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
//   }
//   return tokenStorage.refreshToken;
// };
//
// /**
//  * Clear both tokens
//  */
// export const clearTokens = (): void => {
//   tokenStorage.accessToken = null;
//   tokenStorage.refreshToken = null;
//   localStorage.removeItem(TOKEN_STORAGE_KEY);
//   localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
//   console.log('[TokenStorage] Tokens cleared');
// };
//
// // ============================================
// // 4. REFRESH TOKEN QUEUE (Prevent Multiple Refresh Requests)
// // ============================================
//
// interface QueueItem {
//   resolve: (token: string) => void;
//   reject: (error: AxiosError) => void;
// }
//
// let isRefreshing = false;
// let failedQueue: QueueItem[] = [];
//
// const processQueue = (error: AxiosError | null, token: string | null = null): void => {
//   failedQueue.forEach(({ resolve, reject }) => {
//     if (error) {
//       reject(error);
//     } else if (token) {
//       resolve(token);
//     }
//   });
//   failedQueue = [];
// };
//
// // ============================================
// // 5. REQUEST INTERCEPTOR
// // ============================================
//
// /**
//  * Request Interceptor: Thêm access token vào Authorization header
//  */
// apiClient.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = getAccessToken();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log('[Request] Token added to Authorization header');
//     }
//     return config;
//   },
//   (error: AxiosError) => {
//     console.error('[Request] Interceptor error:', error.message);
//     return Promise.reject(error);
//   }
// );
//
// // ============================================
// // 6. RESPONSE INTERCEPTOR - AUTO REFRESH
// // ============================================
//
// /**
//  * Response Interceptor: Kiểm tra 401 và tự động refresh token
//  */
// apiClient.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async (error: AxiosError) => {
//     const originalRequest = error.config as any;
//
//     // Handle 401 Unauthorized (Token Expired)
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       console.warn('[Response] 401 Unauthorized - Token may be expired');
//
//       // Nếu đang refresh, thêm request vào queue
//       if (isRefreshing) {
//         console.log('[Response] Already refreshing, queuing request...');
//         return new Promise((resolve, reject) => {
//           failedQueue.push({
//             resolve: (token: string) => {
//               originalRequest.headers.Authorization = `Bearer ${token}`;
//               resolve(apiClient(originalRequest));
//             },
//             reject: (err: AxiosError) => reject(err),
//           });
//         });
//       }
//
//       // Mark request as retried
//       originalRequest._retry = true;
//
//       // Start refresh process
//       isRefreshing = true;
//       console.log('[Response] Starting token refresh...');
//
//       try {
//         const refreshToken = getRefreshToken();
//
//         if (!refreshToken) {
//           console.warn('[Response] No refresh token available');
//           throw new Error('No refresh token available');
//         }
//
//         // Gọi API refresh token
//         const response = await axios.post(
//           `${API_BASE_URL}/auth/refresh`,
//           { token: refreshToken },
//           {
//             headers: {
//               'Content-Type': 'application/json',
//             },
//           }
//         );
//
//         const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.result;
//
//         console.log('[Response] Token refreshed successfully');
//
//         // Update tokens
//         setTokens(newAccessToken, newRefreshToken);
//
//         // Update original request with new token
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//
//         // Process queued requests
//         processQueue(null, newAccessToken);
//
//         // Retry original request
//         return apiClient(originalRequest);
//       } catch (refreshError) {
//         console.error('[Response] Token refresh failed:', refreshError);
//
//         // Process queued requests with error
//         processQueue(refreshError as AxiosError, null);
//
//         // Clear tokens and redirect to login
//         clearTokens();
//         window.location.href = '/login';
//
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }
//
//     // Handle other errors
//     if (error.response?.status === 403) {
//       console.warn('[Response] 403 Forbidden - Access denied');
//     }
//
//     return Promise.reject(error);
//   }
// );
//
// // ============================================
// // 7. AUTH FUNCTIONS
// // ============================================
//
// interface LoginRequest {
//   username: string;
//   password: string;
// }
//
// interface AuthResponse {
//   token: string;
//   refreshToken: string;
//   authenticated: boolean;
// }
//
// /**
//  * Login function
//  */
// export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
//   try {
//     console.log('[Auth] Login attempt for user:', credentials.username);
//     const response = await apiClient.post<{ result: AuthResponse }>('/auth/token', credentials);
//
//     const { token, refreshToken } = response.data.result;
//
//     // Save tokens
//     setTokens(token, refreshToken);
//
//     console.log('[Auth] Login successful');
//     return response.data.result;
//   } catch (error) {
//     console.error('[Auth] Login failed:', error);
//     throw error;
//   }
// };
//
// interface LogoutRequest {
//   refreshToken: string;
//   accessToken: string;
// }
//
// /**
//  * Logout function
//  */
// export const logout = async (): Promise<void> => {
//   try {
//     const accessToken = getAccessToken();
//     const refreshToken = getRefreshToken();
//
//     if (!refreshToken || !accessToken) {
//       console.warn('[Auth] Missing tokens for logout');
//       clearTokens();
//       return;
//     }
//
//     console.log('[Auth] Logout attempt');
//
//     // Call logout API
//     await apiClient.post<{ result: void }>('/auth/logout', {
//       refreshToken,
//       accessToken, // ✨ NEW: Include access token for invalidation
//     });
//
//     console.log('[Auth] Logout successful');
//
//     // Clear tokens
//     clearTokens();
//
//     // Redirect to login
//     window.location.href = '/login';
//   } catch (error) {
//     console.error('[Auth] Logout failed:', error);
//
//     // Force clear tokens anyway
//     clearTokens();
//     window.location.href = '/login';
//   }
// };
//
// interface RefreshTokenRequest {
//   token: string;
// }
//
// /**
//  * Manual token refresh (rarely used, usually automatic)
//  */
// export const refreshAuthToken = async (): Promise<AuthResponse> => {
//   try {
//     const refreshToken = getRefreshToken();
//
//     if (!refreshToken) {
//       throw new Error('No refresh token available');
//     }
//
//     console.log('[Auth] Manual token refresh');
//
//     const response = await axios.post<{ result: AuthResponse }>(
//       `${API_BASE_URL}/auth/refresh`,
//       { token: refreshToken }
//     );
//
//     const { token, refreshToken: newRefreshToken } = response.data.result;
//
//     // Update tokens
//     setTokens(token, newRefreshToken);
//
//     console.log('[Auth] Token refresh successful');
//     return response.data.result;
//   } catch (error) {
//     console.error('[Auth] Token refresh failed:', error);
//     clearTokens();
//     throw error;
//   }
// };
//
// // ============================================
// // 8. EXPORT API CLIENT
// // ============================================
//
// export default apiClient;
//
// // ============================================
// // USAGE EXAMPLE
// // ============================================
//
// /*
// // In your React component or main app:
//
// import apiClient, { login, logout, getAccessToken } from './api';
//
// // 1. Login
// const handleLogin = async (username: string, password: string) => {
//   try {
//     await login({ username, password });
//     console.log('User logged in');
//     // Redirect to dashboard
//     window.location.href = '/dashboard';
//   } catch (error) {
//     console.error('Login failed:', error);
//     alert('Login failed. Please try again.');
//   }
// };
//
// // 2. Make API request (automatic token refresh if needed)
// const getProfile = async () => {
//   try {
//     const response = await apiClient.get('/profile');
//     console.log('Profile:', response.data);
//   } catch (error) {
//     console.error('Failed to get profile:', error);
//   }
// };
//
// // 3. Logout
// const handleLogout = async () => {
//   await logout();
// };
//
// // 4. Check if user is logged in
// const isLoggedIn = (): boolean => {
//   return !!getAccessToken();
// };
//
// // 5. Initialize on app start (restore tokens from localStorage)
// const initializeAuth = () => {
//   const token = localStorage.getItem('accessToken');
//   const refreshToken = localStorage.getItem('refreshToken');
//
//   if (token && refreshToken) {
//     setTokens(token, refreshToken);
//     console.log('Tokens restored from localStorage');
//   }
// };
// */
//
