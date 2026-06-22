package vn.edu.fpt.safe_senior.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.DeviceDisconnectRequest;
import vn.edu.fpt.safe_senior.dto.request.DeviceLocationRequest;
import vn.edu.fpt.safe_senior.dto.request.DeviceRegisterRequest;
import vn.edu.fpt.safe_senior.dto.request.SosContactRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.DeviceLocationResponse;
import vn.edu.fpt.safe_senior.dto.response.DeviceResponse;
import vn.edu.fpt.safe_senior.dto.response.SosContactResponse;
import vn.edu.fpt.safe_senior.entity.UserContact;
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
    public ApiResponse<String> register(@RequestBody DeviceRegisterRequest request) {
        String status = deviceService.registerForEsp(request);
        return ApiResponse.<String>builder()
                .result(status)
                .message(status.equals("ACTIVE")
                        ? "Device activated successfully."
                        : "Device inactive or unavailable.")
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
        System.out.println(deviceId);
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

    @GetMapping("/user-devices/{deviceId}/sos-contacts")
    ApiResponse<List<SosContactResponse>> getSosContacts(@PathVariable String deviceId) {
        return ApiResponse.<List<SosContactResponse>>builder()
                .result(deviceService.getSosContacts(deviceId))
                .build();
    }

    @PutMapping("/user-devices/{deviceId}/sos-contacts")
    ApiResponse<Void> updateSosContacts(@PathVariable String deviceId, @RequestBody SosContactRequest request) {
        deviceService.addSosContacts(deviceId, request);
        return ApiResponse.<Void>builder()
                .message("SOS contacts add successfully")
                .build();
    }

    @PutMapping("/devices/{deviceId}/location")
    public ApiResponse<Void> updateLocationDevice(@PathVariable String deviceId, @RequestBody DeviceLocationRequest request) {
        System.out.println("deviceId: " + deviceId);
        deviceService.updateLocationDevice(deviceId, request);
        return ApiResponse.<Void>builder()
                .message("Device location updated successfully")
                .build();
    }

    @GetMapping("/devices/find/{deviceId}")
    public ApiResponse<DeviceLocationResponse> findDevice(@PathVariable String deviceId) {
        return ApiResponse.<DeviceLocationResponse>builder()
                .result(deviceService.findByDeviceIdAndUser(deviceId))
                .build();
    }
}

