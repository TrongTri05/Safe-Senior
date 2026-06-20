package vn.edu.fpt.safe_senior.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.service.OrderService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/order")
public class OrderController {
    OrderService orderService;
    @GetMapping("/user-orders")
    public List<OrderResponse> getUserOrders() {
        return orderService.getOrderUser();
    }

    @PostMapping("/{orderId}/cancel")
    public ApiResponse<Void> cancelOrder(@PathVariable String orderId) {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        orderService.cancelOrder(orderId, username);
        return ApiResponse.<Void>builder()
                .message("Order cancelled successfully")
                .build();
    }

    @PostMapping("/{id}/simulate-payment")
    public ApiResponse<Void> simulatePayment(@PathVariable String id) {
        orderService.simulatePaymentSuccess(id);
        return ApiResponse.<Void>builder()
                .message("Payment simulated successfully")
                .build();
    }
}
