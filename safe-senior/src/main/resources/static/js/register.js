import api from "./api.js";

let errorTimeout;

document.addEventListener("DOMContentLoaded", () => {
    const registerModal =
        document.getElementById("registerModal");
    const registerForm =
        document.getElementById("registerForm");
    const registerError =
        document.getElementById("RegisterError");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            registerError.classList.add("hidden");
            const username =
                document.getElementById("registerUsername").value;
            const email =
                document.getElementById("emailRegister").value;
            const password =
                document.getElementById("registerPassword").value;
            const confirmPassword =
                document.getElementById("confirmPassword").value;
            try {
                const response = await api.post("/users", {
                    username,
                    email,
                    password,
                    confirmPassword
                });
                const message =
                    response.data?.message ||
                    "Đăng ký thành công!";
                alert(message);
                registerModal.classList.add("hidden");
                document.getElementById("loginModal")
                    .classList.remove("hidden");
                registerForm.reset();
            } catch (error) {
                console.log(error);
                const message =
                    error.response?.data?.message ||
                    "Có lỗi xảy ra";
                showRegisterError(message);
            }
        });
    }

    function showRegisterError(message) {
        registerError.textContent = message;
        registerError.classList.remove("hidden");

        clearTimeout(errorTimeout);

        errorTimeout = setTimeout(() => {
            registerError.classList.add("hidden");
        }, 3000);
    }
});