package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.DeviceLocation;

import java.util.Optional;

@Repository
public interface DeviceLocationRepository extends JpaRepository<DeviceLocation, String> {
    Optional<DeviceLocation> findTopByDevice_IdOrderByCreatedAtDesc(String deviceId);
}
