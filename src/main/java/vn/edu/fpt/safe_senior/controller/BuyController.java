package vn.edu.fpt.safe_senior.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.OrderCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.VoucherPreviewRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.VoucherPreviewResponse;
import vn.edu.fpt.safe_senior.service.ProductService;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/buy")
public class BuyController {
    ProductService productService;

    @PostMapping("/orders")
    public ApiResponse<Void> buyProduct(@RequestBody OrderCreateRequest request) {
        productService.buyProduct(request);
        return ApiResponse.<Void>builder()
                .message("Order placed successfully")
                .build();
    }

    @PostMapping("/preview")
    public ApiResponse<VoucherPreviewResponse> previewVoucher(@RequestBody VoucherPreviewRequest request) {
        return ApiResponse.<VoucherPreviewResponse>builder()
                .result(productService.previewVoucher(request))
                .build();
    }
}
