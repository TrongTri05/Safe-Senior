package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.fpt.safe_senior.entity.Order;

public interface OrderRepository extends JpaRepository<Order,String> {
}
