package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import vn.edu.fpt.safe_senior.enums.VoucherType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false, unique = true, length = 50)
    String code;

    @Column(name = "discount_type", nullable = false)
    String discountType;

    @Column(name = "discount_value", nullable = false, precision = 10, scale = 2)
    BigDecimal discountValue;

    @Column(name = "min_order_value", precision = 18, scale = 2)
    BigDecimal minOrderValue;

    @Column(name = "max_discount", precision = 18, scale = 2)
    BigDecimal maxDiscount;

    @Column(name = "is_active", nullable = false)
    Boolean isActive;

    @Column(name = "expired_at")
    LocalDate expiredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    LocalDateTime createdAt;
}