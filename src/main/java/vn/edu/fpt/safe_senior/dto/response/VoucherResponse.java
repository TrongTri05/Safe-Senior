package vn.edu.fpt.safe_senior.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;
import vn.edu.fpt.safe_senior.entity.Voucher;
import vn.edu.fpt.safe_senior.mapper.VoucherMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class VoucherResponse {
    VoucherMapper  voucherMapper;
    UUID id;
    String code;
    String discountType;
    BigDecimal discountValue;
    BigDecimal minOrderValue;
    BigDecimal maxDiscount;
    boolean isActive;
    LocalDate expiredAt;
    LocalDateTime createdAt;

    public VoucherResponse toVoucherResponseWithExpiry(Voucher voucher) {
        VoucherResponse response = voucherMapper.toVoucherResponse(voucher);
        boolean expired = voucher.getExpiredAt() != null
                && voucher.getExpiredAt().isBefore(LocalDate.now());
        response.setActive(voucher.getIsActive() && !expired);
        return response;
    }
}
