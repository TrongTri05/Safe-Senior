package vn.edu.fpt.safe_senior.controller;

import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.*;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.AuthenticationResponse;
import vn.edu.fpt.safe_senior.dto.response.IntrospectResponse;
import vn.edu.fpt.safe_senior.entity.EmailVerificationToken;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.repository.EmailVerificationTokenRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;
import vn.edu.fpt.safe_senior.service.AuthenticationService;

import java.text.ParseException;
import java.time.LocalDateTime;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;
    EmailVerificationTokenRepository emailVerificationTokenRepository;
    UserRepository userRepository;

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

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authentication(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticated(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }


    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authentication(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }


    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder().build();
    }


    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> refreshToken(@RequestBody RefreshTokenRequest request) throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }
}

