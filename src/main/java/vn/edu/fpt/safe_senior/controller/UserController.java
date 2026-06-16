package vn.edu.fpt.safe_senior.controller;

import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.*;
import vn.edu.fpt.safe_senior.dto.response.AddressResponse;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.UserContactResponse;
import vn.edu.fpt.safe_senior.dto.response.UserResponse;
import vn.edu.fpt.safe_senior.entity.About;
import vn.edu.fpt.safe_senior.entity.UserContact;
import vn.edu.fpt.safe_senior.service.AboutService;
import vn.edu.fpt.safe_senior.service.UserService;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/users")
public class UserController {
    UserService userService;
    AboutService aboutService;

    @GetMapping("/address/{id}")
    public List<AddressResponse> address(@PathVariable String id) {
        return userService.getAddresses(id);
    }

    @DeleteMapping("/address/{id}")
    public void deleteAddress(@PathVariable String id) {
        userService.deleteAddress(id);
    }

    @PostMapping("/address/{userId}")
    ApiResponse<AddressResponse> createAddress(@PathVariable String userId, @RequestBody AddressCreateRequest request) {
        return ApiResponse.<AddressResponse>builder()
                .result(userService.createAddress(userId, request))
                .build();
    }

    @PatchMapping("/address/{addressId}/default")
    ApiResponse<Void> setDefaultAddress(@PathVariable String addressId) {
        userService.setDefaultAddress(addressId);
        return ApiResponse.<Void>builder()
                .build();
    }

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UseCreateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .message("Please check your email to activate your account.")
                .build();
    }

    @GetMapping("/username/{username}")
    ApiResponse<UserResponse> getUserByUsername(@PathVariable String username) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserInfo(username))
                .build();
    }

    @PutMapping("/username/{username}")
    ApiResponse<UserResponse> updateUser(@PathVariable String username, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.update(username, request))
                .build();
    }


    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(@RequestBody ChangePasswordRequest request) {
        userService.changePass(request);
        return ApiResponse.<Void>builder()
                .message("Password changed successfully!")
                .build();
    }

    @GetMapping("/contacts")
    public List<UserContactResponse> getContacts() {
        return userService.getContacts();
    }

    @GetMapping("/abouts")
    public List<About> getAllMembers() {
        return aboutService.getAllMembers();
    }

    @PutMapping("/feedback")
    public ApiResponse<Void> feedback(@RequestBody FeedbackRequest feedbackRequest) {
        userService.feedback(feedbackRequest);
        return ApiResponse.<Void>builder()
                .message("Feedback successfully!")
                .build();
    }
}
