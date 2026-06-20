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
import vn.edu.fpt.safe_senior.dto.request.VoucherPreviewRequest;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.dto.response.VoucherPreviewResponse;
import vn.edu.fpt.safe_senior.entity.*;
import vn.edu.fpt.safe_senior.enums.*;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.ProductMapper;
import vn.edu.fpt.safe_senior.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
    VoucherRepository voucherRepository;
    UserVoucherRepository userVoucherRepository;


    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllProductByStatus("ACTIVE").stream()
                .map(productMapper::toProductResponse)
                .toList();
    }

    private boolean isVoucherUsable(Voucher voucher) {
        if (!voucher.getIsActive()) return false;
        if (voucher.getExpiredAt() != null && voucher.getExpiredAt().isBefore(LocalDate.now())) {
            return false;
        }
        return true;
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
            device.setStatus(DeviceEnum.SOLD.name());
            devicesToUpdate.add(device);
            product.setStatus(ProductEnum.SOLD.name());
            productsToUpdate.add(product);
        }

        BigDecimal discount = BigDecimal.ZERO;
        UserVoucher userVoucherToUpdate = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCode(request.getVoucherCode())
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

            if (!isVoucherUsable(voucher)) {
                throw new AppException(ErrorCode.VOUCHER_EXPIRED);
            }

            List<UserVoucher> userVouchers = userVoucherRepository
                    .findAllByUser_IdAndVoucher_Id(user.getId(), voucher.getId());

            UserVoucher userVoucher = userVouchers.stream()
                    .filter(uv -> uv.getStatus().equals(VoucherStatus.AVAILABLE.name()))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_OWNED));

            if (voucher.getMinOrderValue() != null
                    && total.compareTo(voucher.getMinOrderValue()) < 0) {
                throw new AppException(ErrorCode.ORDER_NOT_ENOUGH_FOR_VOUCHER);
            }

            if (voucher.getDiscountType().equals(VoucherType.PERCENT.name())) {
                discount = total.multiply(voucher.getDiscountValue())
                        .divide(BigDecimal.valueOf(100));
                if (voucher.getMaxDiscount() != null
                        && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                    discount = voucher.getMaxDiscount();
                }
            } else {
                discount = voucher.getDiscountValue();
            }

            if (discount.compareTo(total) > 0) {
                discount = total;
            }

            userVoucher.setStatus(VoucherStatus.USED.name());
            userVoucher.setUsedAt(LocalDateTime.now());
            userVoucherToUpdate = userVoucher;
        }

        BigDecimal finalTotal = total.subtract(discount);

        Order order = Order.builder()
                .user(user)
                .address(address)
                .totalAmount(finalTotal)
                .discountAmount(discount)
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

        if (userVoucherToUpdate != null) {
            userVoucherToUpdate.setOrder(saved);
            userVoucherRepository.save(userVoucherToUpdate);
        }
    }



    public VoucherPreviewResponse previewVoucher(VoucherPreviewRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Voucher voucher = voucherRepository.findByCode(request.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (!isVoucherUsable(voucher)) {
            throw new AppException(ErrorCode.VOUCHER_EXPIRED);
        }

        List<UserVoucher> userVouchers = userVoucherRepository
                .findAllByUser_IdAndVoucher_Id(user.getId(), voucher.getId());

        boolean hasAvailable = userVouchers.stream()
                .anyMatch(uv -> uv.getStatus().equals(VoucherStatus.AVAILABLE.name()));

        if (!hasAvailable) {
            boolean hasAny = !userVouchers.isEmpty();
            throw new AppException(hasAny ? ErrorCode.VOUCHER_ALREADY_USED : ErrorCode.VOUCHER_NOT_OWNED);
        }

        if (voucher.getMinOrderValue() != null
                && request.getOrderTotal().compareTo(voucher.getMinOrderValue()) < 0) {
            throw new AppException(ErrorCode.ORDER_NOT_ENOUGH_FOR_VOUCHER);
        }

        BigDecimal discount;
        if (voucher.getDiscountType().equals(VoucherType.PERCENT.name())) {
            discount = request.getOrderTotal().multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100));
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else {
            discount = voucher.getDiscountValue();
        }

        if (discount.compareTo(request.getOrderTotal()) > 0) {
            discount = request.getOrderTotal();
        }

        return VoucherPreviewResponse.builder().discount(discount).build();
    }
}
