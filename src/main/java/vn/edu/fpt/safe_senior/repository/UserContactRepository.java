package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.UserContact;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, String> {
    List<UserContact> findAllByDeviceId(String deviceId);
    void deleteAllByDeviceId(String deviceId);

    List<UserContact> findByDevice_DeviceId(String deviceId);
}
