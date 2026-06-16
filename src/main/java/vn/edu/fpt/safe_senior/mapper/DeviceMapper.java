package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.response.DeviceLocationResponse;
import vn.edu.fpt.safe_senior.dto.response.DeviceResponse;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.DeviceLocation;

@Mapper(componentModel = "spring")
public interface DeviceMapper {

    DeviceResponse toDeviceResponse(Device device);

    @Mapping(source = "latitude",target = "latitude")
    @Mapping(source = "longitude",target = "longitude")
    DeviceLocationResponse toDeviceLocationResponse(DeviceLocation deviceLocation);
}
