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
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import vn.edu.fpt.safe_senior.config.PasswordEncoderConfig;
import vn.edu.fpt.safe_senior.dto.request.AddressCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.UseCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.UserUpdateRequest;
import vn.edu.fpt.safe_senior.dto.response.AddressResponse;
import vn.edu.fpt.safe_senior.dto.response.UserResponse;
import vn.edu.fpt.safe_senior.entity.Address;
import vn.edu.fpt.safe_senior.entity.EmailVerificationToken;
import vn.edu.fpt.safe_senior.entity.Role;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.enums.RoleEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.AddressMapper;
import vn.edu.fpt.safe_senior.mapper.UserMapper;
import vn.edu.fpt.safe_senior.repository.AddressRepository;
import vn.edu.fpt.safe_senior.repository.EmailVerificationTokenRepository;
import vn.edu.fpt.safe_senior.repository.RoleRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;

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

    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getUsers() {
        log.info("getUsers");
        return userRepository.findAll();
    }

    @PreAuthorize("#username == authentication.name")
    public UserResponse getUserInfo(String username) {
        return userMapper.toUserResponse(userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }


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


    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}