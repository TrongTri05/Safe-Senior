package vn.edu.fpt.safe_senior.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddressResponse {
     String id;
     String name;
     String phone;
     String street;
     String district;
     String city;
     Boolean isDefault;
}
