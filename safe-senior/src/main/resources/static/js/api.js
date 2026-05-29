import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm";
function jwtDecode(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (e) {
        return null;
    }
}
const api = axios.create({
    baseURL: "http://localhost:8080",
    timeout: 10000
});

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
    refreshSubscribers.forEach((callback) => callback(newToken));
    refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
    refreshSubscribers.push(callback);
}

function getToken() {
    return localStorage.getItem("access_token");
}

function setToken(token) {
    localStorage.setItem("access_token", token);
}

function removeToken() {
    localStorage.removeItem("access_token");
}
function onRefreshFailed(error) {
    refreshSubscribers.forEach((callback) => callback(null, error));
    refreshSubscribers = [];
}
function isTokenExpired(token) {
    try {
        const decoded = jwtDecode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }
        const currentTime = Date.now() / 1000;
        return decoded.exp - currentTime < 60;
    } catch (e) {
        return true;
    }
}
async function refreshToken() {
    const token = getToken();
    const response = await axios.post(
        "http://localhost:8080/auth/refresh",
        { token: token }
    );
    return response.data.result.token;
}
api.interceptors.request.use(
    async (config) => {
        let token = getToken();
        if (token) {
            if (isTokenExpired(token)) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    try {
                        const newToken = await refreshToken();
                        setToken(newToken);
                        token = newToken;
                        onRefreshed(newToken);
                    } catch (e) {
                        removeToken();
                        onRefreshFailed(e);
                        return Promise.reject(e);
                    } finally {
                        isRefreshing = false;
                    }
                } else {
                    token = await new Promise((resolve, reject) => {
                        addRefreshSubscriber((newToken, error) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(newToken);
                            }
                        });
                    });
                }
            }
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest?.url?.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;
            try {
                const newToken = await refreshToken();
                setToken(newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                removeToken();
                document
                    .getElementById("loginModal")
                    ?.classList.remove("hidden");
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
export default api;