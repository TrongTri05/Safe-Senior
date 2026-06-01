package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderResponse {
    String orderId;
    String orderStatus;
    String paymentStatus;
    String paymentMethod;
    BigDecimal totalAmount;
    LocalDateTime createdAt;
    List<OrderItemResponse> items;
}
