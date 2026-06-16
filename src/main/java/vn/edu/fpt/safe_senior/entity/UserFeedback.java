package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Table(name = "user_feedback")
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserFeedback {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    String email;
    String description;
}
