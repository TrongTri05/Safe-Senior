package vn.edu.fpt.safe_senior.controller;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.UseCreateRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.UserResponse;
import vn.edu.fpt.safe_senior.entity.EmailVerificationToken;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.repository.EmailVerificationTokenRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;
import vn.edu.fpt.safe_senior.service.UserService;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users")
public class UserController {
    UserService userService;
    EmailVerificationTokenRepository emailVerificationTokenRepository;
    UserRepository userRepository;
    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UseCreateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .message("Please check your email to activate your account.")
                .build();
    }

    @GetMapping("/verify")
    public String verifyEmail(@RequestParam("token") String token) {
        EmailVerificationToken verificationToken = emailVerificationTokenRepository.findByToken(token)
                .orElse(null);
        if (verificationToken == null || verificationToken.getExpiryTime().isBefore(LocalDateTime.now())) {
            return "Token không hợp lệ hoặc đã hết hạn.";
        }
        User user = verificationToken.getUser();
        user.setIsActive(true);
        userRepository.save(user);
        emailVerificationTokenRepository.delete(verificationToken);
        return "Xác thực email thành công. Bạn có thể đăng nhập.";
    }
}
