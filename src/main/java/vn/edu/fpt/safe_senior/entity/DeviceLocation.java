package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "device_locations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeviceLocation {

    @Id
    @GeneratedValue
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    Device device;

    @Column(name = "latitude", nullable = false, precision = 10, scale = 8)
    BigDecimal N;  // Latitude (Vĩ độ - Bắc)

    @Column(name = "longitude", nullable = false, precision = 11, scale = 8)
    BigDecimal E;  // Longitude (Kinh độ - Đông)

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;
}