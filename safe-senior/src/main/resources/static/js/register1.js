// import api from "./api.js";
// let errorTimeout;
//
// document.addEventListener("DOMContentLoaded", () => {
//     const registerModal = document.getElementById("registerModal");
//     const registerForm = document.getElementById("registerForm");
//     const registerError = document.getElementById("RegisterError");
//     const closeRegisterBtn = document.getElementById("closeRegister");
//
//     // Sự kiện đóng Modal khi bấm nút X
//     if (closeRegisterBtn && registerModal) {
//         closeRegisterBtn.addEventListener("click", () => {
//             registerModal.classList.add("hidden");
//         });
//     }
//
//     if (registerForm && registerError) {
//         registerForm.addEventListener("submit", async (e) => {
//             e.preventDefault();
//
//             // Ẩn lỗi cũ trước khi gửi request mới
//             registerError.classList.add("hidden");
//             clearTimeout(errorTimeout);
//
//             const username = document.getElementById("registerUsername").value;
//             const email = document.getElementById("emailRegister").value;
//             const password = document.getElementById("registerPassword").value;
//             const confirmPassword = document.getElementById("confirmPassword").value;
//
//             // Kiểm tra mật khẩu khớp nhau ở client
//             if (password !== confirmPassword) {
//                 showRegisterError("Mật khẩu xác nhận không trùng khớp!");
//                 return;
//             }
//
//             try {
//                 const response = await api.post("/users", {
//                     username,
//                     email,
//                     password,
//                     confirmPassword
//                 });
//
//                 const message = response.data?.message || "Đăng ký thành công!";
//                 alert(message);
//
//                 // Ẩn modal đăng ký, mở modal đăng nhập
//                 registerModal.classList.add("hidden");
//                 const loginModal = document.getElementById("loginModal");
//                 if (loginModal) {
//                     loginModal.classList.remove("hidden");
//                 }
//
//                 registerForm.reset();
//             } catch (error) {
//                 console.error(error);
//                 const message = error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.";
//                 showRegisterError(message);
//             }
//         });
//     }
//
//     function showRegisterError(message) {
//         registerError.textContent = message;
//         registerError.classList.remove("hidden");
//
//         errorTimeout = setTimeout(() => {
//             registerError.classList.add("hidden");
//         }, 3000);
//     }
// });