package vn.edu.fpt.safe_senior.service.admin;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import vn.edu.fpt.safe_senior.dto.response.AdminDeviceResponse;
import vn.edu.fpt.safe_senior.mapper.DeviceMapper;
import vn.edu.fpt.safe_senior.repository.DeviceRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ManageDeviceService {
    DeviceRepository deviceRepository;
    DeviceMapper deviceMapper;

    @PreAuthorize("hasAuthority('ADMIN')")
    public List<AdminDeviceResponse> getAllDevices() {
        return deviceRepository.findAll().stream()
                .map(deviceMapper::toAdminDevice)
                .toList();
    }
}
