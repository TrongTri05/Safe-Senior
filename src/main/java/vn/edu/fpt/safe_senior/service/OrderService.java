package vn.edu.fpt.safe_senior.service;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.entity.Order;
import vn.edu.fpt.safe_senior.entity.OrderItem;
import vn.edu.fpt.safe_senior.entity.Product;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.enums.OrderEnum;
import vn.edu.fpt.safe_senior.enums.ProductEnum;
import vn.edu.fpt.safe_senior.enums.VoucherStatus;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.OrderMapper;
import vn.edu.fpt.safe_senior.repository.*;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {
    UserRepository userRepository;
    OrderRepository orderRepository;
    OrderMapper orderMapper;
    OrderItemRepository orderItemRepository;
    ProductRepository productRepository;
    DeviceRepository deviceRepository;
    UserVoucherRepository userVoucherRepository;

    public List<OrderResponse> getOrderUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toOrderResponseWithVoucher)
                .toList();
    }

    public OrderResponse toOrderResponseWithVoucher(Order order) {
        OrderResponse response = orderMapper.toOrderResponse(order);
        userVoucherRepository.findByOrder_Id(order.getId()).ifPresent(uv -> {
            response.setVoucherCode(uv.getVoucher().getCode());
        });
        response.setDiscountAmount(order.getDiscountAmount());

        return response;
    }

    @PreAuthorize("hasAuthority('ADMIN')")
    public List<OrderResponse> getOrder() {
        return orderRepository.findByOrderStatus(OrderEnum.PENDING.name())
                .stream()
                .map(orderMapper::toOrderResponse)
                .toList();
    }

    @Transactional
    public void cancelOrder(String orderId, String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getUser().getId().equals(user.getId()))
            throw new AppException(ErrorCode.UNAUTHORIZED);
        if (!order.getOrderStatus().equals(OrderEnum.PENDING.name()))
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);

        // Rollback OrderItem
        List<OrderItem> items = orderItemRepository
                .findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStatus(ProductEnum.ACTIVE.name());
            productRepository.save(product);
            deviceRepository.findByProductAndStatus(product, DeviceEnum.SOLD.name())
                    .ifPresent(device -> {
                        device.setUser(null);
                        device.setStatus(DeviceEnum.INACTIVE.name());
                        deviceRepository.save(device);
                    });
        }

        //Rollback voucher
        userVoucherRepository.findByOrder_Id(orderId).ifPresent(userVoucher -> {
            userVoucher.setStatus(VoucherStatus.AVAILABLE.name());
            userVoucher.setUsedAt(null);
            userVoucher.setOrder(null);
            userVoucherRepository.save(userVoucher);
        });

        // Cập nhật order
        order.setOrderStatus(OrderEnum.CANCELLED.name());
        orderRepository.save(order);
    }
}
