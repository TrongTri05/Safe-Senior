package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeviceLocationResponse {
    BigDecimal latitude;  // Latitude (Vĩ độ - Bắc)
    BigDecimal longitude;  // Longitude (Kinh độ - Đông)
    LocalDateTime createdAt;
}
