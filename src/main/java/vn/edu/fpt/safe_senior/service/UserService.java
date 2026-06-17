package vn.edu.fpt.safe_senior.service;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.config.PasswordEncoderConfig;
import vn.edu.fpt.safe_senior.dto.request.*;
import vn.edu.fpt.safe_senior.dto.response.*;
import vn.edu.fpt.safe_senior.entity.*;
import vn.edu.fpt.safe_senior.enums.RoleEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.AddressMapper;
import vn.edu.fpt.safe_senior.mapper.UserContactMapper;
import vn.edu.fpt.safe_senior.mapper.UserMapper;
import vn.edu.fpt.safe_senior.repository.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoderConfig passwordEncoderConfig;
    RoleRepository roleRepository;
    EmailVerificationTokenRepository emailVerificationTokenRepository;
    EmailService emailService;
    AddressRepository addressRepository;
    AddressMapper addressMapper;
    PasswordEncoder passwordEncoder;
    UserContactRepository userContactRepository;
    DeviceRepository deviceRepository;
    UserContactMapper userContactMapper;
    UserFeedbackRepository userFeedbackRepository;

    @NonFinal
    @Value("${app.base-url}")
    protected String baseUrl;

    @Transactional
    public UserResponse createUser(UseCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoderConfig.passwordEncoder().encode(user.getPassword()));
        Role userRole = roleRepository.findByName(RoleEnum.USER.name())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        HashSet<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);
        user.setIsActive(false);
        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            String message = exception.getMostSpecificCause().getMessage();
            if (message.contains("email")) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }
            if (message.contains("username")) {
                throw new AppException(ErrorCode.USER_EXISTED);
            }
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        String token = UUID.randomUUID().toString();
        EmailVerificationToken verificationToken = new EmailVerificationToken();
        verificationToken.setToken(token);
        verificationToken.setUser(user);
        verificationToken.setExpiryTime(LocalDateTime.now().plusMinutes(15));
        emailVerificationTokenRepository.save(verificationToken);

        String verifyUrl = baseUrl + "/auth/verify?token=" + token;
        String subject = "Xác thực tài khoản Safe Website";
        String content = "Vui lòng nhấn vào link sau để xác thực tài khoản: " + verifyUrl;
        emailService.sendVerificationEmail(user.getEmail(), subject, content);

        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("#username == authentication.name")
    public UserResponse getUserInfo(String username) {
        return userMapper.toUserResponse(userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    @Transactional
    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse update(String username, UserUpdateRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        userMapper.updateUser(user, request);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public List<AddressResponse> getAddresses(String userId) {
        return addressRepository.findByUserId(userId)
                .stream()
                .map(addressMapper::toAddressResponse)
                .toList();
    }

    public void deleteAddress(String addressId) {
        addressRepository.deleteById(addressId);
    }

    public void setDefaultAddress(String addressId) {
        Address target = addressRepository.findById(addressId)
                .orElseThrow(() -> new AppException(ErrorCode.ADDRESS_NOT_FOUND));
        List<Address> allAddresses = addressRepository.findByUserId(target.getUser().getId());
        allAddresses.forEach(a -> a.setIsDefault(false));
        target.setIsDefault(true);
        addressRepository.saveAll(allAddresses);
    }


    public AddressResponse createAddress(String userId, AddressCreateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Address address = addressMapper.createAddress(request);
        address.setUser(user);
        return addressMapper.toAddressResponse(addressRepository.save(address));
    }

    public void changePass(ChangePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_ERROR);
        }
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_DUPLICATE);
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }


    public List<UserContactResponse> getContacts() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        List<Device> devices = deviceRepository.findAllByUserId(user.getId());

        return devices.stream()
                .flatMap(device -> userContactRepository
                        .findByDevice_DeviceId(device.getDeviceId())
                        .stream())
                .map(userContactMapper::toContactResponse)
                .toList();
    }


    public UserFeedback feedback(FeedbackRequest feedbackRequest) {
        UserFeedback userFeedback = userFeedbackRepository.findByEmail(feedbackRequest.getEmail())
                .orElse(UserFeedback.builder()
                        .email(feedbackRequest.getEmail())
                        .build());
        userFeedback.setDescription(feedbackRequest.getDescription());
        String subject = "SAFE-SENIOR | Cảm ơn bạn đã gửi phản hồi";

        String content = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;
                            border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
                
                    <div style="background:#d90429;padding:24px;text-align:center;">
                        <h1 style="color:white;margin:0;">
                            SAFE-SENIOR
                        </h1>
                    </div>
                
                    <div style="padding:32px;color:#333;">
                        <h2 style="margin-top:0;">
                            Xin chào,
                        </h2>
                
                        <p style="line-height:1.8;">
                            Chúng tôi đã nhận được phản hồi của bạn về website và sản phẩm
                            <strong>SOS-SENIOR</strong>.
                        </p>
                
                        <p style="line-height:1.8;">
                            Đội ngũ SAFE-SENIOR chân thành cảm ơn bạn đã dành thời gian đóng góp ý kiến.
                            Mọi phản hồi đều được chúng tôi ghi nhận và xem xét để cải thiện chất lượng
                            sản phẩm, dịch vụ cũng như trải nghiệm người dùng trong thời gian tới.
                        </p>
                
                        <div style="background:#f8f8f8;padding:16px;border-left:4px solid #d90429;
                                    margin:24px 0;">
                            <strong>Nội dung phản hồi của bạn:</strong>
                            <br><br>
                            %s
                        </div>
                
                        <p style="line-height:1.8;">
                            Nếu cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi qua email
                            <strong>support@sossenior.vn</strong>
                            hoặc hotline
                            <strong>1800-1088</strong>.
                        </p>
                
                        <p style="margin-top:32px;">
                            Trân trọng,<br>
                            <strong>SAFE-SENIOR Technology</strong>
                        </p>
                    </div>
                
                    <div style="background:#111;color:#aaa;text-align:center;
                                padding:16px;font-size:12px;">
                        © 2026 SAFE-SENIOR Technology. All Rights Reserved.
                    </div>
                </div>
                """.formatted(feedbackRequest.getDescription());
        emailService.sendVerificationEmail(feedbackRequest.getEmail(), subject, content);
        return userFeedbackRepository.save(userFeedback);
    }
}