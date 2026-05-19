package vn.edu.fpt.safe_senior.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.request.LogoutRequest;
import vn.edu.fpt.safe_senior.dto.request.RefreshTokenRequest;
import vn.edu.fpt.safe_senior.dto.request.UseCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.UserLoginRequest;
import vn.edu.fpt.safe_senior.dto.response.UserCreateResponse;
import vn.edu.fpt.safe_senior.dto.response.AuthenticationResponse;
import vn.edu.fpt.safe_senior.entity.EmailVerificationToken;
import vn.edu.fpt.safe_senior.entity.RefreshToken;
import vn.edu.fpt.safe_senior.entity.Role;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.enums.RoleEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.UserMapper;
import vn.edu.fpt.safe_senior.repository.EmailVerificationTokenRepository;
import vn.edu.fpt.safe_senior.repository.RefreshTokenRepository;
import vn.edu.fpt.safe_senior.repository.RoleRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {

    UserRepository userRepository;
    RefreshTokenRepository refreshTokenRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    RoleRepository roleRepository;
    EmailService emailService;
    EmailVerificationTokenRepository emailVerificationTokenRepository;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${jwt.valid-duration}")
    protected long VALID_DURATION;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    protected long REFRESHABLE_DURATION;

    @Transactional
    public UserCreateResponse register(UseCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash().trim()));
        user.setIsActive(false);
        user.setTokenVersion(0);

        Role userRole = roleRepository.findByName(RoleEnum.USER.name());
        if (userRole == null) {
            throw new AppException(ErrorCode.ROLE_NOT_EXISTED);
        }
        HashSet<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);
        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            log.error("DB ERROR: ", exception);
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setToken(token);
        verificationToken.setUser(user);
        verificationToken.setExpiryTime(LocalDateTime.now().plusMinutes(15));
        emailVerificationTokenRepository.save(verificationToken);

        UserCreateResponse response = userMapper.toUserResponse(user);
        response.setVerificationToken(token);

        String verifyUrl = "http://localhost:8080/music/api/users/verify?token=" + token;
        String subject = "Xác thực tài khoản Website";
        String content = "Vui lòng nhấn vào link sau để xác thực tài khoản: " + verifyUrl;
        emailService.sendVerificationEmail(user.getEmail(), subject, content);

        return response;
    }

    public void verifyAccountStatus(User user) {
        if (!user.isActive()) {
            throw new AppException(ErrorCode.USER_NOT_ACTIVE);
        }
    }

    public AuthenticationResponse authenticated(UserLoginRequest request) {

        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        verifyAccountStatus(user);

        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken();

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .token(refreshToken)
                        .user(user)
                        .expiryTime(LocalDateTime.now().plusSeconds(REFRESHABLE_DURATION))
                        .revoked(false)
                        .build()
        );

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    public String generateAccessToken(User user) {

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        var roles = user.getRoles().stream()
                .map(role -> role.getName())
                .toList();

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("music.com")
                .claim("roles", roles)
                .claim("tokenVersion", user.getTokenVersion())
                .issueTime(new Date())
                .expirationTime(Date.from(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS)
                ))
                .jwtID(UUID.randomUUID().toString())
                .build();

        JWSObject jwsObject = new JWSObject(header, new Payload(claims.toJSONObject()));

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Cannot generate access token", e);
        }
    }

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }


    @Transactional
    public AuthenticationResponse refreshToken(RefreshTokenRequest request) {

        var tokenEntity = refreshTokenRepository
                .findByTokenAndRevokedFalse(request.getToken())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (tokenEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = tokenEntity.getUser();
        verifyAccountStatus(user);

        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);
        String newAccessToken = generateAccessToken(user);
        String newRefreshToken = generateRefreshToken();

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .token(newRefreshToken)
                        .user(user)
                        .expiryTime(LocalDateTime.now().plusSeconds(REFRESHABLE_DURATION))
                        .revoked(false)
                        .build()
        );

        return AuthenticationResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }

    @Transactional
    public void logout(LogoutRequest request) {
        var token = refreshTokenRepository
                .findByTokenAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        logoutAll(token.getUser());
    }

    @Transactional
    public void logoutAll(User user) {
        user.setTokenVersion(user.getTokenVersion() + 1);
        refreshTokenRepository.revokeAllByUserId(user.getId());
        userRepository.save(user);
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanExpiredTokens() {
        refreshTokenRepository.deleteByExpiryTimeBeforeOrRevokedTrue(LocalDateTime.now());
    }

}
