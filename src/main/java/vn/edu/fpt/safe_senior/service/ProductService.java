package vn.edu.fpt.safe_senior.service;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.request.OrderCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.OrderItemRequest;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.entity.*;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.enums.OrderEnum;
import vn.edu.fpt.safe_senior.enums.PaymentEnum;
import vn.edu.fpt.safe_senior.enums.ProductEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.ProductMapper;
import vn.edu.fpt.safe_senior.repository.*;

import java.math.BigDecimal;
import java.util.ArrayList;
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
    AddressRepository addressRepository;
    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;



    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllProductByStatus("ACTIVE").stream()
                .map(productMapper::toProductResponse)
                .toList();
    }


    @Transactional
    public void buyProduct(OrderCreateRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Address address = addressRepository.findByIdAndUser_Id(request.getAddressId(), user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();
        List<Product> productsToUpdate = new ArrayList<>();
        List<Device> devicesToUpdate = new ArrayList<>();

        for (OrderItemRequest item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            BigDecimal subtotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            total = total.add(subtotal);

            orderItems.add(OrderItem.builder()
                    .product(product)
                    .quantity(item.getQuantity())
                    .unitPrice(product.getPrice())
                    .subtotal(subtotal)
                    .build());
            Device device = deviceRepository.findByProductAndStatus(product, DeviceEnum.INACTIVE.name())
                    .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));
            device.setUser(user);
            devicesToUpdate.add(device);
            product.setStatus(ProductEnum.INACTIVE.name());
            productsToUpdate.add(product);
        }

        Order order = Order.builder()
                .user(user)
                .address(address)
                .totalAmount(total)
                .paymentMethod(request.getPaymentMethod())
                .note(request.getNote())
                .orderStatus(OrderEnum.PENDING.name())
                .paymentStatus(PaymentEnum.PENDING.name())
                .build();
        Order saved = orderRepository.save(order);

        orderItems.forEach(i -> i.setOrder(saved));
        orderItemRepository.saveAll(orderItems);
        productRepository.saveAll(productsToUpdate);
        deviceRepository.saveAll(devicesToUpdate);
    }
}
