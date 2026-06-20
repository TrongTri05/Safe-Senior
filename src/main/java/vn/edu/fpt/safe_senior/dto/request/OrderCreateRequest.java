package vn.edu.fpt.safe_senior.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderCreateRequest {
    @NotBlank(message = "Address is required")
    String addressId;
    @NotBlank(message = "Payment method is required")
    String paymentMethod;
    String note;
    String voucherCode;
    @NotEmpty(message = "Order must have at least one item")
    List<OrderItemRequest> items;
}
