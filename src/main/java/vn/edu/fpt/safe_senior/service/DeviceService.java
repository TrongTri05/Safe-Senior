package vn.edu.fpt.safe_senior.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.safe_senior.dto.request.DeviceDisconnectRequest;
import vn.edu.fpt.safe_senior.dto.request.DeviceLocationRequest;
import vn.edu.fpt.safe_senior.dto.request.DeviceRegisterRequest;
import vn.edu.fpt.safe_senior.dto.request.SosContactRequest;
import vn.edu.fpt.safe_senior.dto.response.*;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.DeviceLocation;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.entity.UserContact;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.mapper.DeviceMapper;
import vn.edu.fpt.safe_senior.repository.DeviceLocationRepository;
import vn.edu.fpt.safe_senior.repository.DeviceRepository;
import vn.edu.fpt.safe_senior.repository.UserContactRepository;
import vn.edu.fpt.safe_senior.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DeviceService {
    DeviceRepository deviceRepository;
    UserRepository userRepository;
    DeviceMapper deviceMapper;
    UserContactRepository userContactRepository;
    DeviceLocationRepository deviceLocationRepository;


    public void disconnect(DeviceDisconnectRequest request) {
        Device device = deviceRepository.findByDeviceId(request.getDeviceId()).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));

        device.setStatus(DeviceEnum.INACTIVE.name());
        deviceRepository.save(device);
    }

    public List<DeviceResponse> getUserDevices() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return deviceRepository.findAllByUserId(user.getId())
                .stream()
                .map(deviceMapper::toDeviceResponse)
                .toList();
    }

    public String registerForEsp(DeviceRegisterRequest request) {
        String deviceId = request.getDeviceId();
        Device device = deviceRepository.findByDeviceId(deviceId).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));
        User user = device.getUser();
        if (user == null || !user.getIsActive()) {
            return "INACTIVE";
        }
        device.setStatus(DeviceEnum.ACTIVE.name());
        device.setConfiguredAt(LocalDateTime.now());
        deviceRepository.save(device);
        return "ACTIVE";
    }

    @Transactional
    public void addSosContacts(String deviceId, SosContactRequest request) {
        Device device = deviceRepository.findByDeviceId(deviceId).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));
        if (request.getPhones().size() > 3) {
            throw new AppException(ErrorCode.MAX_SOS_CONTACTS);
        }
        userContactRepository.deleteAllByDeviceId(device.getId());
        List<UserContact> contacts =
                request.getPhones().stream()
                        .map(phone ->
                                UserContact.builder()
                                        .phoneNumber(phone)
                                        .createdAt(LocalDateTime.now())
                                        .device(device)
                                        .build())
                        .toList();
        userContactRepository.saveAll(contacts);
    }

    public List<SosContactResponse> getSosContacts(String deviceId) {
        Device device = deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));

        return userContactRepository.findAllByDeviceId(device.getId())
                .stream()
                .map(c -> SosContactResponse.builder()
                        .phone(c.getPhoneNumber())
                        .build())
                .toList();
    }

    public void updateLocationDevice(String deviceId, DeviceLocationRequest request) {
        Device device = deviceRepository.findByDeviceId(deviceId).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));
        if (!DeviceEnum.ACTIVE.name().equals(device.getStatus())) {
            throw new AppException(ErrorCode.DEVICE_NOT_ACTIVE);
        }
        DeviceLocation location = DeviceLocation.builder()
                .device(device)
                .latitude(BigDecimal.valueOf(request.getLatitude()))   // Vĩ độ (Bắc)
                .longitude(BigDecimal.valueOf(request.getLongitude()))  // Kinh độ (Đông)
                .createdAt(LocalDateTime.now())
                .build();
        deviceLocationRepository.save(location);
    }

    public DeviceLocationResponse findByDeviceIdAndUser(String deviceId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        Device device = deviceRepository.findByDeviceIdAndUserId(deviceId, user.getId()).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_FOUND));
        DeviceLocation deviceLocation = deviceLocationRepository.findTopByDevice_IdOrderByCreatedAtDesc(device.getId()).orElseThrow(() -> new AppException(ErrorCode.DEVICE_LOCATION_NOT_FOUND));
        return deviceMapper.toDeviceLocationResponse(deviceLocation);

    }
}
