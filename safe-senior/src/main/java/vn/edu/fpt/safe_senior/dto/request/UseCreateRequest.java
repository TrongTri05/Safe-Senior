package vn.edu.fpt.safe_senior.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class UseCreateRequest {
    @Size(min = 3, max = 15, message = "USERNAME_INVALID")
    String username;
    @Email
    String email;
    String password;
    String confirmPassword;
}
