package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.OrderItem;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem,String> {
    List<OrderItem> findByOrderId(String orderId);
}
