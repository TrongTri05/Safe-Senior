-- ================= USERS =================
CREATE TABLE users
(
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    username      NVARCHAR(100),
    email         VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    token_version INT                          DEFAULT 0,
    last_login    DATETIME NULL,
    is_active     BIT                          DEFAULT 0,
    created_at    DATETIME                     DEFAULT GETDATE()
);

-- ================= ROLES =================
CREATE TABLE roles
(
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    name       VARCHAR(50) UNIQUE NOT NULL,
    created_at DATETIME                     DEFAULT GETDATE()
);

-- ================= USER_ROLES =================
CREATE TABLE user_roles
(
    id      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    user_id UNIQUEIDENTIFIER,
    role_id UNIQUEIDENTIFIER,
    UNIQUE (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- ================= DEVICES =================
CREATE TABLE devices
(
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    device_id  VARCHAR(50) UNIQUE NOT NULL,
    user_id    UNIQUEIDENTIFIER NULL,
    name       NVARCHAR(100),
    status     VARCHAR(20)                  DEFAULT 'ACTIVE',
    created_at DATETIME                     DEFAULT GETDATE(),
    CONSTRAINT FK_devices_users FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ================= USER_CONTACTS =================
CREATE TABLE user_contacts
(
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    user_id      UNIQUEIDENTIFIER,
    phone_number VARCHAR(20) NOT NULL,
    is_primary   BIT                          DEFAULT 0,
    created_at   DATETIME                     DEFAULT GETDATE(),
    CONSTRAINT FK_contacts_users FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ================= DEVICE CONFIG HISTORY =================
CREATE TABLE device_config_history
(
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    device_id   VARCHAR(50),
    ssid        VARCHAR(100),
    server_url  VARCHAR(255),
    config_time DATETIME                     DEFAULT GETDATE(),
    CONSTRAINT FK_config_devices FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
);

-- ================= EMERGENCY LOGS =================
CREATE TABLE emergency_logs
(
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    device_id    VARCHAR(50),
    user_id      UNIQUEIDENTIFIER NULL,
    trigger_time DATETIME                     DEFAULT GETDATE(),
    status       VARCHAR(20), -- SUCCESS / FAILED / NO_USER
    note         NVARCHAR(255),
    CONSTRAINT FK_logs_devices FOREIGN KEY (device_id) REFERENCES devices (device_id),
    CONSTRAINT FK_logs_users FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ================= REFRESH TOKENS =================
CREATE TABLE refresh_tokens
(
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    token       VARCHAR(500) UNIQUE NOT NULL,
    user_id     UNIQUEIDENTIFIER    NOT NULL,
    expiry_time DATETIME            NOT NULL,
    revoked     BIT DEFAULT 0,

    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ================= INVALIDATED TOKENS =================
CREATE TABLE invalidated_tokens
(
    id          VARCHAR(36) PRIMARY KEY,
    expiry_time DATETIME DEFAULT GETDATE()
);


CREATE TABLE email_verification_tokens
(
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    user_id     UNIQUEIDENTIFIER NOT NULL,
    token       VARCHAR(255) UNIQUE NOT NULL,
    expiry_time DATETIME         NOT NULL,
    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);