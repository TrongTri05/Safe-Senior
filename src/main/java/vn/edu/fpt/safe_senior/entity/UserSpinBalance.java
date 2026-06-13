package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_spin_balance")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSpinBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;
    int remainingSpins;
    int totalSpins;
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    public void onUpdate() { updatedAt = LocalDateTime.now(); }
}
