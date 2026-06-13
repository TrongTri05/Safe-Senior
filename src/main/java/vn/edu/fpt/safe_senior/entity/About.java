package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Entity
@Table(name = "about")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class About {
    @Id
    @GeneratedValue
    @Column(name = "id")
    UUID id;
    @Column(name = "full_name", nullable = false, length = 100)
    String fullName;
    @Column(name = "position", nullable = false, length = 100)
    String position;
    @Column(name = "description", length = 1000)
    String description;
    @Column(name = "display_order")
    Integer displayOrder;
}
