package vn.edu.fpt.safe_senior.controller.AdminController;


import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.safe_senior.dto.response.AdminDeviceResponse;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.service.admin.ManageDeviceService;

import java.util.List;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/device")
public class ManageDeviceController {
    ManageDeviceService manageDeviceService;

    @GetMapping()
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<AdminDeviceResponse>> getAllDevices() {
        return ApiResponse.<List<AdminDeviceResponse>>builder()
                .result( manageDeviceService.getAllDevices())
                .build();
    }
}
