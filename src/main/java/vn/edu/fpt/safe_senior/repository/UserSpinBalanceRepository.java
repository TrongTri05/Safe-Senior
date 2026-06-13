package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.UserSpinBalance;

import java.util.Optional;

@Repository
public interface UserSpinBalanceRepository extends JpaRepository<UserSpinBalance, String> {
    Optional<UserSpinBalance> findByUserId(String userId);
}
