package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_contacts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserContact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @Column(name = "phone_number", nullable = false, length = 20)
    String phoneNumber;
    @Column(name = "is_primary")
    Boolean primary;
    @Column(name = "created_at")
    LocalDateTime createdAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;
}