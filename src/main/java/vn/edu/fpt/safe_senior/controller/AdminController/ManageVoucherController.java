package vn.edu.fpt.safe_senior.controller.AdminController;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.VoucherCreateRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.VoucherResponse;
import vn.edu.fpt.safe_senior.service.admin.ManageVoucherService;

import java.util.List;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/voucher")
public class ManageVoucherController {
    ManageVoucherService manageVoucherService;

    @GetMapping()
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<VoucherResponse>> getAllVouchers() {
        return ApiResponse.<List<VoucherResponse>>builder()
                .result(manageVoucherService.getAllVouchers())
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<VoucherResponse> createVoucher(@RequestBody VoucherCreateRequest request){
        return ApiResponse.<VoucherResponse>builder()
                .result(manageVoucherService.createVoucher(request))
                .build();
    }
}
