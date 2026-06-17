package vn.edu.fpt.safe_senior.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCreateRequest {
    String name;
    String description;
    BigDecimal price;
    String status;
    DeviceRequest device;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceRequest {
        String deviceId;
        String name;
    }
}
