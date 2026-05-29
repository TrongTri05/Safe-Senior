package vn.edu.fpt.safe_senior.controller;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.BuyProductResponse;
import vn.edu.fpt.safe_senior.service.ProductService;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/buy")
public class BuyController {
    ProductService productService;
    @PostMapping("/{id}")
    public ApiResponse<BuyProductResponse> buyProduct(
            @PathVariable String id) {
        return ApiResponse.<BuyProductResponse>builder()
                .result(productService.buyProduct(id))
                .message("Product successfully buy")
                .build();
    }
}
