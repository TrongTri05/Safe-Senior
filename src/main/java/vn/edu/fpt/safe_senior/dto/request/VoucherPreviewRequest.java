package vn.edu.fpt.safe_senior.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoucherPreviewRequest {
    String code;
    BigDecimal orderTotal;
}


