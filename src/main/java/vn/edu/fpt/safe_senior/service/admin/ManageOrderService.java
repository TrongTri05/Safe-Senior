package vn.edu.fpt.safe_senior.service.admin;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.entity.*;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.enums.OrderEnum;
import vn.edu.fpt.safe_senior.enums.ProductEnum;
import vn.edu.fpt.safe_senior.enums.VoucherStatus;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.OrderMapper;
import vn.edu.fpt.safe_senior.repository.*;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ManageOrderService {
    OrderRepository orderRepository;
    OrderMapper orderMapper;
    UserVoucherRepository userVoucherRepository;
    OrderItemRepository orderItemRepository;
    ProductRepository productRepository;
    DeviceRepository deviceRepository;
    UserSpinBalanceRepository userSpinBalanceRepository;

    public List<OrderResponse> getAllOrder() {
        return orderRepository.findAll()
                .stream()
                .map(this::toOrderResponseWithVoucher)
                .toList();
    }

    private OrderResponse toOrderResponseWithVoucher(Order order) {
        OrderResponse response = orderMapper.toOrderResponse(order);
        userVoucherRepository.findByOrder_Id(order.getId()).ifPresent(uv -> {
            response.setVoucherCode(uv.getVoucher().getCode());
        });
        response.setDiscountAmount(order.getDiscountAmount());
        return response;
    }

    @Transactional
    public void approveOrder(String orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));
        if (!order.getOrderStatus().equals(OrderEnum.PENDING.name())) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CONFIRM);
        }

        User user = order.getUser();
        BigDecimal discount = order.getTotalAmount();

        if (discount.compareTo(BigDecimal.valueOf(500)) >= 0) {
            UserSpinBalance userSpinBalance = userSpinBalanceRepository.findByUserId(user.getId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
            userSpinBalance.setRemainingSpins(userSpinBalance.getRemainingSpins() + 1);
            userSpinBalanceRepository.save(userSpinBalance);
        }
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            deviceRepository.findByProductAndStatus(product, DeviceEnum.SOLD.name())
                    .ifPresent(device -> {
                        device.setStatus(DeviceEnum.OFFLINE.name());
                        deviceRepository.save(device);
                    });
        }

        order.setOrderStatus(OrderEnum.CONFIRMED.name());
        orderRepository.save(order);
    }

    @Transactional
    public void cancelOrderByAdmin(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (order.getOrderStatus().equals(OrderEnum.CANCELLED.name())
                || order.getOrderStatus().equals(OrderEnum.DELIVERED.name())) {
            throw new AppException(ErrorCode.ORDER_CANNOT_CANCEL);
        }
        // Rollback OrderItem
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = item.getProduct();
            product.setStatus(ProductEnum.ACTIVE.name());
            productRepository.save(product);

            deviceRepository.findByProduct(product).ifPresent(device -> {
                device.setUser(null);
                device.setStatus(DeviceEnum.INACTIVE.name());
                deviceRepository.save(device);
            });
        }

        // Rollback voucher
        userVoucherRepository.findByOrder_Id(orderId).ifPresent(userVoucher -> {
            userVoucher.setStatus(VoucherStatus.AVAILABLE.name());
            userVoucher.setUsedAt(null);
            userVoucher.setOrder(null);
            userVoucherRepository.save(userVoucher);
        });

        order.setOrderStatus(OrderEnum.CANCELLED.name());
        orderRepository.save(order);
    }
}
