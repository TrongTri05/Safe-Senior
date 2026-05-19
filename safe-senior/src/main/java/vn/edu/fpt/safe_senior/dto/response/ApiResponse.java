package vn.edu.fpt.safe_senior.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data // thay the Get/Set
@Builder
@NoArgsConstructor // constructor k tham so
@AllArgsConstructor // constructor co tham so
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // khi null du lieu se k dc tra ve
public class ApiResponse <T> {
    @Builder.Default
    int code = 1000;
    String message;
    T result;
}
