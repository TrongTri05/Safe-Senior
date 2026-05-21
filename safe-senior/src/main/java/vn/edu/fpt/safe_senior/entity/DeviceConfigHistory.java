package vn.edu.fpt.safe_senior.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_config_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DeviceConfigHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
     String id;
    @Column(length = 100)
     String ssid;

    @Column(name = "server_url", length = 255)
     String serverUrl;
    @Column(name = "config_time")
     LocalDateTime configTime;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "device_id",
            referencedColumnName = "device_id"
    )
     Device device;
}
