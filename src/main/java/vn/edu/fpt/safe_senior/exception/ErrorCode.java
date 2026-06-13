package vn.edu.fpt.safe_senior.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized Exception", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "INVALID KEY", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be {min} - 15 character", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be {min} - 15 character", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    ROLE_NOT_EXISTED(1007, "ROLE NOT EXISTED", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.FORBIDDEN),
    EMAIL_EXISTED(1009, "Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_ACTIVE(1010, "Account not verify", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_MATCH(1011, "Password not match", HttpStatus.BAD_REQUEST),
    ADDRESS_NOT_FOUND(1012, "Address not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(1013, "You do not have permission", HttpStatus.FORBIDDEN),
    PRODUCT_NOT_FOUND(1014, "Product not found", HttpStatus.NOT_FOUND),
    DEVICE_NOT_AVAILABLE(1015, "Device not available", HttpStatus.BAD_REQUEST),
    DEVICE_NOT_ACTIVE(1016, "Device not active", HttpStatus.BAD_REQUEST),
    USER_ERROR(1017, "User error", HttpStatus.INTERNAL_SERVER_ERROR),
    PASSWORD_DUPLICATE(1019, "New password must not be the same as the old password.", HttpStatus.BAD_REQUEST),
    PASSWORD_ERROR(1020,"Wrong password", HttpStatus.BAD_REQUEST),
    DEVICE_NOT_FOUND(1021, "Device not found", HttpStatus.BAD_REQUEST),
    NOT_ADDRESS_AVAILABLE(1021,"Address not available", HttpStatus.BAD_REQUEST),
    FORGOT_PASSWORD_EMAIL(1022,"If the email address exists, we will send you a recovery link.", HttpStatus.BAD_REQUEST),
    MAX_SOS_CONTACTS(1023,"The limit on the number of phone numbers requiring support has been reached.", HttpStatus.BAD_REQUEST),
    NO_SPIN_LEFT(1024,"No spin left", HttpStatus.BAD_REQUEST),
    VOUCHER_NOT_FOUND(1025,"Voucher not found", HttpStatus.NOT_FOUND),
    LOGIN_ERROR(1018, "Username or Password error", HttpStatus.INTERNAL_SERVER_ERROR);


    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}

