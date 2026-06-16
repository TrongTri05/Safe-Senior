package vn.edu.fpt.safe_senior.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.safe_senior.entity.UserFeedback;

import java.util.Optional;


@Repository
public interface UserFeedbackRepository extends JpaRepository<UserFeedback,String> {
    Optional<UserFeedback> findByEmail(String email);
}
