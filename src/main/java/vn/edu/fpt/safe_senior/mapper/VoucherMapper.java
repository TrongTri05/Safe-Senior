package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.request.VoucherCreateRequest;
import vn.edu.fpt.safe_senior.dto.response.VoucherResponse;
import vn.edu.fpt.safe_senior.dto.response.VoucherUserResponse;
import vn.edu.fpt.safe_senior.entity.UserVoucher;
import vn.edu.fpt.safe_senior.entity.Voucher;

@Mapper(componentModel = "spring")
public interface VoucherMapper {
    VoucherResponse toVoucherResponse(Voucher voucher);


    @Mapping(source = "id", target = "id")
    @Mapping(source = "status",     target = "status")
    @Mapping(source = "source",     target = "source")
    @Mapping(source = "receivedAt", target = "receivedAt")
    @Mapping(source = "usedAt",     target = "usedAt")
    @Mapping(source = "voucher.code",          target = "code")
    @Mapping(source = "voucher.discountType",  target = "discountType")
    @Mapping(source = "voucher.discountValue", target = "discountValue")
    @Mapping(source = "voucher.minOrderValue", target = "minOrderValue")
    @Mapping(source = "voucher.maxDiscount",   target = "maxDiscount")
    @Mapping(source = "voucher.expiredAt",     target = "expiredAt")
    VoucherUserResponse toVoucherUserResponse(UserVoucher userVoucher);

    Voucher toVoucher(VoucherCreateRequest request);
}
