package vn.edu.fpt.safe_senior.dto.request;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressCreateRequest {
    String name;
    String phone;
    String street;
    String district;
    String city;
}
