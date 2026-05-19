package vn.edu.fpt.safe_senior.config;

import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import vn.edu.fpt.safe_senior.repository.UserRepository;

import javax.crypto.spec.SecretKeySpec;


@Component
@Slf4j
@RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {

    private final UserRepository userRepository;

    @Value("${jwt.signerKey}")
    private String signerKey;

    private NimbusJwtDecoder decoder;

    private NimbusJwtDecoder getDecoder() {
        if (decoder == null) {
            synchronized (this) {
                if (decoder == null) {
                    SecretKeySpec key = new SecretKeySpec(signerKey.getBytes(), "HS512");
                    decoder = NimbusJwtDecoder.withSecretKey(key)
                            .macAlgorithm(MacAlgorithm.HS512)
                            .build();
                }
            }
        }
        return decoder;
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            Jwt jwt = getDecoder().decode(token);

            String username = jwt.getSubject();

            Object claim = jwt.getClaim("tokenVersion");
            Integer tokenVersion = (claim instanceof Number)
                    ? ((Number) claim).intValue()
                    : null;

            if (username == null || tokenVersion == null) {
                log.warn("JWT invalid: missing subject or tokenVersion");
                throw new JwtException("Invalid token");
            }

            var user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.warn("JWT invalid: user not found {}", username);
                        return new JwtException("Invalid token");
                    });

            if (!user.isActive()) {
                log.warn("JWT invalid: user disabled {}", username);
                throw new JwtException("Invalid token");
            }

            if (!tokenVersion.equals(user.getTokenVersion())) {
                log.warn("JWT invalid: version mismatch for user {}", username);
                throw new JwtException("Invalid token");
            }

            return jwt;

        } catch (JwtException e) {
            log.warn("JWT decode failed: {}", e.getMessage());
            throw e;
        }
    }
}
