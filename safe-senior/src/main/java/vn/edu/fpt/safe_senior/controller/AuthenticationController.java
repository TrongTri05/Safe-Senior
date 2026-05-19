package vn.edu.fpt.safe_senior.controller;

import com.nimbusds.jose.JOSEException;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.safe_senior.dto.request.LogoutRequest;
import vn.edu.fpt.safe_senior.dto.request.RefreshTokenRequest;
import vn.edu.fpt.safe_senior.dto.request.UseCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.UserLoginRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.AuthenticationResponse;
import vn.edu.fpt.safe_senior.dto.response.UserCreateResponse;
import vn.edu.fpt.safe_senior.service.AuthenticationService;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/register")
    ApiResponse<UserCreateResponse> register(@RequestBody @Valid UseCreateRequest request) {
        return ApiResponse.<UserCreateResponse>builder()
                .result(authenticationService.register(request))
                .build();
    }


    //Login
    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authentication(@RequestBody UserLoginRequest request) {
        var result = authenticationService.authenticated(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }


    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> refreshToken(@RequestBody RefreshTokenRequest request) throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody LogoutRequest request) {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder().build();
    }
}

