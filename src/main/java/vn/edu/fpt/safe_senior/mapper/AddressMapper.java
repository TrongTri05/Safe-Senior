package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.request.AddressCreateRequest;
import vn.edu.fpt.safe_senior.dto.response.AddressResponse;
import vn.edu.fpt.safe_senior.entity.Address;
import vn.edu.fpt.safe_senior.entity.User;


@Mapper(componentModel = "spring")
public interface AddressMapper {

    AddressResponse toAddressResponse(Address address);

    Address createAddress(AddressCreateRequest request);
}

