CREATE DATABASE A;


SET NAMES utf8mb4;

-- ================= PRODUCTS =================
CREATE TABLE products
(
    id               VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name             VARCHAR(150) NOT NULL,
    description      VARCHAR(1000),
    price            DECIMAL(18, 2),
    status           VARCHAR(20)                  DEFAULT 'ACTIVE',
    created_at       DATETIME                     DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME                     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= USERS =================
CREATE TABLE users
(
    id            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username      VARCHAR(100),
    email         VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    is_active     BOOLEAN                      DEFAULT 0,
    created_at    DATETIME                     DEFAULT CURRENT_TIMESTAMP
);

-- ================= ROLES =================
CREATE TABLE roles
(
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name       VARCHAR(50) UNIQUE NOT NULL,
    created_at DATETIME                     DEFAULT CURRENT_TIMESTAMP
);

-- ================= USER_ROLES =================
CREATE TABLE user_roles
(
    id      VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    role_id VARCHAR(36),
    UNIQUE (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- ================= DEVICES =================
CREATE TABLE devices
(
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id  VARCHAR(50) UNIQUE NOT NULL,
    user_id    VARCHAR(36) NULL,
    name       VARCHAR(100),
    status     VARCHAR(20)                  DEFAULT 'ACTIVE',
    product_id VARCHAR(36),
    created_at DATETIME                     DEFAULT CURRENT_TIMESTAMP,
    serverUrl   VARCHAR(255),
    configuredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastConnectedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_devices_users FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT FK_devices_products FOREIGN KEY (product_id) REFERENCES products (id)
);

-- ================= USER_CONTACTS =================
CREATE TABLE user_contacts
(
    id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id      VARCHAR(36),
    phone_number VARCHAR(20) NOT NULL,
    is_primary   BOOLEAN                      DEFAULT 0,
    created_at   DATETIME                     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_contacts_users FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ================= DEVICE CONFIG HISTORY =================
CREATE TABLE device_config_history
(
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id   VARCHAR(50),
    ssid        VARCHAR(100),
    server_url  VARCHAR(255),
    config_time DATETIME                     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_config_devices FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
);

-- ================= EMERGENCY LOGS =================
CREATE TABLE emergency_logs
(
    id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id    VARCHAR(50),
    user_id      VARCHAR(36) NULL,
    trigger_time DATETIME                     DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20), -- SUCCESS / FAILED / NO_USER
    note         VARCHAR(255),
    CONSTRAINT FK_logs_devices FOREIGN KEY (device_id) REFERENCES devices (device_id),
    CONSTRAINT FK_logs_users FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ================= INVALIDATED TOKENS =================
CREATE TABLE invalidated_tokens
(
    id          VARCHAR(36) PRIMARY KEY,
    expiry_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================= EMAIL VERIFICATION TOKENS =================
CREATE TABLE email_verification_tokens
(
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id     VARCHAR(36)         NOT NULL,
    token       VARCHAR(255) UNIQUE NOT NULL,
    expiry_time DATETIME            NOT NULL,
    CONSTRAINT fk_email_verification_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);