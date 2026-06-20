package vn.edu.fpt.safe_senior.service.admin;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.edu.fpt.safe_senior.entity.Order;
import vn.edu.fpt.safe_senior.entity.OrderItem;
import vn.edu.fpt.safe_senior.entity.Product;
import vn.edu.fpt.safe_senior.enums.*;
import vn.edu.fpt.safe_senior.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class OrderAutoCancelScheduler {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final DeviceRepository deviceRepository;
    private final UserVoucherRepository userVoucherRepository;


    @Scheduled(fixedRate = 60000)// mỗi 1p
    @Transactional
    public void autoCancelUnpaidBankingOrders() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);

        List<Order> expiredOrders = orderRepository
                .findByOrderStatusAndPaymentMethodAndPaymentStatusAndCreatedAtBefore(
                        OrderEnum.PENDING.name(),
                        PaymentEnum.BANKING.name(),
                        PaymentEnum.PENDING.name(),
                        threshold
                );

        for (Order order : expiredOrders) {
            rollbackAndCancel(order);
        }
    }

    private void rollbackAndCancel(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
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

        userVoucherRepository.findByOrder_Id(order.getId()).ifPresent(uv -> {
            uv.setStatus(VoucherStatus.AVAILABLE.name());
            uv.setUsedAt(null);
            uv.setOrder(null);
            userVoucherRepository.save(uv);
        });

        order.setOrderStatus(OrderEnum.CANCELLED.name());
        orderRepository.save(order);
    }
}
