# Hướng Dẫn Luồng Authentication - JWT Token Version

## 📋 Tổng Quan Các Thay Đổi

Luồng authentication đã được cải thiện để sử dụng **Security + JWT Token + Token Version** với các tính năng:

1. ✅ **User Login** → Sinh ra Access Token + Refresh Token
2. ✅ **User Logout** → Tăng token version và vô hiệu hoá toàn bộ token
3. ✅ **Token Invalidation** → Access token bị invalidate khi logout
4. ✅ **Auto-Refresh** → Khi access token hết hạn, tự động refresh token mới (client-side)
5. ✅ **Token Validation** → Kiểm tra token version, invalidation status, user active status

---

## 🔧 Các Thay Đổi Chi Tiết

### 1. **InvalidatedToken Entity** (entity/InvalidatedToken.java)
- ✨ Thêm relationship `@ManyToOne` với User
- Lưu trữ access tokens đã bị invalidate để kiểm tra khi authentication
- `id`: Token ID (jti claim từ JWT)
- `expiryTime`: Thời điểm token hết hạn
- `user`: Reference đến user

### 2. **CustomJwtDecoder** (config/CustomJwtDecoder.java)
Cải thiện validation flow:
```
1. Decode JWT signature
2. Kiểm tra token version match với user's token version
3. ✨ Kiểm tra token ID (jti) có trong InvalidatedToken table không
4. Kiểm tra user active status
5. Return decoded JWT nếu hợp lệ
```

### 3. **AuthenticationService** (service/AuthenticationService.java)

#### a) **Login (authenticated method)**: ✅ Không thay đổi
- Sinh ra Access Token + Refresh Token
- Access Token chưa tồn tại trong JWT spec nên không cần lưu

#### b) **Logout (logout method)**: ✨ **CẬP NHẬT**
```java
@Transactional
public void logout(LogoutRequest request) {
    // 1. Lấy refresh token từ DB
    // 2. ✨ MỚI: Invalidate access token
    //    - Decode access token để lấy jti
    //    - Save vào InvalidatedToken table
    // 3. Tăng token version lên 1
    // 4. Revoke tất cả refresh tokens của user
}
```

#### c) **Token Invalidation**: ✨ **HÀM MỚI**
```java
private void invalidateAccessToken(String token, User user) {
    // Decode without validation
    // Extract jti (token ID) + expiry time
    // Save to InvalidatedToken table
}
```

#### d) **Cleanup Expired Tokens**: ✨ **CẬP NHẬT**
- Xoá refresh tokens đã hết hạn hoặc bị revoke
- ✨ Xoá invalidated tokens đã hết hạn (mỗi giờ)

### 4. **LogoutRequest DTO** (dto/request/LogoutRequest.java)
```java
public class LogoutRequest {
    String refreshToken;      // Existing
    String accessToken;       // ✨ MỚI
}
```

### 5. **SecurityConfig** (config/SecurityConfig.java)
- ✨ Thêm `@EnableScheduling` để kích hoạt scheduled cleanup tasks

### 6. **TokenRefreshFilter** ✨ **FILE MỚI** (config/TokenRefreshFilter.java)
- Bắt JwtException khi access token hết hạn
- Log warning + return 401 cho client
- Client sẽ handle refresh token

---

## 📡 Luồng Request/Response

### 1️⃣ **Login Flow**
```
POST /auth/token
{
  "username": "user123",
  "password": "password"
}

Response 200:
{
  "code": 1000,
  "message": "Success",
  "result": {
    "token": "eyJhbGcuOiJIUzUxMiJ9...",    // Access Token
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "authenticated": true
  }
}
```

### 2️⃣ **Logout Flow**
```
POST /auth/logout
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "accessToken": "eyJhbGcuOiJIUzUxMiJ9..."  // ✨ MỚI
}

Response 200:
{
  "code": 1000,
  "message": "Success"
}

Backend Actions:
1. ✨ Invalidate access token → save jti to InvalidatedToken
2. Revoke refresh token
3. Increment user.tokenVersion
4. All tokens generated with old version will be rejected
```

### 3️⃣ **Refresh Token Flow** (unchanged)
```
POST /auth/refresh
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}

Response 200:
{
  "code": 1000,
  "message": "Success",
  "result": {
    "token": "eyJhbGcuOiJIUzUxMiJ9...",    // New Access Token
    "refreshToken": "660e8400-e29b-41d4-a716-446655440000",  // New Refresh Token
    "authenticated": true
  }
}

Backend Actions:
1. Verify refresh token exists and not revoked
2. Generate new access token (same version)
3. Revoke old refresh token
4. Create new refresh token
```

### 4️⃣ **Access Token Expired Flow** (Auto-Refresh - Client-Side)
```
GET /api/v1/profile (with expired access token)

Response 401:
CustomJwtDecoder.decode() → JwtException (token expired)
→ JwtAuthenticationEntryPoint
→ Client receives 401 response

Client Action (Interceptor):
1. Catch 401 response
2. Extract refresh token from localStorage
3. Call POST /auth/refresh
4. Get new access token
5. Retry original request with new token
6. Return response to app
```

---

## 🚀 Cách Implement Auto-Refresh Trên Client

### **Axios Interceptor (Frontend)**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Store tokens in localStorage
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  config => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor - xử lý token expired
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post('http://localhost:8080/api/v1/auth/refresh', {
          token: refreshToken
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data.result;
        setTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### **Logout Handler**
```javascript
const logout = async () => {
  try {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    await axios.post('http://localhost:8080/api/v1/auth/logout', {
      accessToken: accessToken,  // ✨ MỚI
      refreshToken: refreshToken
    });

    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
    // Force clear anyway
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
};
```

---

## 🔒 Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LOGIN                               │
└─────────────────────────────────────────────────────────────┘
                            │
                    POST /auth/token
                            │
                  ┌─────────▼─────────┐
                  │ Verify Credentials│
                  │ & User Active     │
                  └─────────┬─────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   ┌────▼────┐                         ┌────────▼──────┐
   │Access   │                         │ Refresh      │
   │Token    │                         │ Token        │
   │(15 min) │                         │ (100h)       │
   │         │                         │              │
   │- sub    │                         │- user_id    │
   │- roles  │                         │- created_at │
   │- ver    │                         │- revoked    │
   │- jti    │                         │- exp        │
   └────┬────┘                         └────┬─────────┘
        │                                   │
        └─────────────┬─────────────────────┘
                      ▼
            ┌──────────────────┐
            │ Return to Client │
            └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               USE PROTECTED RESOURCE                        │
└─────────────────────────────────────────────────────────────┘
                            │
            GET /api/v1/xxx (Bearer Token)
                            │
                  ┌─────────▼──────────┐
                  │ CustomJwtDecoder   │
                  │ Validate:          │
                  │ • Signature        │
                  │ • Exp time         │
                  │ • Token version    │
                  │ • Invalidation     │
                  │ • User active      │
                  └─────────┬──────────┘
                            │
            ┌───────────────┴────────────────┐
            │                                │
      ✅ VALID                        ❌ EXPIRED/INVALID
            │                                │
     ┌──────▼────────┐           ┌──────────▼────────┐
     │ Process       │           │ Return 401        │
     │ Request       │           │ Unauthorized      │
     └───────────────┘           └──────────┬────────┘
                                           │
                                  Client Interceptor:
                                  • Get refresh token
                                  • POST /auth/refresh
                                  • Get new access token
                                  • Retry request
                                           │
                                  ┌────────▼────────┐
                                  │ Retry Success?  │
                                  └──────┬──────┬───┘
                                         │      │
                                     YES │      │ NO
                                    ┌────▼──┐ ┌─▼─────┐
                                    │Process│ │Logout │
                                    │Req    │ │User   │
                                    └───────┘ └───────┘

┌─────────────────────────────────────────────────────────────┐
│                    USER LOGOUT                              │
└─────────────────────────────────────────────────────────────┘
                            │
      POST /auth/logout (Refresh + Access Token)
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   ┌────▼──────────────┐            ┌──────────▼─────┐
   │ Decode Access    │            │ Revoke Refresh │
   │ Token (no       │            │ Token          │
   │ validation)     │            └────────┬────────┘
   └────┬─────────────┘                    │
        │                                  │
   ┌────▼──────────────────┐               │
   │ Extract jti + exp     │               │
   │ Save to              │               │
   │ InvalidatedToken     │               │
   │ Table                │               │
   └────┬──────────────────┘               │
        │                                  │
        └────────┬─────────────────────────┘
                 │
        ┌────────▼──────────┐
        │ Increment         │
        │ user.tokenVersion │
        │ (logout all)      │
        └────────┬──────────┘
                 │
        ┌────────▼──────────┐
        │ Clear client      │
        │ tokens            │
        └────────────────────┘
```

---

## 🛡️ Security Checks Summary

| Kiểm Tra | Vị Trí | Mục Đích |
|---------|--------|---------|
| JWT Signature | CustomJwtDecoder | Xác thực token không bị tampering |
| Token Expiry | CustomJwtDecoder | Kiểm tra time-based expiry |
| Token Version | CustomJwtDecoder | Detect logout/token revocation |
| Invalidation Status | CustomJwtDecoder ✨ | Detect access token đã bị logout |
| User Active Status | CustomJwtDecoder | Reject tokens từ disabled users |
| Refresh Token Revoked | AuthenticationService | Reject revoked refresh tokens |
| Refresh Token Expired | AuthenticationService | Reject expired refresh tokens |

---

## 📊 Database Schema

### InvalidatedToken Table
```sql
CREATE TABLE invalidated_tokens
(
    id          VARCHAR(36) PRIMARY KEY,           -- Token ID (jti from JWT)
    user_id     UNIQUEIDENTIFIER,                  -- ✨ MỚI: User reference
    expiry_time DATETIME DEFAULT GETDATE(),
    CONSTRAINT fk_invalidated_user FOREIGN KEY (user_id) REFERENCES users (id)
);
```

---

## ⚙️ Configuration

### application.yml
```yaml
jwt:
  signerKey: "1TjXchw5FLoESb63Kc+DFhTARvpWL4jUGCwfGWxuG5SIf/1y/LgJxHnMqaF6A/ij"
  valid-duration: 3600        # Access token: 1 hour (in seconds)
  refreshable-duration: 360000 # Refresh token: 100 hours (in seconds)
```

**Scheduled Cleanup (hourly)**:
- Xoá refresh tokens hết hạn hoặc bị revoke
- Xoá invalidated tokens hết hạn
- Chạy lúc 00:00 mỗi giờ (cron: "0 0 * * * *")

---

## 🧪 Cách Test

### 1. Test Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 2. Test Protected Resource
```bash
curl -X GET http://localhost:8080/api/v1/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### 3. Test Logout
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>",
    "accessToken": "<ACCESS_TOKEN>"
  }'
```

### 4. Test Refresh
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<REFRESH_TOKEN>"
  }'
```

---

## 📝 Notes

1. **Token Version Matching**: Khi user logout, `tokenVersion` tăng lên. Mọi token cũ sẽ bị reject vì version không match.

2. **Access Token Invalidation**: Access tokens được lưu vào database khi logout để ngay cả nếu token version chưa check được, access token cũng bị reject.

3. **Cleanup**: Scheduled task xoá expired tokens mỗi giờ để keep database clean.

4. **Client-Side Auto-Refresh**: Client cần implement interceptor để tự động refresh token khi nhận 401 response.

5. **Time Sync**: Đảm bảo server clock đồng bộ để JWT expiry validation hoạt động chính xác.

---

## ✨ Improvements Made

| Feature | Before | After |
|---------|--------|-------|
| Token Version | ✅ Implemented | ✅ Enhanced validation |
| Access Token Invalidation | ❌ Not implemented | ✅ Save to InvalidatedToken |
| Logout Flow | ⚠️ Basic (revoke refresh) | ✅ Complete (revoke + invalidate + version) |
| Auto-Refresh Response | ❌ Not implemented | ✅ Return 401 + Client handles |
| Cleanup Expired Tokens | ⚠️ Only refresh tokens | ✅ Both refresh + invalidated |
| Security Validation | ⚠️ Missing invalidation check | ✅ 5 security checks |

---

**Generated**: May 19, 2026
**Project**: Safe Senior Authentication Service

