package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;


@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "invalidated_tokens")
public class InvalidatedToken {

    @Id
    @Column(length = 36)
    String id;

    @Column(name = "expiry_time")
    LocalDateTime expiryTime;

    @PrePersist
    public void prePersist() {
        if (this.expiryTime == null) {
            this.expiryTime = LocalDateTime.now();
        }
    }
}