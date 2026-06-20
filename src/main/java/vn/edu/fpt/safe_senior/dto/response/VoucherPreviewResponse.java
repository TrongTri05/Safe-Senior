package vn.edu.fpt.safe_senior.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class VoucherPreviewResponse {
    BigDecimal discount;
}