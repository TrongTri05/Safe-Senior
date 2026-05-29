package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.request.UseCreateRequest;
import vn.edu.fpt.safe_senior.dto.response.UserResponse;
import vn.edu.fpt.safe_senior.entity.Role;
import vn.edu.fpt.safe_senior.entity.User;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "roles", ignore = true)
    User toUser(UseCreateRequest request);

    UserResponse toUserResponse(User user);

//    @Mapping(target = "roles", ignore = true) // bỏ qua field roles, không map, ignore = true: Field không có trong request, nhưng entity có Set<Role> roles;
//    void updateUser(@MappingTarget User user, UserUpdateRequest request);

    default Set<String> map(Set<Role> roles) {
        if (roles == null) return Set.of();
        return roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
    }
}