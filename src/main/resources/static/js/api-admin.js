// api-admin.js
import axios from "https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm";

const apiAdmin = axios.create({ baseURL: "", timeout: 10000 });

function getAdminToken() { return localStorage.getItem("admin_access_token"); }
function setAdminToken(t) { localStorage.setItem("admin_access_token", t); }
function removeAdminToken() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_user");
}

apiAdmin.interceptors.request.use(async config => {
    const token = getAdminToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
}, err => Promise.reject(err));

apiAdmin.interceptors.response.use(res => res, async err => {
    if (err.response?.status === 401) {
        removeAdminToken();
        // Hiện lại login screen
        document.getElementById('login-screen')?.classList.remove('hidden');
        document.getElementById('app').style.display = 'none';
    }
    return Promise.reject(err);
});

export default apiAdmin;