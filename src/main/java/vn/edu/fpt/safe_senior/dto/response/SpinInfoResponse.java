package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpinInfoResponse {
    int remainingSpins;
    int totalSpins;
    List<SpinHistoryItem> history;

    @Data
    @Builder
    public static class SpinHistoryItem {
        int prizeIndex;
        String prizeLabel;
        LocalDateTime spunAt;
    }
}