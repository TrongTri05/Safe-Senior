CREATE
DATABASE A;


SET NAMES utf8mb4;

-- ================= PRODUCTS =================
CREATE TABLE products
(
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(1000),
    price       DECIMAL(18, 2),
    status      VARCHAR(20)             DEFAULT 'ACTIVE',
    created_at  DATETIME                DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME                DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================= USERS =================
CREATE TABLE users
(
    id            VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username      VARCHAR(100),
    email         VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    is_active     BOOLEAN                 DEFAULT 0,
    created_at    DATETIME                DEFAULT CURRENT_TIMESTAMP
);

-- ================= ROLES =================
CREATE TABLE roles
(
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name       VARCHAR(50) UNIQUE NOT NULL,
    created_at DATETIME                DEFAULT CURRENT_TIMESTAMP
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
    id              VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id       VARCHAR(50) UNIQUE NOT NULL,
    user_id         VARCHAR(36) NULL,
    name            VARCHAR(100),
    status          VARCHAR(20)             DEFAULT 'ACTIVE',
    product_id      VARCHAR(36),
    created_at      DATETIME                DEFAULT CURRENT_TIMESTAMP,
    serverUrl       VARCHAR(255),
    configuredAt    DATETIME                DEFAULT CURRENT_TIMESTAMP,
    lastConnectedAt DATETIME                DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_devices_users FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT FK_devices_products FOREIGN KEY (product_id) REFERENCES products (id)
);

-- ================= USER_CONTACTS =================
CREATE TABLE user_contacts
(
    id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id      VARCHAR(36),
    phone_number VARCHAR(20) NOT NULL,
    is_primary   BOOLEAN                 DEFAULT 0,
    created_at   DATETIME                DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_contacts_users FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ================= DEVICE CONFIG HISTORY =================
CREATE TABLE device_config_history
(
    id          VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id   VARCHAR(50),
    ssid        VARCHAR(100),
    server_url  VARCHAR(255),
    config_time DATETIME                DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_config_devices FOREIGN KEY (device_id) REFERENCES devices (device_id) ON DELETE CASCADE
);

-- ================= EMERGENCY LOGS =================
CREATE TABLE emergency_logs
(
    id           VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id    VARCHAR(50),
    user_id      VARCHAR(36) NULL,
    trigger_time DATETIME                DEFAULT CURRENT_TIMESTAMP,
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

CREATE TABLE addresses
(
    id      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL, [
    name]
    VARCHAR
(
    100
) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    is_default BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_addresses_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );


CREATE TABLE orders
(
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id        UNIQUEIDENTIFIER NOT NULL,
    address_id     UNIQUEIDENTIFIER NOT NULL,
    total_amount   DECIMAL(18, 2)   NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20)                  DEFAULT 'PENDING',
    -- PENDING, PAID, FAILED
    order_status   VARCHAR(20)                  DEFAULT 'PENDING',
    -- PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED
    note           VARCHAR(500),
    created_at     DATETIME                     DEFAULT GETDATE(),
    updated_at     DATETIME                     DEFAULT GETDATE(),
    CONSTRAINT FK_orders_users FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT FK_orders_addresses FOREIGN KEY (address_id) REFERENCES addresses (id)
);

CREATE TABLE order_items
(
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_id   UNIQUEIDENTIFIER NOT NULL,
    product_id UNIQUEIDENTIFIER NOT NULL,
    quantity   INT              NOT NULL    DEFAULT 1,
    unit_price DECIMAL(18, 2)   NOT NULL,
    subtotal   DECIMAL(18, 2)   NOT NULL,
    CONSTRAINT FK_order_items_orders FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT FK_order_items_products FOREIGN KEY (product_id) REFERENCES products (id)
);

-- ================= DEVICE LOCATIONS =================
CREATE TABLE device_locations
(
    id         VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_id  VARCHAR(36)    NOT NULL,
    N          DECIMAL(10, 8) NOT NULL COMMENT 'Latitude (Vĩ độ)',
    E          DECIMAL(11, 8) NOT NULL COMMENT 'Longitude (Kinh độ)',
    created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_device_locations_devices FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
    INDEX      idx_device_id (device_id),
    INDEX      idx_created_at (created_at)
);


CREATE TABLE user_spin_balance
(
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id         UNIQUEIDENTIFIER NOT NULL UNIQUE,
    remaining_spins INT              NOT NULL    DEFAULT 0,
    total_spins     INT              NOT NULL    DEFAULT 0,
    updated_at      DATETIME         NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT FK_spin_balance_users
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
);
GO

-- Lưu lịch sử từng lượt quay
CREATE TABLE spin_history
(
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id     UNIQUEIDENTIFIER NOT NULL,
    prize_index INT              NOT NULL,
    prize_label NVARCHAR(100) NOT NULL,
    prize_type  VARCHAR(50)      NOT NULL,
    spun_at     DATETIME         NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT FK_spin_history_users
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
);
GO

CREATE INDEX idx_spin_history_user_id
    ON spin_history (user_id);

CREATE INDEX idx_spin_history_spun_at
    ON spin_history (spun_at);