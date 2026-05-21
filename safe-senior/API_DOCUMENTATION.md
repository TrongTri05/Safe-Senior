# API ENDPOINTS DOCUMENTATION

## Base URL
```
http://localhost:8080/api/v1/auth
```

---

## 1. LOGIN ENDPOINT

### POST `/auth/token`

**Description**: Xác thực user và sinh ra access token + refresh token

**Request**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Response (200 OK)**:
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsI...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "authenticated": true
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "code": 1006,
  "message": "Unauthenticated"
}
```

**Response (404 Not Found)**:
```json
{
  "code": 1005,
  "message": "User not existed"
}
```

**Errors**:
- `1006`: Invalid credentials
- `1005`: User not found
- `1010`: Account not verified/activated

**Token Claims**:
```json
{
  "sub": "testuser",                       // Username
  "iss": "music.com",
  "roles": ["USER"],                       // User roles
  "tokenVersion": 0,                       // Token version for logout detection
  "iat": 1684756800,                       // Issued at
  "exp": 1684760400,                       // Expires at (1 hour from now)
  "jti": "550e8400-e29b-41d4-a716-..."  // JWT ID (for invalidation)
}
```

---

## 2. REFRESH TOKEN ENDPOINT

### POST `/auth/refresh`

**Description**: Refresh access token using refresh token

**Request**:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK)**:
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsI...",
    "refreshToken": "660e8400-e29b-41d4-a716-446655440001",
    "authenticated": true
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "code": 1006,
  "message": "Unauthenticated"
}
```

**Errors**:
- `1006`: Missing/invalid/expired/revoked refresh token

**Behavior**:
- ✅ Generates new access token (1 hour validity)
- ✅ Generates new refresh token (100 hours validity)
- ✅ Revokes old refresh token
- ✅ Maintains same token version
- ✅ Each refresh should be called before token expires

---

## 3. LOGOUT ENDPOINT

### POST `/auth/logout`

**Description**: Logout user and invalidate all tokens

**Request**:
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsI..."
}
```

**Response (200 OK)**:
```json
{
  "code": 1000,
  "message": "Success"
}
```

**Response (401 Unauthorized)**:
```json
{
  "code": 1006,
  "message": "Unauthenticated"
}
```

**Backend Actions**:
1. ✨ Extract JWT ID (jti) from access token
2. ✨ Save to InvalidatedToken table with expiry time
3. Increment user.tokenVersion by 1
4. Revoke ALL refresh tokens for user (set revoked = true)
5. Save user to database

**After Logout**:
- ❌ Old access token → Rejected (in InvalidatedToken + version mismatch)
- ❌ Old refresh token → Rejected (is revoked)
- ❌ Any token with old version → Rejected (version mismatch)
- ✅ Only way to continue → User must login again

---

## 4. REGISTER ENDPOINT

### POST `/auth/register`

**Description**: Create new user account

**Request**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK)**:
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "newuser",
    "email": "user@example.com",
    "verificationToken": "abc123def456"
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "code": 1002,
  "message": "User existed"
}
```

```json
{
  "code": 1009,
  "message": "Email existed"
}
```

**Errors**:
- `1002`: Username already exists
- `1009`: Email already exists
- `1003`: Username length invalid
- `1004`: Password length invalid

**Behavior**:
- ✅ Creates user with `isActive = false`
- ✅ Sends verification email
- ✅ User must click link to activate account
- ✅ Token version initialized to 0

---

## 5. PROTECTED ENDPOINTS

### GET `/profile` (Example Protected Endpoint)

**Request Header**:
```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsI...
```

**Response (200 OK)**:
```json
{
  "code": 1000,
  "message": "Success",
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "testuser",
    "email": "user@example.com"
  }
}
```

**Response (401 Unauthorized - Missing Token)**:
```json
{
  "code": 1006,
  "message": "Unauthenticated"
}
```

**Response (401 Unauthorized - Invalid/Expired Token)**:
```json
{
  "code": 1006,
  "message": "Unauthenticated"
}
```

**Custom Error Scenarios**:

1. **Token Signature Invalid**:
   - Cause: Token tampered
   - Response: 401 Unauthorized

2. **Token Expired**:
   - Cause: Issue time > current time (1 hour passed)
   - Response: 401 Unauthorized
   - Action: Client should call `/auth/refresh`

3. **Token Version Mismatch**:
   - Cause: User logged out, token version incremented
   - Response: 401 Unauthorized
   - Action: Client must login again

4. **Token Invalidated** ✨ NEW:
   - Cause: User logged out, access token saved to InvalidatedToken table
   - Response: 401 Unauthorized
   - Action: Client must login again

5. **User Inactive**:
   - Cause: User account disabled
   - Response: 401 Unauthorized
   - Action: Contact admin

---

## TOKEN LIFECYCLE DIAGRAM

```
Timeline (X axis = time)
0h          1h              100h
├──────────────┼─────────────────┼─────────────
│              │                 │
│ Login        │ Refresh         │ Auto-expire
│ Generated    │ Possible        │
│              │                 │
│ Access Token │ Access Token    │ Refresh Token
│ (1h exp)     │ Valid until 1h  │ Exp
│              │                 │
│ Refresh Token│ New Refresh     │
│ (100h exp)   │ Token Generated │
│              │ (100h exp)      │
│              │                 │
└──────────────┴─────────────────┴─────────────

Logout at any point:
- Invalidate current Access Token (save to DB)
- Revoke current Refresh Token
- Increment Token Version
- All future requests rejected
```

---

## CURL EXAMPLES

### 1. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }' \
  | jq .
```

### 2. Get Profile (Protected)
```bash
curl -X GET http://localhost:8080/api/v1/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..." \
  | jq .
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "550e8400-e29b-41d4-a716-446655440000"
  }' \
  | jq .
```

### 4. Logout
```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "accessToken": "eyJhbGciOiJIUzUxMiJ9..."
  }' \
  | jq .
```

### 5. Register
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "SecurePass123"
  }' \
  | jq .
```

---

## ERROR CODES

| Code | HTTP | Message | Action |
|------|------|---------|--------|
| 1000 | 200 | Success | OK |
| 1001 | 400 | Invalid Key | Check request format |
| 1002 | 400 | User existed | Use different username |
| 1003 | 400 | Username invalid | 3-15 characters |
| 1004 | 400 | Password invalid | 8-15 characters |
| 1005 | 404 | User not existed | Check username |
| 1006 | 401 | Unauthenticated | Login required |
| 1007 | 403 | Unauthorized | Insufficient permissions |
| 1009 | 400 | Email existed | Use different email |
| 1010 | 400 | Account not verified | Verify email first |
| 9999 | 500 | Uncategorized Exception | Server error |

---

## SECURITY HEADERS

### Recommended Client Headers
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
X-Refresh-Token: <REFRESH_TOKEN>  // Optional, for auto-refresh from header
```

### Response Headers
```
Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict
// If using cookie-based refresh tokens
```

---

## RATE LIMITING (NOT YET IMPLEMENTED)

Recommendations:
- `/auth/token`: 5 attempts per minute per IP
- `/auth/refresh`: 10 attempts per minute per user
- Protected endpoints: Based on user role

---

## PERFORMANCE NOTES

### Token Validation Speed
- JWT decode + validation: ~1-2ms
- Database checks (user, invalidation): ~5-10ms
- Total auth time per request: ~10-15ms

### Optimization Tips
1. Cache user roles if frequently accessed
2. Use read replicas for user lookups
3. Implement token cache with TTL
4. Consider Redis for InvalidatedToken cache

---

## MIGRATION GUIDE

If upgrading from old authentication:

1. ✅ Deploy new code
2. ✅ New users: Get new token format automatically
3. ⚠️ Old users: Existing tokens remain valid until expiry
4. ⚠️ After user logout: Access token invalidated
5. ✅ All new logins: Use updated authentication flow

---

## TROUBLESHOOTING

### 401 Token Expired
```
Cause: Access token expired (1 hour)
Solution: Call POST /auth/refresh with refresh token
Browser Console: Watch for 401 → automatic retry
```

### 401 Invalid Token
```
Cause: User logged out (token version changed)
Solution: Redirect to login page
Recovery: Full re-authentication required
```

### Token Version Mismatch
```
Cause: User has multiple devices logged in, logout one device
Solution: All devices must re-login
Prevention: Use long refresh token expiry or per-device tracking
```

---

**Version**: 1.0
**Last Updated**: May 19, 2026
**Stability**: Stable ✅

