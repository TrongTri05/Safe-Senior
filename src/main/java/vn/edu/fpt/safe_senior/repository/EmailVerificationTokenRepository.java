package vn.edu.fpt.safe_senior.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.fpt.safe_senior.entity.EmailVerificationToken;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, String> {
    Optional<EmailVerificationToken> findByToken(String token);

}
