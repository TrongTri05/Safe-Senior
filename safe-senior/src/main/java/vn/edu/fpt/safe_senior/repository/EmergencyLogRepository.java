package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.EmergencyLog;

@Repository
public interface EmergencyLogRepository extends JpaRepository<EmergencyLog, String> {
}