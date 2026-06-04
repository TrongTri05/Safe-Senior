package vn.edu.fpt.safe_senior.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.DeviceDisconnectRequest;
import vn.edu.fpt.safe_senior.dto.request.DeviceRegisterRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.DeviceRegisterResponse;
import vn.edu.fpt.safe_senior.dto.response.DeviceResponse;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.service.DeviceService;
import vn.edu.fpt.safe_senior.service.EmergencyService;

import java.util.List;


@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DeviceController {
    DeviceService deviceService;
    EmergencyService emergencyService;

    @PostMapping("/register")
    public ApiResponse<DeviceRegisterResponse> register(@RequestBody DeviceRegisterRequest request) {
        return ApiResponse.<DeviceRegisterResponse>builder()
                .result(deviceService.register(request))
                .message("Device registered successfully.")
                .build();
    }

    @PostMapping("/disconnect")
    public ApiResponse<String> disconnect(@RequestBody DeviceDisconnectRequest request) {
        deviceService.disconnect(request);
        return ApiResponse.<String>builder()
                .result("OK")
                .message("Device disconnected.")
                .build();
    }


    @PostMapping("/emergency")
    public ApiResponse<String> emergency(@RequestParam String deviceId) {
        emergencyService.handleEmergency(deviceId);
        return ApiResponse.<String>builder()
                .message("Emergency sent successfully")
                .result(deviceId)
                .build();
    }

    @GetMapping("/user-devices")
    public ApiResponse<List<DeviceResponse>> userDevices() {
        return ApiResponse.<List<DeviceResponse>>builder()
                .result(deviceService.getUserDevices())
                .message("User devices retrieved successfully")
                .build();
    }
}

