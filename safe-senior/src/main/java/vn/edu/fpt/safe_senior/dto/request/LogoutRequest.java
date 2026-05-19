package vn.edu.fpt.safe_senior.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data // thay the Get/Set
@Builder
@NoArgsConstructor // constructor k tham so
@AllArgsConstructor // constructor co tham so
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LogoutRequest {
    String refreshToken;
}
