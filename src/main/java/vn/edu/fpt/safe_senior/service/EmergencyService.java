package vn.edu.fpt.safe_senior.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.EmergencyLog;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.entity.UserContact;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.repository.DeviceRepository;
import vn.edu.fpt.safe_senior.repository.EmergencyLogRepository;
import vn.edu.fpt.safe_senior.repository.UserContactRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmergencyService {
    DeviceRepository deviceRepository;
    EmergencyLogRepository emergencyLogRepository;
    UserContactRepository userContactRepository;

    public void handleEmergency(String deviceId) {
        Device device = deviceRepository.findByDeviceId(deviceId).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));
        if (!DeviceEnum.ACTIVE.name().equals(device.getStatus())) {
            throw new AppException(ErrorCode.DEVICE_NOT_ACTIVE);
        }
        User user = device.getUser();

        if (user == null || !user.getIsActive()) {
            throw new AppException(ErrorCode.USER_ERROR);
        }
        device.setLastConnectedAt(LocalDateTime.now());
        deviceRepository.save(device);
        EmergencyLog logEntity = EmergencyLog.builder()
                .device(device)
                .user(user)
                .triggerTime(LocalDateTime.now())
                .status("SUCCESS")
                .note("Emergency triggered from device " + deviceId)
                .build();
        emergencyLogRepository.save(logEntity);

        List<UserContact> contacts = userContactRepository.findAllByDeviceId(device.getId());

        for (UserContact contact : contacts) {
            log.info("CẢNH BÁO: NGƯỜI DÙNG {} ĐANG CẦN HỖ TRỢ {}", user.getName(), contact.getPhoneNumber());
            log.info("THIẾT BỊ CẢNH BÁO: {}", deviceId);
        }
    }

}


