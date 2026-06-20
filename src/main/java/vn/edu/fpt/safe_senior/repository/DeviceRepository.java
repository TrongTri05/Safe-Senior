package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.Product;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {
    Optional<Device> findByProductAndStatus(Product product, String status);

    Optional<Device> findByDeviceId(String deviceId);

    List<Device> findAllByUserId(String userId);

    Optional<Device> findByDeviceIdAndUserId(String deviceId, String userId);

    boolean existsByDeviceId(String deviceId);

    Optional<Device> findByProduct(Product product);
}
