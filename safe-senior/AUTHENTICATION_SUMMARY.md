# AUTHENTICATION FLOW - QUICK SUMMARY

## 🎯 Mục Đích
Implement luồng authentication chuẩn sử dụng **Security + JWT Token + Token Version** với khả năng:
- ✅ User Login: Sinh ra Access Token + Refresh Token
- ✅ User Logout: Vô hiệu hoá toàn bộ token
- ✅ Auto-Refresh: Tự động refresh khi access token hết hạn

---

## 📝 FILES MODIFIED

### 1. **entity/InvalidatedToken.java** ✨
**Change**: Thêm `@ManyToOne User` relationship
```java
@ManyToOne
@JoinColumn(name = "user_id")
User user;  // ← NEW
```

### 2. **repository/InvalidatedTokenRepository.java** ✨
**Change**: Thêm methods cho cleanup
```java
boolean existsById(String tokenId);
void deleteByExpiryTimeBefore(LocalDateTime time);
```

### 3. **config/CustomJwtDecoder.java** ✨
**Changes**:
- Inject `InvalidatedTokenRepository`
- Check if token ID (jti) exists in InvalidatedToken table
```java
// Get token ID from JWT
String tokenId = jwt.getId();

// Check invalidation
if (tokenId != null && invalidatedTokenRepository.existsById(tokenId)) {
    throw new JwtException("Invalid token");
}
```

### 4. **dto/request/LogoutRequest.java** ✨
**Change**: Thêm `accessToken` field
```java
String refreshToken;    // Existing
String accessToken;     // ← NEW
```

### 5. **service/AuthenticationService.java** ✨
**Changes**:
- Inject `InvalidatedTokenRepository`
- Update `logout()` method: invalidate access token
- Add `invalidateAccessToken()` method: save token to DB
- Update `cleanExpiredTokens()`: delete invalidated tokens

```java
@Transactional
public void logout(LogoutRequest request) {
    // 1. Get refresh token
    // 2. Invalidate access token ← NEW
    // 3. Increment token version
    // 4. Revoke all refresh tokens
}

private void invalidateAccessToken(String token, User user) {
    // Decode token → extract jti + exp time
    // Save to InvalidatedToken table
}
```

### 6. **config/SecurityConfig.java** ✨
**Change**: Thêm `@EnableScheduling`
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableScheduling  // ← NEW
public class SecurityConfig { }
```

### 7. **config/TokenRefreshFilter.java** ✨ NEW FILE
- Bắt `JwtException` khi token hết hạn
- Return 401 cho client
- Client handle retry

---

## 🔄 TOKEN FLOW

### Login
```
POST /auth/token
↓
Generate Access Token (1h) + Refresh Token (100h)
↓
Return both tokens
```

### Make Request
```
GET /api/xxx (Bearer Token)
↓
CustomJwtDecoder validates:
  - Signature
  - Expiry
  - Token version
  - Invalidation status ← NEW
  - User active
↓
✅ Valid → Process request
❌ Invalid/Expired → 401
```

### Logout
```
POST /auth/logout (Access + Refresh Token)
↓
✨ Extract jti from access token
✨ Save to InvalidatedToken table
↓
Increment user.tokenVersion
↓
Revoke all refresh tokens
↓
Client: Clear localStorage
```

### Auto-Refresh (Client-Side)
```
401 Response
↓
Client Interceptor catches 401
↓
Extract refresh token from localStorage
↓
POST /auth/refresh (Refresh Token)
↓
✅ Get new Access Token
↓
Retry original request with new token
↓
Return response to app
```

---

## 🔒 SECURITY LAYERS

| Check | Location | Purpose |
|-------|----------|---------|
| JWT Signature | CustomJwtDecoder | Verify not tampered |
| Expiry Time | CustomJwtDecoder | Check time-based expiry |
| Token Version | CustomJwtDecoder | Detect logout/revocation |
| Invalidation ✨ | CustomJwtDecoder | Detect logout (access token) |
| User Active | CustomJwtDecoder | Reject disabled users |
| Refresh Revoked | AuthenticationService | Reject revoked refresh |
| Refresh Expired | AuthenticationService | Reject expired refresh |

---

## 📊 DATABASE CHANGES

### InvalidatedToken Table Schema
```sql
CREATE TABLE invalidated_tokens (
    id          VARCHAR(36) PRIMARY KEY,           -- jti from JWT
    user_id     UNIQUEIDENTIFIER,                  -- ← NEW
    expiry_time DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_invalidated_user 
        FOREIGN KEY (user_id) REFERENCES users (id)
);
```

---

## 🚀 CLIENT IMPLEMENTATION

### JavaScript/TypeScript (Axios)
```javascript
// 1. Request Interceptor: Add token
api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 2. Response Interceptor: Auto-refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Call /auth/refresh endpoint
            // Get new token
            // Retry original request
        }
    }
);

// 3. Logout
await api.post('/auth/logout', {
    refreshToken: token,
    accessToken: accessToken  // ← NEW
});
```

See `CLIENT_AUTO_REFRESH_EXAMPLE.ts` for complete implementation.

---

## ⚡ KEY IMPROVEMENTS

| Feature | Before | After | Benefit |
|---------|--------|-------|---------|
| Access Token Invalidation | ❌ None | ✅ DB-backed | Prevent token reuse after logout |
| Logout Completeness | ⚠️ Partial | ✅ Complete | Invalidate all sessions + versions |
| Token Validation | ⚠️ 4 checks | ✅ 7 checks | Enhanced security |
| Scheduled Cleanup | ⚠️ Refresh only | ✅ All tokens | Keep DB clean |
| Auto-Refresh Support | ❌ Manual | ✅ 401 handler | Better UX |

---

## 📋 CONFIGURATION

### application.yml
```yaml
jwt:
  signerKey: "1TjXchw5FLoESb63Kc+DFhTARvpWL4jUGCwfGWxuG5SIf/1y/LgJxHnMqaF6A/ij"
  valid-duration: 3600        # 1 hour
  refreshable-duration: 360000 # 100 hours
```

### Cleanup Schedule
```
Hourly: 0 0 * * * * (00:00 every hour)
- Delete expired refresh tokens
- Delete invalidated tokens past expiry
```

---

## ✅ TESTING CHECKLIST

- [ ] **Login**: Generate access + refresh tokens
- [ ] **Protected Request**: Send with access token works
- [ ] **Logout**: Following requests return 401
- [ ] **Refresh**: Get new access token within expiry window
- [ ] **Access Token Invalidation**: After logout, old access token rejected
- [ ] **Token Version**: After logout, all old tokens rejected
- [ ] **Auto-Refresh**: 401 response triggers refresh automatically (client)
- [ ] **Concurrent Requests**: Multiple 401s don't trigger multiple refreshes
- [ ] **Refresh Expiry**: Refresh token expires after 100 hours
- [ ] **User Disabled**: Disabled user tokens rejected

---

## 📞 SUPPORT

For detailed flow diagram and client-side implementation, see:
- `AUTHENTICATION_FLOW.md` - Complete documentation
- `CLIENT_AUTO_REFRESH_EXAMPLE.ts` - TypeScript example

---

**Status**: ✅ Implemented & Compiled Successfully
**Java Version**: 21
**Spring Boot**: 4.0.6
**Last Updated**: May 19, 2026

