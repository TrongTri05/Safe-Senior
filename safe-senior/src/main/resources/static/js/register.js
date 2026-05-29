import api from "./api.js";

let errorTimeout;

document.addEventListener("DOMContentLoaded", () => {

    const registerModal =
        document.getElementById("registerModal");

    const registerForm =
        document.getElementById("registerForm");

    const registerError =
        document.getElementById("RegisterError");

    const captchaOverlay =
        document.getElementById("captchaOverlay");

    const captchaError =
        document.getElementById("captchaError");

    const captchaAnswers =
        document.querySelectorAll(".captcha-answer");

    const captchaSkip =
        document.getElementById("captchaSkip");

    // Lưu dữ liệu form tạm
    let registerData = null;

    // =========================
    // SUBMIT REGISTER
    // =========================
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

            // Lưu dữ liệu
            registerData = {
                username,
                email,
                password,
                confirmPassword
            };

            // Hiện CAPTCHA
            captchaOverlay.classList.remove("hidden");
        });
    }

    // =========================
    // CAPTCHA ANSWERS
    // =========================
    captchaAnswers.forEach(button => {

        button.addEventListener("click", async () => {

            const isCorrect =
                button.dataset.correct === "true";

            // ĐÚNG
            if (isCorrect) {

                captchaOverlay.classList.add("hidden");

                try {

                    const response =
                        await api.post("/users", registerData);

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

            }

            // SAI
            else {

                showCaptchaError();
            }
        });
    });

    // =========================
    // SKIP
    // =========================
    captchaSkip.addEventListener("click", () => {

        showCaptchaError();
    });

    // =========================
    // CAPTCHA ERROR
    // =========================
    function showCaptchaError() {

        captchaError.classList.remove("hidden");

        setTimeout(() => {

            captchaError.classList.add("hidden");

        }, 3000);
    }

    // =========================
    // REGISTER ERROR
    // =========================
    function showRegisterError(message) {

        registerError.textContent = message;

        registerError.classList.remove("hidden");

        clearTimeout(errorTimeout);

        errorTimeout = setTimeout(() => {

            registerError.classList.add("hidden");

        }, 3000);
    }
});