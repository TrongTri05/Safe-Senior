package vn.edu.fpt.safe_senior.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItemRequest {
    @NotBlank(message = "Product ID is required")
    String productId;
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity;
}
