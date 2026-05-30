import api from "./api.js";
import { logout } from "./logout.js";
let errorTimeout;
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.querySelector(".login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const username =
                document.getElementById("login-email").value.trim();

            const password =
                document.getElementById("login-pass").value.trim();

            if (!username || !password) {
                showError("Vui lòng nhập đầy đủ thông tin!");
                return;
            }
            try {
                const response = await api.post("/auth/token", {
                    username,
                    password
                });
                const token = response.data.result.token;
                localStorage.setItem("access_token", token);
                // Decode JWT — đổi tên biến thành payload_username
                const payload          = JSON.parse(atob(token.split('.')[1]));
                const payload_username = payload.sub;
                if (payload_username) {
                    localStorage.setItem('username', payload_username);
                }
                updateAuthUI();
                showSuccess("Đăng nhập thành công!");
                setTimeout(() => showPage("home"), 500);

            } catch (error) {
                const message =
                    error.response?.data?.message || "Có lỗi xảy ra";

                showError(message);
            }
        });
    }

    function showError(message) {
        const old = document.getElementById("loginError");
        if (old) old.remove();

        const el = document.createElement("p");
        el.id = "loginError";
        el.textContent = message;

        el.style.color = "#ff4d4f";
        el.style.marginTop = "14px";
        el.style.fontSize = "13px";
        el.style.textAlign = "center";

        document.querySelector(".login-form-wrap").appendChild(el);

        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(() => el.remove(), 3000);
    }

    function showSuccess(message) {
        showToast?.(message);
    }
    function updateAuthUI() {
        const authBtn = document.getElementById("authBtn");
        const dropdown = document.getElementById("userDropdown");
        const mobileAuthBtn = document.getElementById("mobileAuthBtn");
        const token = localStorage.getItem("access_token");
        if (!token) {
            authBtn.onclick = () => {

                const loginPage =
                    document.getElementById("page-login");

                // Nếu đang mở login -> đóng về home
                if (loginPage.classList.contains("active")) {
                    showPage("home");
                }
                // Nếu chưa mở -> mở login
                else {
                    showPage("login");
                }
            };
            if (mobileAuthBtn) {
                mobileAuthBtn.textContent = "Đăng nhập";
                mobileAuthBtn.onclick = () => {

                    const loginPage =
                        document.getElementById("page-login");

                    if (loginPage.classList.contains("active")) {
                        showPage("home");
                    } else {
                        showPage("login");
                    }

                    toggleMenu();
                };
            }
            return;
        }
        authBtn.onclick = () => {
            dropdown.classList.toggle("active");
        };

        document.getElementById("logoutBtn")
            .addEventListener("click", async (e) => {
                e.preventDefault();
                await logout();
                localStorage.removeItem("access_token");
                dropdown.classList.remove("active");
                updateAuthUI();
                showPage("home");
            });
        if (mobileAuthBtn) {
            mobileAuthBtn.textContent = "Logout";
            mobileAuthBtn.onclick = async () => {
                await logout();
                localStorage.removeItem("access_token");
                updateAuthUI();
                toggleMenu();
                showPage("home");
            };
        }
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".user-menu-wrapper")) {
                dropdown.classList.remove("active");
            }
        });
    }
    updateAuthUI();
});