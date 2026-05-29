package vn.edu.fpt.safe_senior.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import vn.edu.fpt.safe_senior.dto.request.DeviceDisconnectRequest;
import vn.edu.fpt.safe_senior.dto.request.DeviceRegisterRequest;
import vn.edu.fpt.safe_senior.dto.response.ApiResponse;
import vn.edu.fpt.safe_senior.dto.response.DeviceRegisterResponse;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.User;
import vn.edu.fpt.safe_senior.enums.DeviceEnum;
import vn.edu.fpt.safe_senior.exception.AppException;
import vn.edu.fpt.safe_senior.exception.ErrorCode;
import vn.edu.fpt.safe_senior.repository.DeviceRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DeviceService {
    DeviceRepository deviceRepository;

    public DeviceRegisterResponse register(DeviceRegisterRequest request) {
        String deviceId = request.getDeviceId();
        Device device = deviceRepository.findByDeviceId(deviceId).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));


        User user = device.getUser();
        if (user == null || !user.getIsActive()) {
            throw new AppException(ErrorCode.USER_ERROR);
        }
        device.setStatus(DeviceEnum.ACTIVE.name());
        device.setConfiguredAt(LocalDateTime.now());
        device.setLastConnectedAt(LocalDateTime.now());
        deviceRepository.save(device);
        return new DeviceRegisterResponse(deviceId);
    }

    public void disconnect(DeviceDisconnectRequest request) {
        Device device = deviceRepository.findByDeviceId(request.getDeviceId()).orElseThrow(() -> new AppException(ErrorCode.DEVICE_NOT_AVAILABLE));

        device.setStatus(DeviceEnum.INACTIVE.name());
        deviceRepository.save(device);
    }
}
