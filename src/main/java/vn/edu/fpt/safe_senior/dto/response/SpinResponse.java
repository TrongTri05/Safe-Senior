package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpinResponse {
    int prizeIndex;
    String prizeLabel;
    int remainingSpins;
    int totalSpins;
}
