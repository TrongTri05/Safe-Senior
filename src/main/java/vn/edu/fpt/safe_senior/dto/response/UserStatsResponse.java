package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class UserStatsResponse {
    long totalOrders;
    long totalDevices;
    long totalAddresses;
}
