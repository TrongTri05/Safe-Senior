package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import vn.edu.fpt.safe_senior.dto.response.DeviceResponse;
import vn.edu.fpt.safe_senior.entity.Device;

@Mapper(componentModel = "spring")
public interface DeviceMapper {

    DeviceResponse toDeviceResponse(Device device);
}
