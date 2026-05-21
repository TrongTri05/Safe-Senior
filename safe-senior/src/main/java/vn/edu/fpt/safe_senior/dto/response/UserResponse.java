package vn.edu.fpt.safe_senior.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE) //Sét các thuộc tính đều là private
@Builder
public class UserResponse {
    String id;
    String username;
    String email;
    Boolean isActive;
    LocalDateTime createdAt;
    Set<String> roles;
}
