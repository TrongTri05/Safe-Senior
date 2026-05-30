package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import vn.edu.fpt.safe_senior.dto.response.AddressResponse;
import vn.edu.fpt.safe_senior.entity.Address;


@Mapper(componentModel = "spring")
public interface AddressMapper {
    AddressResponse toAddressResponse(Address address);
}
