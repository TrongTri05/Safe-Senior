package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.response.UserContactResponse;
import vn.edu.fpt.safe_senior.entity.UserContact;

@Mapper(componentModel = "spring")
public interface UserContactMapper {

    @Mapping(source = "device.deviceId", target = "deviceId")
    UserContactResponse toContactResponse(UserContact userContact);
}
