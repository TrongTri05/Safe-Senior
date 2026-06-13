package vn.edu.fpt.safe_senior.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.SpinInfoResponse;
import vn.edu.fpt.safe_senior.dto.response.SpinResponse;
import vn.edu.fpt.safe_senior.service.LuckyService;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/spin")
public class LuckyController {
    LuckyService luckyService;

    @PostMapping("/spin")
    public ApiResponse<SpinResponse> spin() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<SpinResponse>builder()
                .result(luckyService.spin(username))
                .build();
    }

    @GetMapping("/info")
    public ApiResponse<SpinInfoResponse> getSpinInfo() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return ApiResponse.<SpinInfoResponse>builder()
                .result(luckyService.getSpinInfo(username))
                .build();
    }
}
