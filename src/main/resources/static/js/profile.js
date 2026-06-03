import api from "./api.js";
import { logout } from "./logout.js";
// ══════════════════════════
// CURSOR — dùng delegation thay vì querySelectorAll
// ══════════════════════════
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
});

(function animateRing() {
    rx += (mx - rx) * .15;
    ry += (my - ry) * .15;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
})();

// Dùng event delegation — bắt cả element động render sau
document.addEventListener('mouseover', e => {
    if (e.target.closest('button, a, [onclick]'))
        document.body.classList.add('hovering');
});
document.addEventListener('mouseout', e => {
    if (e.target.closest('button, a, [onclick]'))
        document.body.classList.remove('hovering');
});


// ══════════════════════════
// USER INFO
// ══════════════════════════

// Lấy userId từ localStorage (được lưu lúc đăng nhập)
const username = localStorage.getItem('username');

async function loadUserInfo() {
    if (!username) {
        console.warn('Chưa có username trong localStorage');
        return;
    }
    try {
        const res = await api.get(`/users/username/${username}`);
        const u = res.data?.result ?? res.data;
        if (!u) return;
        renderUserView(u);
        renderUserEdit(u);
        renderUserSidebar(u);
    } catch (err) {
        console.error('Lỗi load user:', err);
    }
}

// Format helpers
function fmt(val) {
    return val ?? '—';
}

function fmtDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? '—' : d.toLocaleDateString('vi-VN');
}

function fmtJoined(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return '—';
    const diff = Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24 * 30));
    return `${d.toLocaleDateString('vi-VN')} — ${diff} tháng thành viên`;
}

// Render VIEW mode
function renderUserView(u) {
    document.getElementById('fields-view').innerHTML = `
        <div class="field-group">
            <div class="field-label">Họ và tên</div>
            <div class="field-value">${fmt(u.name)}</div>
        </div>
        <div class="field-group">
            <div class="field-label">Tên đăng nhập</div>
            <div class="field-value">${fmt(u.username)}</div>
        </div>
        <div class="field-group">
            <div class="field-label">Email</div>
            <div class="field-value">${fmt(u.email)}</div>
        </div>
        <div class="field-group">
            <div class="field-label">Số điện thoại</div>
            <div class="field-value">${fmt(u.phone)}</div>
        </div>
        <div class="field-group">
            <div class="field-label">Ngày sinh</div>
            <div class="field-value">${fmtDate(u.dob)}</div>
        </div>
        <div class="field-group">
            <div class="field-label">Giới tính</div>
            <div class="field-value">${fmt(u.gender)}</div>
        </div>
        <div class="field-group">
            <div class="field-label">Trạng thái</div>
            <div class="field-value" style="color:${u.isActive ? '#00c864' : 'var(--red)'}">
                ${u.isActive ? '✓ Đang hoạt động' : '✕ Bị khóa'}
            </div>
        </div>
        <div class="field-group field-full">
            <div class="field-label">Ngày tham gia</div>
            <div class="field-value">${fmtJoined(u.createdAt)}</div>
        </div>`;
}

// Render EDIT mode
function renderUserEdit(u) {
    const dobVal = u.dob
        ? new Date(u.dob).toISOString().split('T')[0]
        : '';

    const genderOptions = ['Nam', 'Nữ', 'Khác'].map(g =>
        `<option ${u.gender === g ? 'selected' : ''}>${g}</option>`
    ).join('');

    document.getElementById('fields-edit').innerHTML = `
        <div class="field-group">
            <label class="field-label">Họ và tên</label>
            <input class="field-input" id="edit-name" type="text"
                   value="${u.name ?? ''}" placeholder="Nhập họ và tên">
        </div>
        <div class="field-group">
            <label class="field-label">Tên đăng nhập</label>
            <input class="field-input" type="text"
                   value="${u.username ?? ''}" readonly>
        </div>
        <div class="field-group">
            <label class="field-label">Email</label>
            <input class="field-input" id="edit-email" type="email"
                   value="${u.email ?? ''}" placeholder="Nhập email">
        </div>
        <div class="field-group">
            <label class="field-label">Số điện thoại</label>
            <input class="field-input" id="edit-phone" type="text"
                   value="${u.phone ?? ''}" placeholder="Nhập số điện thoại">
        </div>
        <div class="field-group">
            <label class="field-label">Ngày sinh</label>
            <input class="field-input" id="edit-dob" type="date"
                   value="${dobVal}">
        </div>
        <div class="field-group">
            <label class="field-label">Giới tính</label>
            <select class="field-input" id="edit-gender" style="appearance:none;">
                ${genderOptions}
            </select>
        </div>`;
}

// Render tên + email lên sidebar
function renderUserSidebar(u) {
    const nameEl = document.querySelector('.profile-name');
    const mailEl = document.querySelector('.profile-email');
    const avatEl = document.querySelector('.avatar');
    if (nameEl) nameEl.textContent = u.name ?? u.username ?? '—';
    if (mailEl) mailEl.textContent = u.email ?? '—';
    if (avatEl) avatEl.textContent = (u.name ?? u.username ?? '?')[0].toUpperCase();
}


// ══════════════════════════
// ADDRESSES
// ══════════════════════════
let addressesCache = [];

async function loadAddresses() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const res = await api.get(`/users/address/${userId}`);
        const data = res.data?.result ?? res.data ?? [];
        addressesCache = data;
        renderAddresses(data);
    } catch (err) {
        console.error('Lỗi load địa chỉ:', err);
        document.getElementById('addresses-grid').innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:40px;
                color:var(--red);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;">
                ⚠ KHÔNG THỂ TẢI ĐỊA CHỈ
            </div>`;
    }
}

function renderAddresses(list) {
    const grid = document.getElementById('addresses-grid');
    if (!grid) return;

    const cards = list.map(a => {
        const isDefault = a.isDefault;
        return `
        <div class="address-card ${isDefault ? 'default' : ''}" id="addr-${a.id}">
            <div class="address-name">${a.name ?? '—'}</div>
            <div class="address-phone">${a.phone ?? '—'}</div>
            <div class="address-text">
                ${a.street ?? ''}${a.street ? ',' : ''}<br>
                ${[a.district, a.city].filter(Boolean).join(', ') || '—'}
            </div>
            <div class="address-actions">
                <button class="address-btn" onclick="editAddress('${a.id}')">Chỉnh sửa</button>
                <span style="color:var(--grey-border);">|</span>
                <button class="address-btn" onclick="deleteAddress('${a.id}')">Xóa</button>
                ${!isDefault ? `
                <span style="color:var(--grey-border);">|</span>
                <button class="address-btn" onclick="setDefaultAddress('${a.id}')">Đặt mặc định</button>
                ` : ''}
            </div>
        </div>`;
    }).join('');
    // Nút thêm địa chỉ luôn ở cuối
    const addBtn = `
        <div class="address-add" onclick="openModal('modal-address')">
            <div class="address-add-icon">＋</div>
            <div class="address-add-text">Thêm địa chỉ mới</div>
        </div>`;

    grid.innerHTML = cards + addBtn;
}

function editAddress(id) {
    const a = addressesCache.find(x => x.id === id);
    if (!a) return;
    // Điền data vào modal edit (mở rộng sau)
    showToast('Chức năng chỉnh sửa đang phát triển!');
}

async function deleteAddress(id) {
    if (!confirm('Xác nhận xóa địa chỉ này?')) return;
    try {
        await api.delete(`/users/address/${id}`);
        addressesCache = addressesCache.filter(x => x.id !== id);
        renderAddresses(addressesCache);
        showToast('Đã xóa địa chỉ!');
    } catch (err) {
        console.error('Lỗi xóa địa chỉ:', err);
        showToast('Xóa thất bại, thử lại!');
    }
}

async function setDefaultAddress(id) {
    try {
        await api.patch(`/users/address/${id}/default`);
        // Cập nhật cache
        addressesCache = addressesCache.map(a => ({
            ...a,
            isDefault: a.id === id
        }));
        renderAddresses(addressesCache);
        showToast('Đã đặt địa chỉ mặc định!');
    } catch (err) {
        console.error('Lỗi đặt mặc định:', err);
        showToast('Thất bại, thử lại!');
    }
}

// ══════════════════════════
// CREATE ADDRESS
// ══════════════════════════
async function createAddress() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const name = document.getElementById('addr-name')?.value.trim();
    const phone = document.getElementById('addr-phone')?.value.trim();
    const street = document.getElementById('addr-street')?.value.trim();
    const district = document.getElementById('addr-district')?.value.trim();
    const city = document.getElementById('addr-city')?.value.trim();

    // Validate
    if (!name || !phone || !street || !district || !city) {
        showToast('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    try {
        const body = {name, phone, street, district, city};
        await api.post(`/users/address/${userId}`, body);

        // Xóa trắng form
        ['addr-name', 'addr-phone', 'addr-street', 'addr-district', 'addr-city']
            .forEach(id => document.getElementById(id).value = '');

        closeModal('modal-address');
        await loadAddresses(); // Reload danh sách
        showToast('Đã thêm địa chỉ mới!');

    } catch (err) {
        console.error('Lỗi thêm địa chỉ:', err);
        showToast('Thêm thất bại, thử lại!');
    }
}

// ══════════════════════════
// TABS
// ══════════════════════════
function switchTab(id, btn) {
    document.querySelectorAll('.section-block').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

    const tab = document.getElementById('tab-' + id);
    tab.classList.add('active');
    btn.classList.add('active');

    tab.style.animation = 'none';
    tab.offsetHeight; // reflow
    tab.style.animation = 'fadeUp 0.4s ease forwards';

    // Load data theo từng tab
    if (id === 'address') loadAddresses();
    if (id === 'orders') loadOrders();
}


// ══════════════════════════
// EDIT INFO
// ══════════════════════════
let editing = false;

function toggleEdit() {
    editing = true;
    document.getElementById('fields-view').style.display = 'none';
    document.getElementById('fields-edit').style.display = 'grid';
    document.getElementById('btn-edit-info').style.display = 'none';
    document.getElementById('btn-save-info').style.display = 'inline-flex';
}

async function saveInfo() {
    editing = false;
    try {
        const body = {
            name: document.getElementById('edit-name')?.value || null,
            email: document.getElementById('edit-email')?.value || null,
            phone: document.getElementById('edit-phone')?.value || null,
            dob: document.getElementById('edit-dob')?.value || null,
            gender: document.getElementById('edit-gender')?.value || null,
        };
        const res = await api.put(`/users/username/${username}`, body);
        const u = res.data?.result ?? res.data;
        if (u) {
            renderUserView(u);
            renderUserSidebar(u);
        }
        showToast('Đã lưu thông tin cá nhân!');
    } catch (err) {
        console.error('Lỗi lưu user:', err);
        showToast('Lưu thất bại, thử lại!');
    }
    document.getElementById('fields-view').style.display = 'grid';
    document.getElementById('fields-edit').style.display = 'none';
    document.getElementById('btn-edit-info').style.display = 'inline-flex';
    document.getElementById('btn-save-info').style.display = 'none';
}


// ══════════════════════════
// ORDERS
// ══════════════════════════
let ordersCache = [];

const ORDER_STATUS_LABEL = {
    PENDING:   { text: 'Chờ xác nhận', cls: 'status-processing' },
    CONFIRMED: { text: 'Đã xác nhận',  cls: 'status-processing' },
    SHIPPING:  { text: 'Đang giao',     cls: 'status-shipping'   },
    DELIVERED: { text: 'Đã giao',       cls: 'status-delivered'  },
    CANCELLED: { text: 'Đã huỷ',        cls: 'status-cancelled'  },
};

function fmtPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
}

function fmtOrderDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? '—' : d.toLocaleDateString('vi-VN', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

async function loadOrders() {
    const listEl = document.getElementById('orders-list');
    const countEl = document.getElementById('orders-count-label');
    if (!listEl) return;
    try {
        const res = await api.get('/order/user-orders');
        const data = res.data?.result ?? res.data ?? [];
        ordersCache = data;
        if (countEl) countEl.textContent = `${data.length} đơn hàng`;
        if (!data.length) {
            listEl.innerHTML = `
                <div style="text-align:center;padding:40px;
                    font-family:var(--font-mono);font-size:12px;
                    letter-spacing:2px;color:var(--grey-light);">
                    CHƯA CÓ ĐƠN HÀNG
                </div>`;
            return;
        }
        listEl.innerHTML = data.map(o => {
            const st = ORDER_STATUS_LABEL[o.orderStatus] ?? { text: o.orderStatus, cls: '' };
            const firstItem = o.items?.[0];
            const moreCount = (o.items?.length ?? 0) - 1;
            return `
            <div class="order-card" onclick="showOrderDetail('${o.orderId}')" 
                 style="cursor:pointer;">
                <div class="order-header">
                    <div>
                        <div class="order-id">#${o.orderId.slice(0, 8).toUpperCase()}</div>
                        <div class="order-date">${fmtOrderDate(o.createdAt)}</div>
                    </div>
                    <div class="order-status ${st.cls}">${st.text}</div>
                </div>
                <div class="order-items">
                    ${firstItem ? `
                    <div class="order-item">
                        <div class="order-item-emoji">📦</div>
                        <div class="order-item-info">
                            <div class="order-item-name">${firstItem.product?.name ?? '—'}</div>
                            <div class="order-item-sub">SL: ${firstItem.quantity}</div>
                        </div>
                        <div class="order-item-price">${fmtPrice(firstItem.subtotal)}</div>
                    </div>` : ''}
                    ${moreCount > 0 ? `
                    <div style="font-family:var(--font-mono);font-size:11px;
                                color:var(--grey-light);padding:8px 0;">
                        +${moreCount} sản phẩm khác
                    </div>` : ''}
                </div>
                <div class="order-footer">
                    <div class="order-total-label">Tổng cộng</div>
                    <div class="order-total-val">${fmtPrice(o.totalAmount)}</div>
                </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Lỗi load orders:', err);
        listEl.innerHTML = `
            <div style="text-align:center;padding:40px;
                color:var(--red);font-family:var(--font-mono);
                font-size:12px;letter-spacing:2px;">
                ⚠ KHÔNG THỂ TẢI ĐƠN HÀNG
            </div>`;
    }
}

function showOrderDetail(orderId) {
    const o = ordersCache.find(x => x.orderId === orderId);
    if (!o) return;

    document.getElementById('orders-list').style.display = 'none';
    document.getElementById('order-detail').style.display = 'block';

    const st = ORDER_STATUS_LABEL[o.orderStatus] ?? { text: o.orderStatus, cls: '' };

    // Timeline steps
    const steps  = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
    const curIdx = steps.indexOf(o.orderStatus);
    const timelineHtml = steps.map((s, i) => {
        const labels = { PENDING:'Chờ xác nhận', CONFIRMED:'Đã xác nhận', SHIPPING:'Đang giao', DELIVERED:'Đã giao' };
        const done   = i <= curIdx;
        const active = i === curIdx;
        return `
        <div style="display:flex;flex-direction:column;align-items:center;flex:1;position:relative;">
            ${i < steps.length - 1 ? `
            <div style="position:absolute;top:14px;left:50%;width:100%;height:2px;
                background:${done && i < curIdx ? 'var(--red)' : 'var(--grey-border)'};
                z-index:0;"></div>` : ''}
            <div style="
                width:28px;height:28px;border-radius:50%;
                border:2px solid ${done ? 'var(--red)' : 'var(--grey-border)'};
                background:${active ? 'var(--red)' : done ? 'var(--red-glow)' : 'var(--black)'};
                display:flex;align-items:center;justify-content:center;
                z-index:1;position:relative;
                box-shadow:${active ? '0 0 12px rgba(232,28,28,0.5)' : 'none'};
                transition:all 0.3s;">
                ${done ? `<svg width="12" height="12" fill="none" stroke="${active ? '#fff' : 'var(--red)'}"
                    stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5"/></svg>` : ''}
            </div>
            <div style="margin-top:8px;font-family:var(--font-mono);font-size:9px;
                letter-spacing:1.5px;text-transform:uppercase;text-align:center;
                color:${done ? 'var(--white)' : 'var(--grey-light)'};">
                ${labels[s]}
            </div>
        </div>`;
    }).join('');

    const itemsHtml = (o.items ?? []).map(item => `
        <div style="
            display:grid;grid-template-columns:52px 1fr auto;
            gap:16px;align-items:center;
            padding:20px;background:var(--black);
            border:1px solid var(--grey-border);
            margin-bottom:8px;transition:border-color 0.3s;">
            <div style="
                width:52px;height:52px;
                background:var(--grey-mid);
                display:flex;align-items:center;justify-content:center;
                font-size:24px;border:1px solid var(--grey-border);">📦</div>
            <div>
                <div style="font-family:var(--font-display);font-size:18px;
                    letter-spacing:1px;margin-bottom:4px;">
                    ${item.product?.name ?? '—'}
                </div>
                <div style="font-size:12px;color:var(--grey-light);margin-bottom:6px;">
                    ${item.product?.description ?? ''}
                </div>
                ${item.deviceId ? `
                <div style="
                    display:inline-flex;align-items:center;gap:6px;
                    font-family:var(--font-mono);font-size:10px;letter-spacing:2px;
                    padding:4px 10px;
                    border:1px solid rgba(232,28,28,0.3);
                    color:var(--red);background:var(--red-glow);">
                    📡 ${item.deviceId}
                </div>` : ''}
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:15px;
                    font-weight:700;color:var(--white);">
                    ${fmtPrice(item.subtotal)}
                </div>
                <div style="font-family:var(--font-mono);font-size:11px;
                    color:var(--grey-light);margin-top:4px;">
                    ${fmtPrice(item.unitPrice)} × ${item.quantity}
                </div>
            </div>
        </div>
    `).join('');

    const payMethodIcon = { COD:'💵', BANKING:'🏦', MOMO:'📱' };
    const payIcon = payMethodIcon[o.paymentMethod] ?? '💳';

    const payStatusColor = o.paymentStatus === 'PAID' ? '#00c864' : 'var(--grey-light)';

    document.getElementById('order-detail-content').innerHTML = `

        <!-- ORDER ID + STATUS -->
        <div style="
            display:flex;justify-content:space-between;align-items:flex-start;
            padding-bottom:24px;border-bottom:1px solid var(--grey-border);
            margin-bottom:28px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:10px;
                    letter-spacing:3px;color:var(--red);margin-bottom:8px;">
                    MÃ ĐƠN HÀNG
                </div>
                <div style="font-family:var(--font-display);font-size:28px;
                    letter-spacing:2px;">
                    #${o.orderId.slice(0, 8).toUpperCase()}
                </div>
                <div style="font-family:var(--font-mono);font-size:11px;
                    color:var(--grey-light);margin-top:6px;letter-spacing:1px;">
                    ${fmtOrderDate(o.createdAt)}
                </div>
            </div>
            <div class="order-status ${st.cls}" style="font-size:11px;padding:8px 18px;">
                ${st.text}
            </div>
        </div>

        <!-- TIMELINE -->
        ${o.orderStatus !== 'CANCELLED' ? `
        <div style="
            padding:24px 20px;
            background:var(--black);
            border:1px solid var(--grey-border);
            margin-bottom:24px;">
            <div style="font-family:var(--font-mono);font-size:10px;
                letter-spacing:3px;color:var(--grey-light);margin-bottom:20px;">
                TIẾN TRÌNH ĐƠN HÀNG
            </div>
            <div style="display:flex;justify-content:space-between;padding:0 12px;">
                ${timelineHtml}
            </div>
        </div>` : `
        <div style="
            padding:20px;background:rgba(232,28,28,0.06);
            border:1px solid rgba(232,28,28,0.3);
            margin-bottom:24px;
            display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">❌</span>
            <div>
                <div style="font-family:var(--font-mono);font-size:11px;
                    letter-spacing:2px;color:var(--red);">ĐƠN HÀNG ĐÃ BỊ HUỶ</div>
            </div>
        </div>`}

        <!-- ITEMS -->
        <div style="font-family:var(--font-mono);font-size:10px;
            letter-spacing:3px;color:var(--grey-light);margin-bottom:12px;">
            SẢN PHẨM (${o.items?.length ?? 0})
        </div>
        ${itemsHtml}

        <!-- PAYMENT INFO -->
        <div style="
            margin-top:20px;padding:20px;
            background:var(--black);border:1px solid var(--grey-border);">
            <div style="font-family:var(--font-mono);font-size:10px;
                letter-spacing:3px;color:var(--grey-light);margin-bottom:16px;">
                THANH TOÁN
            </div>
            <div style="display:flex;justify-content:space-between;
                align-items:center;padding:10px 0;
                border-bottom:1px solid var(--grey-border);">
                <span style="font-size:13px;color:var(--grey-light);">
                    Phương thức
                </span>
                <span style="font-family:var(--font-mono);font-size:12px;
                    letter-spacing:1px;display:flex;align-items:center;gap:6px;">
                    ${payIcon} ${o.paymentMethod}
                </span>
            </div>
            <div style="display:flex;justify-content:space-between;
                align-items:center;padding:10px 0;
                border-bottom:1px solid var(--grey-border);">
                <span style="font-size:13px;color:var(--grey-light);">
                    Trạng thái thanh toán
                </span>
                <span style="font-family:var(--font-mono);font-size:11px;
                    letter-spacing:2px;padding:4px 12px;
                    background:${o.paymentStatus === 'PAID'
        ? 'rgba(0,200,100,0.1)' : 'rgba(255,255,255,0.05)'};
                    border:1px solid ${o.paymentStatus === 'PAID'
        ? 'rgba(0,200,100,0.3)' : 'var(--grey-border)'};
                    color:${payStatusColor};">
                    ${o.paymentStatus}
                </span>
            </div>
            <div style="display:flex;justify-content:space-between;
                align-items:center;padding-top:16px;">
                <span style="font-family:var(--font-mono);font-size:11px;
                    letter-spacing:2px;color:var(--white);">TỔNG CỘNG</span>
                <span style="font-family:var(--font-mono);font-size:22px;
                    font-weight:700;color:var(--red);">
                    ${fmtPrice(o.totalAmount)}
                </span>
            </div>
        </div>`;

    document.getElementById('btn-back-orders').onclick = () => {
        document.getElementById('order-detail').style.display = 'none';
        document.getElementById('orders-list').style.display = 'block';
    };
}
// ══════════════════════════
// MODAL
// ══════════════════════════
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => {
        if (e.target === m) m.classList.remove('open');
    });
});

// ══════════════════════════
// SWITCH TOGGLE
// ══════════════════════════
function toggleSwitch(el) {
    el.classList.toggle('on');
}

// ══════════════════════════
// TOAST
// ══════════════════════════
let toastTimer;

function showToast(msg) {
    document.getElementById('toast-msg').textContent = msg;
    const t = document.getElementById('toast');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}


// ══════════════════════════
// CHANGE PASSWORD
// ══════════════════════════
async function changePassword() {
    const oldPassword        = document.getElementById('pwd-old')?.value.trim();
    const newPassword        = document.getElementById('pwd-new')?.value.trim();
    const confirmNewPassword = document.getElementById('pwd-confirm')?.value.trim();
    const errorEl            = document.getElementById('pwd-error');

    // Reset error
    errorEl.style.display = 'none';
    errorEl.textContent   = '';

    // Validate FE
    if (!oldPassword || !newPassword || !confirmNewPassword) {
        errorEl.textContent   = 'Vui lòng nhập đầy đủ thông tin!';
        errorEl.style.display = 'block';
        return;
    }
    if (newPassword !== confirmNewPassword) {
        errorEl.textContent   = 'Mật khẩu mới không khớp!';
        errorEl.style.display = 'block';
        return;
    }
    if (newPassword.length < 8) {
        errorEl.textContent   = 'Mật khẩu mới tối thiểu 8 ký tự!';
        errorEl.style.display = 'block';
        return;
    }

    try {
        await api.put('/users/change-password', {
            oldPassword,
            newPassword,
            confirmNewPassword
        });

        // Xóa trắng form
        ['pwd-old', 'pwd-new', 'pwd-confirm']
            .forEach(id => document.getElementById(id).value = '');

        closeModal('modal-password');
        showToast('Đổi mật khẩu thành công!');

    } catch (err) {
        const msg = err.response?.data?.message ?? 'Đổi mật khẩu thất bại!';
        errorEl.textContent   = msg;
        errorEl.style.display = 'block';
        console.error('Lỗi đổi mật khẩu:', err);
    }
}

async function logoutAllDevices() {
    openModal('modal-confirm-logout');
    const btn = document.getElementById('btn-confirm-logout');
    const handler = async () => {
        btn.removeEventListener('click', handler);
        closeModal('modal-confirm-logout');
        showToast('Đang đăng xuất...');
        await logout();
    };
    btn.addEventListener('click', handler);
}
// ══════════════════════════
// EXPOSE TO WINDOW
// ══════════════════════════
window.switchTab = switchTab;
window.toggleEdit = toggleEdit;
window.saveInfo = saveInfo;
window.openModal = openModal;
window.closeModal = closeModal;
window.toggleSwitch = toggleSwitch;
window.showToast = showToast;
window.editAddress = editAddress;
window.deleteAddress = deleteAddress;
window.setDefaultAddress = setDefaultAddress;
window.createAddress = createAddress;
window.showOrderDetail = showOrderDetail;
window.changePassword = changePassword;
window.logoutAllDevices = logoutAllDevices;

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});