package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import vn.edu.fpt.safe_senior.enums.VoucherSource;
import vn.edu.fpt.safe_senior.enums.VoucherStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_vouchers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", nullable = false)
    Voucher voucher;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    VoucherStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    VoucherSource source;

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    LocalDateTime receivedAt;

    @Column(name = "used_at")
    LocalDateTime usedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    Order order;
}