import api from "./api.js";
export async function logout() {
    try {
        const token =
            localStorage.getItem("access_token");
        if (token) {
            await api.post(
                "/auth/logout",
                { token }
            );
        }
    } catch (e) {
        console.log("Logout error:", e);
    } finally {
        localStorage.removeItem("access_token");
        window.location.href = "/home";
    }
}