package vn.edu.fpt.safe_senior.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeedbackRequest {
    @Email
    @NotBlank
    String email;
    @NotBlank
    String description;
}
