package vn.edu.fpt.safe_senior.controller.AdminController;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.UserResponse;
import vn.edu.fpt.safe_senior.service.admin.ManageUserService;

import java.util.List;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/manage")
public class ManageUserController {
    ManageUserService manageUserService;

    @GetMapping("/user")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(manageUserService.getAllUsers())
                .build();
    }

    @PatchMapping("/user/{id}/deactivate")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> deactivateUser(@PathVariable String id) {
        manageUserService.deactivateUser(id);
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/user/{id}/activate")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> activateUser(@PathVariable String id) {
        manageUserService.activateUser(id);
        return ApiResponse.<Void>builder().build();
    }
}
