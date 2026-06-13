package vn.edu.fpt.safe_senior.controller.AdminController;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.service.OrderService;

import java.util.List;


@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/orders")
public class AdOrderController {
    OrderService orderService;

    @GetMapping
    public List<OrderResponse> getAllOrders() {
        return orderService.getOrder();
    }


//    @PutMapping("/approve/{id}")
//    public ApiResponse<Void> approveOrder(@PathVariable String id) {
//        orderService.approveOrder(id);
//        return ApiResponse.<Void>builder()
//                .message("Order approved successfully.")
//                .build();
//    }
}
