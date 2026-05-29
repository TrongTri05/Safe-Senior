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
    EMAIL_EXISTED(1009, "Email existed", HttpStatus.BAD_REQUEST),
    USER_NOT_ACTIVE(1010, "Account not verify", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_MATCH(1011, "Password not match", HttpStatus.BAD_REQUEST),
    PRODUCT_NOT_FOUND(2001, "Product not found", HttpStatus.NOT_FOUND),
    DEVICE_NOT_AVAILABLE(2002, "Device not available", HttpStatus.BAD_REQUEST),
    DEVICE_NOT_ACTIVE(2004, "Device not active", HttpStatus.BAD_REQUEST),
    USER_ERROR(2003, "User error", HttpStatus.INTERNAL_SERVER_ERROR),
    LOGIN_ERROR(2005, "Username or Password error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.FORBIDDEN),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN);


    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode statusCode;
}

