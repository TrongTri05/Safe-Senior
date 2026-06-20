package vn.edu.fpt.safe_senior.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VoucherCreateRequest {
    String code;
    String discountType;
    BigDecimal discountValue;
    BigDecimal maxDiscount;   // nullable - chỉ có giá trị khi discountType = PERCENT
    BigDecimal minOrderValue;
    LocalDate expiredAt;
    private Boolean isActive;
}
