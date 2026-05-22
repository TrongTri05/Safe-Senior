package vn.edu.fpt.safe_senior.service;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.response.BuyProductResponse;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.Product;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.enums.ProductEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.ProductMapper;
import vn.edu.fpt.safe_senior.repository.DeviceRepository;
import vn.edu.fpt.safe_senior.repository.ProductRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductService {
    ProductRepository productRepository;
    ProductMapper productMapper;
    UserRepository userRepository;
    DeviceRepository deviceRepository;

    public List<ProductResponse> getAllArtists() {
        return productRepository.findAllProductByStatus("ACTIVE").stream()
                .map(productMapper::toProductResponse)
                .toList();
    }


    @Transactional
    public BuyProductResponse buyProduct(String productId) {
        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Device device = deviceRepository
                .findByProductAndStatus(product, DeviceEnum.INACTIVE.name())
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));

        device.setUser(user);
        device.setStatus(DeviceEnum.ACTIVE.name());
        product.setStatus(ProductEnum.INACTIVE.name());
        deviceRepository.save(device);
        productRepository.save(product);


        BuyProductResponse buyProductResponse = new BuyProductResponse();
        buyProductResponse.setName(product.getName());
        buyProductResponse.setDescription(product.getDescription());
        buyProductResponse.setPrice(product.getPrice());
        buyProductResponse.setDeviceId(device.getDeviceId());

        return buyProductResponse;
    }
}
