package vn.edu.fpt.safe_senior.service.admin;


import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.request.VoucherCreateRequest;
import vn.edu.fpt.safe_senior.dto.response.VoucherResponse;
import vn.edu.fpt.safe_senior.entity.Voucher;
import vn.edu.fpt.safe_senior.enums.VoucherType;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.VoucherMapper;
import vn.edu.fpt.safe_senior.repository.VoucherRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ManageVoucherService {
    VoucherRepository voucherRepository;
    VoucherMapper voucherMapper;


    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll()
                .stream()
                .map(this::toVoucherResponseWithExpiry)
                .toList();
    }


    @Transactional
    public VoucherResponse createVoucher(VoucherCreateRequest request) {
        if (voucherRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.VOUCHER_EXISTED);
        }
        if (request.getDiscountType().equals(VoucherType.PERCENT.name())) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0
                    || request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new AppException(ErrorCode.INVALID_DISCOUNT_VALUE);
            }
        } else if (request.getDiscountType().equals(VoucherType.FIXED.name())) {
            if (request.getDiscountValue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.INVALID_DISCOUNT_VALUE);
            }
            request.setMaxDiscount(null);
        } else {
            throw new AppException(ErrorCode.INVALID_DISCOUNT_TYPE);
        }
        if (request.getExpiredAt() != null && request.getExpiredAt().isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.INVALID_EXPIRED_DATE);
        }

        Voucher voucher = voucherMapper.toVoucher(request);
        voucher.setIsActive(true);
        return voucherMapper.toVoucherResponse(voucherRepository.save(voucher));
    }

    public VoucherResponse toVoucherResponseWithExpiry(Voucher voucher) {
        VoucherResponse response = voucherMapper.toVoucherResponse(voucher);
        boolean expired = voucher.getExpiredAt() != null
                && voucher.getExpiredAt().isBefore(LocalDate.now());
        response.setActive(voucher.getIsActive() && !expired);
        return response;
    }
}
