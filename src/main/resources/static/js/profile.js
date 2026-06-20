import api from "./api.js";
import {logout} from "./logout.js";
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
    if (id === 'devices') loadDevices();
    if (id === 'vouchers') loadVouchers();
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
    PENDING: {text: 'Chờ xác nhận', cls: 'status-processing'},
    CONFIRMED: {text: 'Đã xác nhận', cls: 'status-processing'},
    SHIPPING: {text: 'Đang giao', cls: 'status-shipping'},
    DELIVERED: {text: 'Đã giao', cls: 'status-delivered'},
    CANCELLED: {text: 'Đã huỷ', cls: 'status-cancelled'},
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
    if (!listEl) return;
    try {
        const res = await api.get('/order/user-orders');
        const data = res.data?.result ?? res.data ?? [];
        ordersCache = data;
        renderOrdersList(ordersCache);
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

function filterOrders() {
    const filter = document.getElementById('order-filter')?.value || 'all';
    const list = filter === 'all'
        ? ordersCache
        : ordersCache.filter(o => o.orderStatus === filter);
    renderOrdersList(list);
}

function renderOrdersList(data) {
    const listEl = document.getElementById('orders-list');
    const countEl = document.getElementById('orders-count-label');
    if (!listEl) return;

    if (countEl) countEl.textContent = `${data.length} / ${ordersCache.length} đơn hàng`;

    if (!data.length) {
        listEl.innerHTML = `
            <div style="text-align:center;padding:40px;
                font-family:var(--font-mono);font-size:12px;
                letter-spacing:2px;color:var(--grey-light);">
                KHÔNG CÓ ĐƠN HÀNG NÀO
            </div>`;
        return;
    }

    listEl.innerHTML = data.map(o => {
        const st = ORDER_STATUS_LABEL[o.orderStatus] ?? {text: o.orderStatus, cls: ''};
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
<div class="order-summary">
    <div class="order-total-label">Tổng cộng</div>
    <div class="order-total-val">${fmtPrice(o.totalAmount)}</div>
</div>

${o.orderStatus === 'PENDING' ? `
<button
    onclick="event.stopPropagation();cancelOrder('${o.orderId}')"
    class="btn-cancel-order">
    Huỷ đơn hàng
</button>` : ''}
</div>

        </div>`;
    }).join('');
}

async function cancelOrder(orderId) {
    if (!confirm('Xác nhận huỷ đơn hàng này?')) return;
    try {
        await api.post(`/order/${orderId}/cancel`);
        showToast('Đã huỷ đơn hàng!');
        await loadOrders();
        filterOrders();
    } catch (err) {
        showToast('Huỷ thất bại, thử lại!');
        console.error(err);
    }
}

function showOrderDetail(orderId) {
    const o = ordersCache.find(x => x.orderId === orderId);
    if (!o) return;

    document.getElementById('orders-list').style.display = 'none';
    document.getElementById('order-detail').style.display = '';

    const st = ORDER_STATUS_LABEL[o.orderStatus] ?? {text: o.orderStatus, cls: ''};

    // Timeline steps
    const steps = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
    const curIdx = steps.indexOf(o.orderStatus);
    const timelineHtml = steps.map((s, i) => {
        const labels = {PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao'};
        const done = i <= curIdx;
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

    const payMethodIcon = {COD: '💵', BANKING: '🏦', MOMO: '📱'};
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
            ${o.voucherCode ? `
<div style="display:flex;justify-content:space-between;
    align-items:center;padding:10px 0;
    border-bottom:1px solid var(--grey-border);">
    <span style="font-size:13px;color:var(--grey-light);">
        Voucher áp dụng
    </span>
    <span style="font-family:var(--font-mono);font-size:11px;
        letter-spacing:1px;display:flex;align-items:center;gap:6px;
        color:var(--green);">
        🎫 ${o.voucherCode}
        ${o.discountAmount ? `(−${fmtPrice(o.discountAmount)})` : ''}
    </span>
</div>` : ''}
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
        
${o.paymentMethod === 'BANKING'
    && o.paymentStatus === 'PENDING'
    && o.orderStatus !== 'CANCELLED'
    && o.orderStatus !== 'DELIVERED' ? `
<button onclick="openQrModal('${o.orderId}')" style="
    width:100%;margin-top:16px;padding:14px;
    background:var(--red);border:none;
    font-family:var(--font-mono);font-size:11px;
    letter-spacing:3px;text-transform:uppercase;
    color:#fff;cursor:pointer;">
    THANH TOÁN NGAY
</button>` : ''}
        </div>`;

    document.getElementById('btn-back-orders').onclick = () => {
        document.getElementById('order-detail').style.display = 'none';
        document.getElementById('orders-list').style.display = '';
    };
}


// ══════════════════════════
// DEVICES
// ══════════════════════════
function getDeviceEmoji(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('pro')) return '⌚';
    if (n.includes('sport')) return '🏃';
    if (n.includes('kids')) return '🧒';
    if (n.includes('senior')) return '👴';
    if (n.includes('family')) return '👨‍👩‍👧';
    if (n.includes('elite')) return '💎';
    return '📟';
}

function getDeviceStatusInfo(status) {
    switch (status) {
        case 'ACTIVE':
            return { label: 'Đang hoạt động', color: '#00c864', cardClass: 'online' };
        case 'OFFLINE':
            return { label: 'Ngoại tuyến', color: 'var(--grey-light)', cardClass: '' };
        case 'BLOCKED':
            return { label: 'Đã khoá', color: 'var(--red)', cardClass: '' };
        case 'INACTIVE':
            return { label: 'Không hoạt động', color: 'var(--grey-light)', cardClass: '' };
        default:
            return { label: status, color: 'var(--grey-light)', cardClass: '' };
    }
}

function fmtDateTime(val) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? '—' : d.toLocaleString('vi-VN');
}

async function loadDevices() {
    const grid = document.getElementById('devices-grid');
    const label = document.getElementById('devices-online-label');
    if (!grid) return;

    try {
        const res = await api.get('/api/user-devices');
        const data = res.data?.result ?? res.data ?? [];
        const visibleDevices = data.filter(d => d.status !== 'SOLD');

        const onlineCount = visibleDevices.filter(d => d.status === 'ACTIVE').length;
        if (label) {
            label.textContent = onlineCount > 0
                ? `${onlineCount} thiết bị online`
                : 'Không có thiết bị online';
            label.style.color = onlineCount > 0 ? '#00c864' : 'var(--grey-light)';
        }

        if (!visibleDevices.length) {
            grid.innerHTML = `
                <div style="text-align:center;padding:40px;
                    font-family:var(--font-mono);font-size:12px;
                    letter-spacing:2px;color:var(--grey-light);">
                    CHƯA CÓ THIẾT BỊ
                </div>`;
            return;
        }

        grid.innerHTML = visibleDevices.map(d => {
            const st = getDeviceStatusInfo(d.status);
            const emoji = getDeviceEmoji(d.name);
            const isOffline = d.status === 'OFFLINE';

            return `
    <div class="device-card ${st.cardClass}">
      <button onclick="openSosContacts('${d.deviceId}')" style="
          position:absolute;top:12px;right:${st.cardClass === 'online' ? '36px' : '12px'};
          width:24px;height:24px;border-radius:50%;
          background:none;
          border:1.5px solid var(--grey-border);
          color:var(--grey-light);font-size:16px;line-height:1;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:all 0.3s;z-index:2;"
          title="Cài đặt số điện thoại khẩn cấp"
          onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'"
          onmouseout="this.style.borderColor='var(--grey-border)';this.style.color='var(--grey-light)'">
          +
      </button>
        <div class="device-emoji">${emoji}</div>
        <div class="device-name">${d.name ?? '—'}</div>
        <div class="device-model" style="font-family:var(--font-mono);
            font-size:11px;color:var(--grey-light);margin-bottom:12px;">
            ID: ${d.deviceId ?? '—'}
        </div>

        <div class="device-stat">
            <span class="device-stat-icon">📡</span>
            Trạng thái:
            <strong style="color:${st.color};margin-left:4px;">
                ${st.label}
            </strong>
        </div>

        ${isOffline ? `
        <div style="margin-top:16px;padding:14px;
            border:1px dashed var(--grey-border);
            font-family:var(--font-mono);font-size:10px;
            letter-spacing:2px;color:var(--grey-light);
            text-align:center;line-height:2.2;">
            THIẾT BỊ CHƯA ĐƯỢC KÍCH HOẠT<br>
            <span style="color:var(--white);font-size:11px;">
                Vui lòng setup thiết bị để bắt đầu sử dụng
            </span>
            <br>
            <button onclick="openSetupGuide('${d.deviceId}')" style="
                display:inline-flex;align-items:center;gap:8px;
                margin-top:10px;padding:8px 18px;
                background:none;
                border:1px solid var(--grey-border);
                color:var(--grey-light);
                font-family:var(--font-mono);font-size:10px;
                letter-spacing:2px;text-transform:uppercase;
                cursor:pointer;transition:all 0.3s;">
                <div style="
                    width:20px;height:20px;border-radius:50%;
                    border:1.5px solid var(--grey-light);
                    display:flex;align-items:center;justify-content:center;
                    font-size:12px;font-family:var(--font-display);">?</div>
                HƯỚNG DẪN SETUP
            </button>
        </div>` : `
        <div class="device-stat">
            <span class="device-stat-icon">🕐</span>
            Kết nối lần cuối:
            <strong style="margin-left:4px;">
                ${fmtDateTime(d.lastConnectedAt)}
            </strong>
        </div>
        <div class="device-stat">
            <span class="device-stat-icon">⚙️</span>
            Cấu hình lúc:
            <strong style="margin-left:4px;">
                ${fmtDateTime(d.configuredAt)}
            </strong>
        </div>
        `}
    </div>`;
        }).join('');

    } catch (err) {
        console.error('Lỗi load devices:', err);
        grid.innerHTML = `
            <div style="text-align:center;padding:40px;
                color:var(--red);font-family:var(--font-mono);
                font-size:12px;letter-spacing:2px;">
                ⚠ KHÔNG THỂ TẢI THIẾT BỊ
            </div>`;
    }
}


// ══════════════════════════
// SOS CONTACTS
// ══════════════════════════
let currentSosDeviceId = null;

async function openSosContacts(deviceId) {
    currentSosDeviceId = deviceId;

    const labelEl = document.getElementById('sos-device-id-label');
    if (labelEl) labelEl.textContent = deviceId ?? '—';

    const errEl = document.getElementById('sos-error');
    if (errEl) errEl.style.display = 'none';

    // Reset slots trước
    [1, 2, 3].forEach(i => {
        const inp = document.getElementById(`sos-phone-${i}`);
        if (inp) inp.value = '';
    });

    // Load số hiện tại từ DB
    try {
        const res  = await api.get(`/api/user-devices/${deviceId}/sos-contacts`);
        const data = res.data?.result ?? [];          // result là List<SosContactResponse>

        data.forEach((contact, idx) => {
            if (idx >= 3) return;
            const inp = document.getElementById(`sos-phone-${idx + 1}`);
            if (inp) inp.value = contact.phone ?? '';
        });
    } catch (err) {
        console.warn('Chưa có SOS contacts:', err);
    }

    openModal('modal-sos-contacts');
}

async function saveSosContacts() {
    if (!currentSosDeviceId) return;

    const errEl = document.getElementById('sos-error');
    errEl.style.display = 'none';

    // Thu thập — giữ nguyên slot, bỏ slot trống
    const phones = [1, 2, 3]
        .map(i => document.getElementById(`sos-phone-${i}`)?.value.trim())
        .filter(p => p && p.length > 0);

    // Validate
    const phoneRegex = /^(0|\+84)[0-9]{8,10}$/;
    for (const p of phones) {
        if (!phoneRegex.test(p)) {
            errEl.textContent   = `Số điện thoại "${p}" không hợp lệ!`;
            errEl.style.display = 'block';
            return;
        }
    }

    if (phones.length === 0) {
        errEl.textContent   = 'Vui lòng nhập ít nhất 1 số điện thoại!';
        errEl.style.display = 'block';
        return;
    }

    try {
        await api.put(`/api/user-devices/${currentSosDeviceId}/sos-contacts`, { phones });
        closeModal('modal-sos-contacts');
        showToast(`Đã lưu ${phones.length} số SOS cho ${currentSosDeviceId}!`);
    } catch (err) {
        const msg = err.response?.data?.message ?? 'Lưu thất bại, thử lại!';
        errEl.textContent   = msg;
        errEl.style.display = 'block';
    }
}

function clearSosPhone(slot) {
    const inp = document.getElementById(`sos-phone-${slot}`);
    if (inp) inp.value = '';
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


async function openContactsModal() {
    openModal('modal-contacts');
    const listEl = document.getElementById('contacts-list');

    try {
        const res = await api.get('/users/contacts');
        const data = res.data?.result ?? res.data ?? [];

        if (!data.length) {
            listEl.innerHTML = `
                <div style="text-align:center;padding:32px;
                    font-family:var(--font-mono);font-size:12px;
                    letter-spacing:2px;color:var(--grey-light);">
                    CHƯA CÓ SỐ ĐIỆN THOẠI NÀO
                </div>`;
            return;
        }

        // Group theo deviceId
        const grouped = data.reduce((acc, c) => {
            const key = c.deviceId ?? 'unknown';
            if (!acc[key]) acc[key] = [];
            acc[key].push(c);
            return acc;
        }, {});

        listEl.innerHTML = Object.entries(grouped).map(([deviceId, contacts]) => `
            <div style="margin-bottom:20px;">

                <!-- Device header -->
                <div style="
                    display:flex;align-items:center;gap:10px;
                    padding:10px 14px;margin-bottom:8px;
                    background:var(--grey-mid);
                    border-left:3px solid var(--red);">
                    <span style="font-size:16px;">📟</span>
                    <div>
                        <div style="font-family:var(--font-mono);font-size:10px;
                                    letter-spacing:2px;color:var(--grey-light);">
                            THIẾT BỊ
                        </div>
                        <div style="font-family:var(--font-mono);font-size:12px;
                                    color:var(--white);letter-spacing:1px;">
                            ${deviceId}
                        </div>
                    </div>
                    <div style="margin-left:auto;font-family:var(--font-mono);
                                font-size:10px;color:var(--grey-light);">
                        ${contacts.length} SỐ
                    </div>
                </div>

                <!-- Contact list của device này -->
                ${contacts.map((c, i) => `
                <div style="
                    display:flex;align-items:center;gap:14px;
                    padding:14px 16px;margin-bottom:6px;
                    background:var(--black);
                    border:1px solid var(--grey-border);">

                    <div style="
                        width:36px;height:36px;border-radius:50%;
                        background:var(--grey);
                        border:1px solid var(--grey-border);
                        display:flex;align-items:center;justify-content:center;
                        font-family:var(--font-mono);font-size:13px;
                        color:var(--grey-light);flex-shrink:0;">
                        ${i + 1}
                    </div>

                    <div style="flex:1;min-width:0;">
                        <div style="font-family:var(--font-mono);font-size:13px;
                                    color:var(--white);letter-spacing:1px;">
                            ${c.phoneNumber ?? '—'}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:10px;
                                    color:var(--grey-light);margin-top:3px;">
                            ${c.createdAt
            ? new Date(c.createdAt).toLocaleDateString('vi-VN')
            : '—'}
                        </div>
                    </div>

                    <a href="tel:${c.phoneNumber}" style="
                        padding:8px 14px;
                        background:none;
                        border:1px solid var(--grey-border);
                        color:var(--white);
                        font-family:var(--font-mono);font-size:10px;
                        letter-spacing:2px;text-transform:uppercase;
                        text-decoration:none;white-space:nowrap;
                        transition:all 0.2s;"
                        onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'"
                        onmouseout="this.style.borderColor='var(--grey-border)';this.style.color='var(--white)'">
                        GỌI
                    </a>
                </div>`).join('')}
            </div>
        `).join('');

    } catch (err) {
        console.error('Lỗi load contacts:', err);
        listEl.innerHTML = `
            <div style="text-align:center;padding:32px;
                color:var(--red);font-family:var(--font-mono);
                font-size:12px;letter-spacing:2px;">
                ⚠ KHÔNG THỂ TẢI DANH SÁCH
            </div>`;
    }
}


async function findDevice() {
    const deviceId = document.getElementById('find-device-input')?.value.trim();
    if (!deviceId) {
        showToast('Vui lòng nhập Device ID!');
        return;
    }
    const resultEl  = document.getElementById('find-device-result');
    const contentEl = document.getElementById('find-device-content');

    resultEl.style.display = 'block';
    contentEl.innerHTML = `
        <div style="text-align:center;padding:24px;
            font-family:var(--font-mono);font-size:12px;
            letter-spacing:2px;color:var(--grey-light);">
            ĐANG TÌM KIẾM...
        </div>`;

    try {
        const res = await api.get(`/api/devices/find/${deviceId}`);
        const d   = res.data?.result ?? res.data;
        console.log('response:', res.data);  // ← thêm dòng này
        console.log('d:', d);                // ← và dòng này
        contentEl.innerHTML = `
        <div style="background:var(--black);border:1px solid var(--grey-border);padding:20px;">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
                <div style="font-size:36px;">📟</div>
                <div>
                    <div style="font-size:15px;font-weight:500;
                                color:var(--white);margin-bottom:4px;">
                        ${deviceId}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:11px;
                                color:var(--grey-light);letter-spacing:1px;">
                        ${d.createdAt
            ? 'Cập nhật: ' + new Date(d.createdAt).toLocaleString('vi-VN')
            : '—'}
                    </div>
                </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:0;">
                <div style="display:flex;justify-content:space-between;
                            padding:12px 0;border-bottom:1px solid var(--grey-border);">
                    <span style="font-family:var(--font-mono);font-size:11px;
                                 color:var(--grey-light);">VĨ ĐỘ (N)</span>
                    <span style="font-family:var(--font-mono);font-size:11px;
                                 color:var(--white);">
                        ${d.latitude ?? '—'}
                    </span>
                </div>
                <div style="display:flex;justify-content:space-between;
                            padding:12px 0;border-bottom:1px solid var(--grey-border);">
                    <span style="font-family:var(--font-mono);font-size:11px;
                                 color:var(--grey-light);">KINH ĐỘ (E)</span>
                    <span style="font-family:var(--font-mono);font-size:11px;
                                 color:var(--white);">
                        ${d.longitude ?? '—'}
                    </span>
                </div>

                ${d.latitude && d.longitude ? `
                <div style="padding:12px 0;">
                    <a href="https://maps.google.com/?q=${d.latitude},${d.longitude}"
                       target="_blank"
                       style="display:inline-block;width:100%;padding:12px;
                              text-align:center;box-sizing:border-box;
                              font-family:var(--font-mono);font-size:11px;
                              letter-spacing:2px;text-transform:uppercase;
                              color:var(--white);text-decoration:none;
                              border:1px solid var(--grey-border);">
                        📍 XEM TRÊN GOOGLE MAPS →
                    </a>
                </div>` : `
                <div style="padding:12px 0;text-align:center;
                            font-family:var(--font-mono);font-size:11px;
                            letter-spacing:2px;color:var(--grey-light);">
                    CHƯA CÓ DỮ LIỆU VỊ TRÍ
                </div>`}
            </div>
        </div>`;

    } catch (err) {
        const status = err.response?.status;
        contentEl.innerHTML = `
            <div style="text-align:center;padding:24px;
                color:var(--red);font-family:var(--font-mono);
                font-size:12px;letter-spacing:2px;">
                ${status === 404
            ? '⚠ KHÔNG TÌM THẤY THIẾT BỊ'
            : '⚠ LỖI KẾT NỐI, THỬ LẠI!'}
            </div>`;
        console.error('Lỗi tìm thiết bị:', err);
    }
}

// Cho phép Enter để tìm
document.getElementById('find-device-input')
    ?.addEventListener('keydown', e => {
        if (e.key === 'Enter') findDevice();
    });


// ══════════════════════════
// VOUCHERS
// ══════════════════════════
let vouchersCache = [];

async function loadVouchers() {
    const grid = document.getElementById('vouchers-grid');
    if (!grid) return;

    // Skeleton loading
    grid.innerHTML = [1,2,3].map(i => `
        <div style="height:140px;background:var(--grey);
                    opacity:${0.4 - i*0.1};
                    border:1px solid var(--grey-border);"></div>
    `).join('');

    try {
        const userId = localStorage.getItem('userId');
        if (!userId) { renderVouchers([]); return; }
        const res    = await api.get(`/users/${userId}/vouchers`);
        vouchersCache = res.data?.result ?? res.data ?? [];
        if (!Array.isArray(vouchersCache)) vouchersCache = [];
    } catch(err) {
        console.error('Lỗi load voucher:', err);
        vouchersCache = [];
    }

    renderVouchers(vouchersCache);
}

function filterVouchers() {
    const filter = document.getElementById('voucher-filter')?.value || 'all';
    let list = vouchersCache;

    if (filter === 'available') {
        list = vouchersCache.filter(v => v.status === 'AVAILABLE');
    } else if (filter === 'used') {
        list = vouchersCache.filter(v => v.status === 'USED');
    } else if (filter === 'expired') {
        list = vouchersCache.filter(v => v.status === 'EXPIRED');
    }
    renderVouchers(list);
}

function renderVouchers(list) {
    const grid    = document.getElementById('vouchers-grid');
    const countEl = document.getElementById('voucher-count-label');
    if (!grid) return;

    const available = vouchersCache.filter(v => v.status === 'AVAILABLE').length;
    const used      = vouchersCache.filter(v => v.status === 'USED').length;
    const expired   = vouchersCache.filter(v => v.status === 'EXPIRED').length;

    if (countEl) {
        countEl.textContent = `${available} khả dụng  •  ${used} đã dùng  •  ${expired} hết hạn`;
    }

    if (!list.length) {
        grid.innerHTML = `
            <div class="voucher-empty">
                <div class="voucher-empty-icon">🎫</div>
                CHƯA CÓ VOUCHER
            </div>`;
        return;
    }

    grid.innerHTML = list.map(uv => {
        const v        = uv.voucher ?? uv;
        const code     = v.code        || uv.code     || '—';
        const dtype    = v.discountType || uv.discountType || 'PERCENT';
        const dval     = Number(v.discountValue || uv.discountValue || 0);
        const minOrder = Number(v.minOrderValue || uv.minOrderValue || 0);
        const maxDisc  = Number(v.maxDiscount   || uv.maxDiscount   || 0);
        const expiredAt= v.expiredAt   || uv.expiredAt;
        const status   = uv.status     || 'AVAILABLE';
        const usedAt   = uv.usedAt;
        const source   = uv.source;
        const isUsed    = status === 'USED';
        const isExpired = status === 'EXPIRED';  // ✅ dùng status BE trả, không tự tính lại

        const discDisplay = dtype === 'PERCENT' ? `${dval}%` : fmtShort(dval);
        const desc = dtype === 'PERCENT'
            ? `Giảm ${dval}%${maxDisc > 0 ? `, tối đa ${fmtShort(maxDisc)}` : ''}`
            : `Giảm ${fmtShort(dval)}`;
        const minDesc = minOrder > 0 ? `Đơn tối thiểu ${fmtShort(minOrder)}` : 'Không giới hạn đơn tối thiểu';

        const cardCls = [
            'voucher-card',
            isUsed ? 'used' : isExpired ? 'expired' : 'unused',
        ].join(' ').trim();

        const statusBadge = isUsed
            ? `<span class="voucher-status-badge" style="background:rgba(255,255,255,.05);color:var(--grey-light);border:1px solid var(--grey-border);">ĐÃ DÙNG</span>`
            : isExpired
                ? `<span class="voucher-status-badge" style="background:rgba(232,28,28,.08);color:var(--red);border:1px solid rgba(232,28,28,.2);">HẾT HẠN</span>`
                : `<span class="voucher-status-badge" style="background:rgba(0,200,100,.08);color:var(--green);border:1px solid rgba(0,200,100,.2);">KHẢ DỤNG</span>`;

        return `
        <div class="${cardCls}" style="min-height:140px;">
            <div class="voucher-left">
                <div class="voucher-discount" style="${isUsed||isExpired ? 'color:var(--grey-light)' : ''}">
                    ${discDisplay}
                </div>
                <div class="voucher-discount-type">
                    ${dtype === 'PERCENT' ? 'Giảm giá' : 'Cố định'}
                </div>
            </div>
            <div class="voucher-right">
                <div class="voucher-code" style="${isUsed||isExpired ? 'color:var(--grey-light)' : ''}">
                    ${code}
                </div>
                <div class="voucher-desc">${desc}</div>
                <div class="voucher-desc">${minDesc}</div>
                ${source ? `<div class="voucher-desc" style="color:var(--grey-light);">Nguồn: ${fmtSource(source)}</div>` : ''}
                <div class="voucher-footer">
                    <div>
                        <div class="voucher-expire">
                            ${expiredAt ? `HẾT HẠN: ${new Date(expiredAt).toLocaleDateString('vi-VN')}` : 'KHÔNG HẾT HẠN'}
                        </div>
                        ${isUsed && usedAt ? `<div class="voucher-used-info">Đã dùng: ${new Date(usedAt).toLocaleDateString('vi-VN')}</div>` : ''}
                    </div>
                    ${statusBadge}
                </div>
            </div>
        </div>`;
    }).join('');
}

// Format ngắn gọn số tiền
function fmtShort(n) {
    const num = Number(n || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M₫';
    if (num >= 1000)    return (num / 1000).toFixed(0)    + 'K₫';
    return num.toLocaleString('vi-VN') + '₫';
}

// Format nguồn voucher
function fmtSource(source) {
    const map = {
        SPIN:      '🎡 Vòng quay',
        ADMIN:     '⚙ Quản trị',
        PROMOTION: '🎁 Khuyến mãi',
    };
    return map[source] || source || '—';
}
// Expose
window.filterVouchers = filterVouchers;

// ══════════════════════════
// CHANGE PASSWORD
// ══════════════════════════
async function changePassword() {
    const oldPassword = document.getElementById('pwd-old')?.value.trim();
    const newPassword = document.getElementById('pwd-new')?.value.trim();
    const confirmNewPassword = document.getElementById('pwd-confirm')?.value.trim();
    const errorEl = document.getElementById('pwd-error');

    // Reset error
    errorEl.style.display = 'none';
    errorEl.textContent = '';

    // Validate FE
    if (!oldPassword || !newPassword || !confirmNewPassword) {
        errorEl.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        errorEl.style.display = 'block';
        return;
    }
    if (newPassword !== confirmNewPassword) {
        errorEl.textContent = 'Mật khẩu mới không khớp!';
        errorEl.style.display = 'block';
        return;
    }
    if (newPassword.length < 8) {
        errorEl.textContent = 'Mật khẩu mới tối thiểu 8 ký tự!';
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
        errorEl.textContent = msg;
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
// QR PAYMENT MODAL
// ══════════════════════════
function openQrModal(orderId) {
    const o = ordersCache.find(x => x.orderId === orderId);
    if (!o) return;

    // Tạo modal nếu chưa có
    let modal = document.getElementById('modal-qr');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-qr';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);' +
            'display:flex;align-items:center;justify-content:center;z-index:99999;';
        document.body.appendChild(modal);

        // Đóng khi click ngoài
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }

    modal.innerHTML = `
    <div style="
        background:var(--bg-card, #111);
        border:1px solid var(--grey-border);
        padding:32px;
        max-width:380px;
        width:90%;
        text-align:center;
        position:relative;">

        <button onclick="document.getElementById('modal-qr').classList.remove('open')" style="
            position:absolute;top:16px;right:16px;
            background:none;border:none;
            color:var(--grey-light);cursor:pointer;
            font-family:var(--font-mono);font-size:18px;">✕</button>

        <div style="font-family:var(--font-mono);font-size:10px;
                    letter-spacing:3px;color:var(--grey-light);margin-bottom:8px;">
            THANH TOÁN QUA
        </div>
        <div style="font-family:var(--font-mono);font-size:14px;
                    font-weight:700;color:var(--white);margin-bottom:24px;">
            CHUYỂN KHOẢN NGÂN HÀNG
        </div>

        <img src="/img/QrPayment.png" alt="QR Payment"
             style="width:220px;height:220px;object-fit:contain;
                    border:1px solid var(--grey-border);padding:8px;
                    background:#fff;margin-bottom:20px;">

        <div style="border:1px solid var(--grey-border);padding:12px;
                    margin-bottom:16px;text-align:left;">
            <div style="display:flex;justify-content:space-between;
                        margin-bottom:8px;">
                <span style="font-family:var(--font-mono);font-size:10px;
                             letter-spacing:2px;color:var(--grey-light);">
                    MÃ ĐƠN HÀNG
                </span>
                <span style="font-family:var(--font-mono);font-size:11px;
                             color:var(--white);">
                    #${o.orderId.slice(0, 8).toUpperCase()}
                </span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:var(--font-mono);font-size:10px;
                             letter-spacing:2px;color:var(--grey-light);">
                    SỐ TIỀN
                </span>
                <span style="font-family:var(--font-mono);font-size:14px;
                             font-weight:700;color:var(--red);">
                    ${fmtPrice(o.totalAmount)}
                </span>
            </div>
        </div>

        <div style="font-family:var(--font-mono);font-size:10px;
                    letter-spacing:1px;color:var(--grey-light);line-height:1.8;">
            Quét mã QR để thanh toán.<br>
            Đơn hàng sẽ được xác nhận sau khi<br>
            chúng tôi nhận được thanh toán.
        </div>
    </div>`;

    modal.classList.add('open');
}

// ══════════════════════════
// SETUP GUIDE
// ══════════════════════════
function openSetupGuide(deviceId) {
    // Điền device ID vào modal
    const idEls = [
        document.getElementById('setup-device-id'),
        document.getElementById('setup-device-id-field')
    ];
    idEls.forEach(el => { if (el) el.textContent = deviceId ?? '—'; });
    openModal('modal-setup-guide');
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
window.openQrModal = openQrModal;
window.loadDevices = loadDevices;
window.openSetupGuide = openSetupGuide;
window.openSosContacts  = openSosContacts;
window.saveSosContacts  = saveSosContacts;
window.clearSosPhone    = clearSosPhone;
window.cancelOrder = cancelOrder;
window.openContactsModal = openContactsModal;
window.findDevice = findDevice;
window.filterOrders = filterOrders;

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});