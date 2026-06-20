package vn.edu.fpt.safe_senior.controller.AdminController;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.service.OrderService;
import vn.edu.fpt.safe_senior.service.admin.ManageDeviceService;
import vn.edu.fpt.safe_senior.service.admin.ManageOrderService;

import java.util.List;


@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/orders")
public class ManageOrderController {
    ManageOrderService manageOrderService;

    @GetMapping()
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<OrderResponse> getUserOrders() {
        return manageOrderService.getAllOrder();
    }


    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> approveOrder(@PathVariable String id) {
        manageOrderService.approveOrder(id);
        return ApiResponse.<Void>builder()
                .message("Order approved successfully.")
                .build();
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<Void> cancelOrder(@PathVariable String id) {
        manageOrderService.cancelOrderByAdmin(id);
        return ApiResponse.<Void>builder()
                .message("Order cancelled successfully.")
                .build();
    }
}
