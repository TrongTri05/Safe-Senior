package vn.edu.fpt.safe_senior.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
@AllArgsConstructor
@NoArgsConstructor
public class UserUpdateRequest {
    String name;
    String email;
    String phone;
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dob;
    String gender;
}
