package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.UserContact;

import java.util.List;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, String> {
    List<UserContact> findAllByDeviceId(String deviceId);
    void deleteAllByDeviceId(String deviceId);
    long countByDeviceId(String deviceId);
}
