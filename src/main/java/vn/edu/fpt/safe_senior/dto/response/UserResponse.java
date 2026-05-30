package vn.edu.fpt.safe_senior.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class UserResponse {
    String id;
    String username;
    String name;
    String phone;
    String gender;
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dob;
    String email;
    Boolean isActive;
    LocalDateTime createdAt;
    Set<String> roles;
}
