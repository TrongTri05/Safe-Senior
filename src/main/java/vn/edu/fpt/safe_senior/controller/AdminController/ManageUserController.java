package vn.edu.fpt.safe_senior.controller.AdminController;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
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
    public ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(manageUserService.getAllUsers())
                .build();
    }

    @PatchMapping("/user/{id}/deactivate")
    public ApiResponse<Void> deactivateUser(@PathVariable String id) {
        manageUserService.deactivateUser(id);
        return ApiResponse.<Void>builder().build();
    }

    @PatchMapping("/user/{id}/activate")
    public ApiResponse<Void> activateUser(@PathVariable String id) {
        manageUserService.activateUser(id);
        return ApiResponse.<Void>builder().build();
    }
}
