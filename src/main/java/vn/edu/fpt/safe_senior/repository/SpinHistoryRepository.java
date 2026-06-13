package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.SpinHistory;

import java.util.List;

@Repository
public interface SpinHistoryRepository extends JpaRepository<SpinHistory, String> {
    List<SpinHistory> findByUserIdOrderBySpunAtDesc(String userId);
}
