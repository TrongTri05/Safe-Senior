package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "spin_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpinHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    int prizeIndex;
    String prizeLabel;
    String prizeType;

    @Column(name = "spun_at", updatable = false)
    LocalDateTime spunAt;

    @PrePersist
    public void prePersist() {
        spunAt = LocalDateTime.now();
    }
}
