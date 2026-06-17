package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDeviceResponse {
    String deviceId;
    String userId;
    String name;
    String status;
    LocalDateTime created;
    LocalDateTime configuredAt;
    LocalDateTime lastConnectedAt;
}
