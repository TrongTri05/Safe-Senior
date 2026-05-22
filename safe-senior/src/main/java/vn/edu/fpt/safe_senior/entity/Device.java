package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "devices")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @Column(name = "device_id")
    String deviceId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;
    String name;
    String status;
    String serverUrl;
    @ManyToOne
    @JoinColumn(name = "product_id")
    Product product;
    @Column(name = "created_at", updatable = false)
    LocalDateTime created;
    @Column(name = "configuredAt")
    LocalDateTime configuredAt;
    @Column(name = "lastConnectedAt")
    LocalDateTime lastConnectedAt;
    @OneToMany(mappedBy = "device")
    List<DeviceConfigHistory> configHistories;
    @OneToMany(mappedBy = "device")
    List<EmergencyLog> emergencyLogs;

    @PrePersist
    public void prePersist() {
        created = LocalDateTime.now();
    }
}
