package vn.edu.fpt.safe_senior.service.admin;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.request.ProductCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.ProductUpdateRequest;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.Product;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.enums.ProductEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.DeviceMapper;
import vn.edu.fpt.safe_senior.mapper.ProductMapper;
import vn.edu.fpt.safe_senior.repository.DeviceRepository;
import vn.edu.fpt.safe_senior.repository.ProductRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ManageProductService {
    ProductRepository productRepository;
    ProductMapper productMapper;
    DeviceRepository deviceRepository;


    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(productMapper::toProductResponse)
                .toList();
    }


    public void deleteProductById(String id) {
        productRepository.deleteById(id);
    }


    public ProductResponse createProduct(ProductCreateRequest request) {
        if (productRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PRODUCT_EXISTED);
        }
        if (request.getDevice() == null) {
            throw new AppException(ErrorCode.DEVICE_NOT_FOUND);
        }
        if (deviceRepository.existsByDeviceId(request.getDevice().getDeviceId())) {
            throw new AppException(ErrorCode.DEVICE_EXISTED);
        }
        Product product = productMapper.toProduct(request);
        Product savedProduct = productRepository.save(product);

        Device device = Device.builder()
                .deviceId(request.getDevice().getDeviceId())
                .name(request.getDevice().getName())
                .status(DeviceEnum.INACTIVE.name())
                .created(LocalDateTime.now())
                .product(savedProduct)
                .serverUrl("http://localhost:8080/api")
                .build();
        deviceRepository.save(device);

        return productMapper.toProductResponse(savedProduct);
    }

    public ProductResponse updateProduct(String id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        if (product.getStatus().equals(ProductEnum.SOLD.name())) {
            throw new AppException(ErrorCode.PRODUCT_NOT_UPDATE);
        }
        product.setUpdatedAt(LocalDateTime.now());
        productMapper.updateProduct(product, request);
        return productMapper.toProductResponse(productRepository.save(product));
    }
}
