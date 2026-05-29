import api from "./api.js";
import {logout} from "./logout.js";

let errorTimeout;
document.addEventListener("DOMContentLoaded", () => {
    const loginModal =
        document.getElementById("loginModal");
    const openLoginBtn =
        document.getElementById("openLogin");
    const closeLoginBtn =
        document.getElementById("closeLogin");
    const loginForm =
        document.getElementById("loginForm")
    if (openLoginBtn) {
        openLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            loginModal.classList.remove("hidden");
        });
    }
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener("click", () => {
            loginModal.classList.add("hidden");
        });
    }
    if (loginModal) {
        loginModal.addEventListener("click", (e) => {
            if (e.target === loginModal) {
                loginModal.classList.add("hidden");
            }
        });
    }
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            document
                .getElementById("loginError")
                .classList.add("hidden");
            const username =
                document.getElementById("username").value;
            const password =
                document.getElementById("passwordInput").value;
            try {
                const response = await api.post("/auth/token", {
                    username,
                    password
                });
                const token = response.data.result.token;
                // lưu token
                localStorage.setItem("access_token", token);
                loginModal.classList.add("hidden");
                updateAuthUI()
            } catch (error) {
                console.log(error);
                const message =
                    error.response?.data?.message
                    || "Có lỗi xảy ra";
                const errorEl =
                    document.getElementById("loginError");
                errorEl.textContent = message;
                errorEl.classList.remove("hidden");
                // clear timeout cũ nếu có
                clearTimeout(errorTimeout);
                errorTimeout = setTimeout(() => {
                    errorEl.classList.add("hidden");
                }, 3000);
            }
        });
    }

    function updateAuthUI() {
        const authArea = document.getElementById("authArea");
        authArea.innerHTML = `
        <button
            id="userBtn"
            type="button"
            class="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <i class="fa-regular fa-user text-sm"></i>
        </button>
    `;

        document
            .getElementById("userBtn")
            .addEventListener("click", async () => {

                const confirmLogout =
                    confirm("Bạn muốn đăng xuất?");

                if (confirmLogout) {
                    await logout();
                }
            });
    }
    const token = localStorage.getItem("access_token");
    if (token) {
        updateAuthUI();
    }
});
