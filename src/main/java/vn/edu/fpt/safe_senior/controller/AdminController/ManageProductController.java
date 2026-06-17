package vn.edu.fpt.safe_senior.controller.AdminController;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.safe_senior.dto.request.ProductCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.ProductUpdateRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.service.admin.ManageProductService;

import java.util.List;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("/api/product")
public class ManageProductController {
    ManageProductService manageProductService;

    @GetMapping
    public ApiResponse<List<ProductResponse>> getAllProducts() {
        return ApiResponse.<List<ProductResponse>>builder()
                .result(manageProductService.getAllProducts())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable String id, @RequestBody ProductUpdateRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .result(manageProductService.updateProduct(id, request))
                .build();
    }


    @PostMapping()
    public ApiResponse<ProductResponse> createProduct(@RequestBody ProductCreateRequest request) {
        return ApiResponse.<ProductResponse>builder()
                .result(manageProductService.createProduct(request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteProduct(@PathVariable String id) {
        manageProductService.deleteProductById(id);
        return ApiResponse.<Void>builder()
                .message("Product has been deleted")
                .build();
    }
}

