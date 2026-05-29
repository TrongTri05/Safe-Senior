import api from "./api.js";
let errorTimeout;
document.addEventListener("DOMContentLoaded", () => {
    const registerBtn = document.getElementById("register-btn");
    if (registerBtn) {
        registerBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            const username =
                document.getElementById("register-username").value.trim();
            const email =
                document.getElementById("register-email").value.trim();
            const password =
                document.getElementById("register-password").value.trim();
            const confirmPassword =
                document.getElementById("register-confirm-password").value.trim();
            if (!username || !email || !password || !confirmPassword) {
                showRegisterError("Vui lòng nhập đầy đủ thông tin!");
                return;
            }
            if (password !== confirmPassword) {
                showRegisterError("Mật khẩu xác nhận không khớp!");
                return;
            }
            try {
                const response = await api.post("/users", {
                    username,
                    email,
                    password,
                    confirmPassword
                });
                alert(
                    response.data?.message || "Đăng ký thành công!"
                );
                // Reset form
                document.getElementById("register-username").value = "";
                document.getElementById("register-email").value = "";
                document.getElementById("register-password").value = "";
                document.getElementById("register-confirm-password").value = "";
                // Chuyển về login
                setTimeout(() => {
                    showPage("login");
                }, 700);
            } catch (error) {
                const message =
                    error.response?.data?.message ||
                    "Có lỗi xảy ra";
                showRegisterError(message);
            }
        });
    }
    function showRegisterError(message) {
        const old =
            document.getElementById("registerError");
        if (old) old.remove();
        const el = document.createElement("p");
        el.id = "registerError";
        el.textContent = message;
        el.style.color = "#ff4d4f";
        el.style.marginTop = "14px";
        el.style.fontSize = "13px";
        el.style.textAlign = "center";
        document.querySelector("#page-register .login-form-wrap")
            .appendChild(el);
        clearTimeout(errorTimeout);

        errorTimeout = setTimeout(() => {
            el.remove();
        }, 3000);
    }
});