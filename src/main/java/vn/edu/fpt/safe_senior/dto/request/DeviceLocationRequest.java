package vn.edu.fpt.safe_senior.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeviceLocationRequest {
    String deviceId;
    Double latitude;  // Vĩ độ (Bắc)
    Double longitude; // Kinh độ (Đông)
}
