import api from "./api-admin.js";

// ══════════════════════════
// CONFIG & STATE
// ══════════════════════════
let adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
let allUsers = [], allProducts = [], allDevices = [], allOrders = [], allVouchers = [];
let revenueChart = null, orderStatusChart = null, monthlyChart = null, paymentChart = null;
let currentPage = {users: 1, products: 1, devices: 1, orders: 1};
const PAGE_SIZE = 10;

const ORDER_STATUS = {
    PENDING: {label: 'Chờ xác nhận', cls: 'badge-gold'},
    CONFIRMED: {label: 'Đã xác nhận', cls: 'badge-blue'},
    SHIPPING: {label: 'Đang giao', cls: 'badge-blue'},
    DELIVERED: {label: 'Đã giao', cls: 'badge-green'},
    CANCELLED: {label: 'Đã huỷ', cls: 'badge-red'},
};
const PAYMENT_STATUS = {
    PENDING: {label: 'Chưa TT', cls: 'badge-gold'},
    PAID: {label: 'Đã TT', cls: 'badge-green'},
    FAILED: {label: 'Thất bại', cls: 'badge-red'},
};

// ══════════════════════════
// HELPERS
// ══════════════════════════
const fmt = n => Number(n || 0).toLocaleString('vi-VN') + '₫';
const fmtDate = v => v ? new Date(v).toLocaleDateString('vi-VN') : '—';
const fmtDateTime = v => v ? new Date(v).toLocaleString('vi-VN') : '—';
const shortId = id => id ? '#' + id.slice(0, 8).toUpperCase() : '—';

// Dùng api (axios) từ api.js — token được tự động đính kèm qua interceptor
async function apiFetch(path, opts = {}) {
    const method = (opts.method || 'GET').toLowerCase();
    const body = opts.body ? JSON.parse(opts.body) : undefined;
    let res;
    if (method === 'get') res = await api.get(path);
    else if (method === 'post') res = await api.post(path, body);
    else if (method === 'put') res = await api.put(path, body);
    else if (method === 'patch') res = await api.patch(path, body);
    else if (method === 'delete') res = await api.delete(path);
    return res.data;
}

function showToast(msg, err = false) {
    const t = document.getElementById('toast');
    t.className = 'toast' + (err ? ' error' : '');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function confirm2(title, msg, cb) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = msg;
    const btn = document.getElementById('confirm-ok');
    btn.onclick = () => {
        closeModal('modal-confirm');
        cb();
    };
    openModal('modal-confirm');
}

// ══════════════════════════
// CLOCK
// ══════════════════════════
function updateClock() {
    document.getElementById('clock').textContent =
        new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
}

setInterval(updateClock, 1000);

// ══════════════════════════
// AUTH
// ══════════════════════════
async function doLogin() {
    const username = document.getElementById('l-user').value.trim();
    const password = document.getElementById('l-pass').value.trim();
    const errEl = document.getElementById('login-err');
    errEl.style.display = 'none';

    if (!username || !password) {
        errEl.textContent = '⚠ Vui lòng nhập đầy đủ thông tin!';
        errEl.style.display = 'block';
        return;
    }
    try {
        const res = await fetch('/auth/token', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password})
        });
        const data = await res.json();
        if (!res.ok) {
            errEl.textContent = data?.message || '⚠ Sai tên đăng nhập hoặc mật khẩu!';
            errEl.style.display = 'block';
            return;
        }
        const tk = data?.result?.token ?? data?.token;
        if (!tk) {
            errEl.textContent = '⚠ Không nhận được token!';
            errEl.style.display = 'block';
            return;
        }


        const payload = JSON.parse(atob(tk.split('.')[1]));
        console.log('JWT payload:', payload);


        const roles = payload.roles
            ?? payload.scope
            ?? payload.authorities
            ?? [];

        console.log('Roles:', roles);

        const isAdmin = Array.isArray(roles)
            ? roles.some(r => {
                const role = (typeof r === 'string' ? r : r?.authority || '').toUpperCase();
                return role === 'ADMIN' || role === 'ROLE_ADMIN';
            })
            : String(roles).toUpperCase().includes('ADMIN');

        if (!isAdmin) {
            errEl.textContent = '⚠ Tài khoản không có quyền Admin!';
            errEl.style.display = 'block';
            console.warn('Không có quyền admin. Roles hiện tại:', roles);
            return;
        }

        // Lưu token
        localStorage.setItem('admin_access_token', tk);
        localStorage.setItem('admin_user', JSON.stringify({username, role: 'ADMIN'}));
        adminUser = {username, role: 'ADMIN'};

        // Cập nhật UI
        document.getElementById('admin-name').textContent = username;
        document.getElementById('admin-avatar').textContent = username[0].toUpperCase();
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').style.display = 'flex';
        document.getElementById('app').classList.add('visible');
        initApp();

    } catch (e) {
        console.error('Login error:', e);
        errEl.textContent = '⚠ Lỗi kết nối server — kiểm tra console!';
        errEl.style.display = 'block';
    }
}

function doLogout() {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user');
    // Không đụng vào access_token, userId, username của user web
    document.getElementById('app').style.display = 'none';
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('l-pass').value = '';
}

// ══════════════════════════
// DOM READY
// ══════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    updateClock();
// Gắn login button — tránh lỗi module chưa load
    document.getElementById('login-btn')
        ?.addEventListener('click', doLogin);

    document.getElementById('l-user')
        ?.addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('l-pass').focus();
        });

    document.getElementById('l-pass')
        ?.addEventListener('keydown', e => {
            if (e.key === 'Enter') doLogin();
        });

    // Đóng modal khi click ngoài
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => {
            if (e.target === m) m.classList.remove('open');
        });
    });

    // Enter để login
    document.getElementById('l-pass')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin();
    });

    // Auto-login nếu access_token còn hạn
    const tk = localStorage.getItem('admin_access_token');
    if (tk) {
        try {
            const p = JSON.parse(atob(tk.split('.')[1]));
            if (p.exp * 1000 > Date.now()) {
                adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
                document.getElementById('admin-name').textContent = adminUser.username || 'Admin';
                document.getElementById('admin-avatar').textContent = (adminUser.username || 'A')[0].toUpperCase();
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('app').style.display = 'flex';
                document.getElementById('app').classList.add('visible');
                initApp();
                return;
            }
        } catch (e) {
        }
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_user');
    }
});

// ══════════════════════════
// NAVIGATION
// ══════════════════════════
function goPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const titles = {
        dashboard: 'DASHBOARD', users: 'NGƯỜI DÙNG', products: 'SẢN PHẨM',
        devices: 'THIẾT BỊ', orders: 'ĐƠN HÀNG', analytics: 'DOANH THU', vouchers: 'VOUCHER'
    };
    document.getElementById('page-title').textContent = titles[id] || id.toUpperCase();
    closeSidebar();
    if (id === 'users') loadUsers();
    if (id === 'products') loadProducts();
    if (id === 'devices') loadDevices();
    if (id === 'orders') loadOrders();
    if (id === 'analytics') loadAnalytics();
    if (id === 'vouchers') loadVouchers();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}

function refreshPage() {
    const active = document.querySelector('.page.active')?.id?.replace('page-', '');
    if (active) goPage(active, document.querySelector('.nav-item.active'));
}

// ══════════════════════════
// INIT
// ══════════════════════════
async function initApp() {
    await loadDashboard();
}

// ══════════════════════════
// DASHBOARD
// ══════════════════════════
async function loadDashboard() {
    try {
        const [usersRes, ordersRes, devicesRes] = await Promise.all([
            apiFetch('/admin/users'),
            apiFetch('/admin/orders'),
            apiFetch('/admin/devices'),
        ]);
        allUsers = Array.isArray(usersRes?.result ?? usersRes) ? (usersRes?.result ?? usersRes) : [];
        allOrders = Array.isArray(ordersRes?.result ?? ordersRes) ? (ordersRes?.result ?? ordersRes) : [];
        allDevices = Array.isArray(devicesRes?.result ?? devicesRes) ? (devicesRes?.result ?? devicesRes) : [];

        const delivered = allOrders.filter(o => o.orderStatus === 'DELIVERED');
        const revenue = delivered.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
        const pending = allOrders.filter(o => o.orderStatus === 'PENDING').length;
        const activeDevs = allDevices.filter(d => d.status === 'ACTIVE').length;

        document.getElementById('s-revenue').textContent = fmt(revenue);
        document.getElementById('s-rev-change').textContent = `${delivered.length} đơn hoàn thành`;
        document.getElementById('s-users').textContent = allUsers.length;
        document.getElementById('s-users-change').textContent = 'Tổng tài khoản';
        document.getElementById('s-orders').textContent = allOrders.length;
        document.getElementById('s-orders-change').textContent = `${pending} chờ xác nhận`;
        document.getElementById('s-orders-change').className = 'stat-change ' + (pending > 0 ? 'up' : '');
        document.getElementById('s-devices').textContent = activeDevs;
        document.getElementById('s-dev-change').textContent = `${allDevices.length} thiết bị tổng`;
        document.getElementById('pending-badge').textContent = pending;

        renderRecentOrders(allOrders.slice(0, 6));
        buildRevenueChart('week');
        buildOrderStatusChart(allOrders);
    } catch (e) {
        console.warn('Dashboard demo mode:', e.message);
        loadDashboardDemo();
    }
}

function loadDashboardDemo() {
    document.getElementById('s-revenue').textContent = fmt(48500000);
    document.getElementById('s-rev-change').textContent = '12 đơn hoàn thành';
    document.getElementById('s-users').textContent = '247';
    document.getElementById('s-users-change').textContent = 'Tổng tài khoản';
    document.getElementById('s-orders').textContent = '38';
    document.getElementById('s-orders-change').textContent = '5 chờ xác nhận';
    document.getElementById('s-devices').textContent = '31';
    document.getElementById('s-dev-change').textContent = '42 thiết bị tổng';
    document.getElementById('pending-badge').textContent = '5';
    renderRecentOrders(demoOrders());
    buildRevenueChart('week');
    buildOrderStatusChart([]);
}

function demoOrders() {
    return [
        {
            orderId: 'a1b2c3d4-0000',
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
            totalAmount: 499000,
            createdAt: new Date().toISOString(),
            user: {username: 'user01'}
        },
        {
            orderId: 'b2c3d4e5-0000',
            orderStatus: 'CONFIRMED',
            paymentStatus: 'PAID',
            totalAmount: 999000,
            createdAt: new Date().toISOString(),
            user: {username: 'user02'}
        },
        {
            orderId: 'c3d4e5f6-0000',
            orderStatus: 'DELIVERED',
            paymentStatus: 'PAID',
            totalAmount: 1990000,
            createdAt: new Date().toISOString(),
            user: {username: 'user03'}
        },
        {
            orderId: 'd4e5f6g7-0000',
            orderStatus: 'SHIPPING',
            paymentStatus: 'PAID',
            totalAmount: 1490000,
            createdAt: new Date().toISOString(),
            user: {username: 'user04'}
        },
        {
            orderId: 'e5f6g7h8-0000',
            orderStatus: 'CANCELLED',
            paymentStatus: 'PENDING',
            totalAmount: 890000,
            createdAt: new Date().toISOString(),
            user: {username: 'user05'}
        },
    ];
}

function renderRecentOrders(orders) {
    const body = document.getElementById('recent-orders-body');
    if (!orders.length) {
        body.innerHTML = '<tr><td colspan="7" class="tbl-empty">CHƯA CÓ ĐƠN HÀNG</td></tr>';
        return;
    }
    body.innerHTML = orders.map(o => {
        const st = ORDER_STATUS[o.orderStatus] || {label: o.orderStatus, cls: 'badge-grey'};
        const pt = PAYMENT_STATUS[o.paymentStatus] || {label: o.paymentStatus, cls: 'badge-grey'};
        return `<tr>
      <td><span style="font-family:var(--font-mono);font-size:11px">${shortId(o.orderId)}</span></td>
      <td>${o.user?.username || o.user?.name || '—'}</td>
      <td style="font-family:var(--font-mono)">${fmt(o.totalAmount)}</td>
      <td><span class="badge ${pt.cls}">${pt.label}</span></td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--grey-light)">${fmtDate(o.createdAt)}</td>
      <td><button class="tbl-action" onclick="viewOrder('${o.orderId}')">Chi tiết</button></td>
    </tr>`;
    }).join('');
}

// ── CHARTS ──
function buildRevenueChart(period) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    if (revenueChart) revenueChart.destroy();
    const {labels, data} = genRevenueData(period, allOrders);
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels, datasets: [{
                label: 'Doanh thu', data,
                borderColor: '#e81c1c', backgroundColor: 'rgba(232,28,28,.08)',
                borderWidth: 2, fill: true, tension: .4,
                pointBackgroundColor: '#e81c1c', pointRadius: 3,
            }]
        },
        options: {
            responsive: true, plugins: {
                legend: {display: false}, tooltip: {
                    callbacks: {label: c => '  ' + fmt(c.parsed.y)},
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a',
                    borderWidth: 1,
                    titleColor: '#888',
                    bodyColor: '#f5f5f0',
                }
            }, scales: {
                x: {
                    grid: {color: 'rgba(255,255,255,.04)'},
                    ticks: {color: '#666', font: {family: 'Space Mono', size: 9}}
                },
                y: {
                    grid: {color: 'rgba(255,255,255,.04)'},
                    ticks: {color: '#666', font: {family: 'Space Mono', size: 9}, callback: v => fmt(v)}
                },
            }
        }
    });
}

function genRevenueData(period, orders) {
    const now = new Date();
    if (period === 'week') {
        const labels = [], data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}));
            const day = orders.filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.orderStatus === 'DELIVERED');
            data.push(day.reduce((s, o) => s + Number(o.totalAmount || 0), 0) || Math.random() * 5000000 + 1000000);
        }
        return {labels, data};
    }
    if (period === 'month') {
        const labels = [], data = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(i % 5 === 0 ? d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}) : '');
            data.push(Math.random() * 8000000 + 500000);
        }
        return {labels, data};
    }
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return {labels: months, data: months.map(() => Math.random() * 50000000 + 10000000)};
}

function buildOrderStatusChart(orders) {
    const ctx = document.getElementById('order-status-chart').getContext('2d');
    if (orderStatusChart) orderStatusChart.destroy();
    const counts = {};
    Object.keys(ORDER_STATUS).forEach(k => counts[k] = 0);
    orders.forEach(o => {
        if (counts[o.orderStatus] !== undefined) counts[o.orderStatus]++;
    });
    orderStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.values(ORDER_STATUS).map(v => v.label),
            datasets: [{
                data: !orders.length ? [5, 8, 6, 12, 3] : Object.values(counts),
                backgroundColor: ['#f5c842', '#3b82f6', '#3b82f6', '#00c864', '#e81c1c'],
                borderColor: '#1a1a1a', borderWidth: 2,
            }]
        },
        options: {
            responsive: true, plugins: {
                legend: {labels: {color: '#888', font: {family: 'Space Mono', size: 9}}},
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a',
                    borderWidth: 1,
                    titleColor: '#888',
                    bodyColor: '#f5f5f0'
                },
            }
        }
    });
}

function setChartPeriod(period, btn) {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildRevenueChart(period);
}

// ══════════════════════════
// USERS
// ══════════════════════════
async function loadUsers() {
    try {
        const res = await apiFetch('/api/manage/user');
        allUsers = res?.result ?? res ?? [];
        if (!Array.isArray(allUsers)) allUsers = [];
    } catch (e) {
        allUsers = [];
    }
    renderUsers();
}

function filterUsers() {
    currentPage.users = 1;
    renderUsers();
}

function renderUsers() {
    const search = document.getElementById('user-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('user-filter')?.value || '';

    let filtered = allUsers.filter(u => {
        const match = !search
            || (u.name || '').toLowerCase().includes(search)
            || (u.username || '').toLowerCase().includes(search)
            || (u.email || '').toLowerCase().includes(search)
            || (u.phone || '').includes(search);
        const sf = !filter
            || (filter === 'active' && u.isActive)
            || (filter === 'inactive' && !u.isActive);
        return match && sf;
    });

    // Label tổng
    const lbl = document.getElementById('users-total-label');
    if (lbl) lbl.textContent = `${filtered.length} / ${allUsers.length} người dùng`;

    const total = filtered.length;
    const page = currentPage.users;
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const body = document.getElementById('users-body');

    if (!paged.length) {
        body.innerHTML = '<tr><td colspan="8" class="tbl-empty">KHÔNG CÓ DỮ LIỆU</td></tr>';
        renderPagination('users', total, page);
        return;
    }

    body.innerHTML = paged.map((u, i) => {
        const idx = (page - 1) * PAGE_SIZE + i + 1;
        const avatar = (u.name || u.username || '?')[0].toUpperCase();
        const roles = Array.isArray(u.roles)
            ? u.roles.join(', ')
            : (u.roles || 'USER');
        const isAdmin = roles.includes('ADMIN');

        return `<tr style="cursor:pointer;" onclick="viewUser('${u.id}')">
            <td style="color:var(--grey-light);font-family:var(--font-mono);
                       font-size:11px;width:40px;">${idx}</td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="
                        width:34px;height:34px;border-radius:50%;
                        background:${isAdmin ? 'var(--red)' : 'var(--grey3)'};
                        display:flex;align-items:center;justify-content:center;
                        font-family:var(--font-display);font-size:15px;
                        flex-shrink:0;border:1px solid var(--grey-border);">
                        ${avatar}
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:500;">
                            ${u.name || '—'}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:10px;
                                    color:var(--grey-light);margin-top:2px;">
                            @${u.username || '—'}
                        </div>
                    </div>
                </div>
            </td>
            <td style="color:var(--grey-light);font-size:12px;">${u.email || '—'}</td>
            <td style="font-family:var(--font-mono);font-size:11px;">
                ${u.phone || '—'}
            </td>
            <td>
                <span class="badge ${isAdmin ? 'badge-red' : 'badge-blue'}">
                    ${isAdmin ? 'ADMIN' : 'USER'}
                </span>
            </td>
            <td>
                <span class="badge ${u.isActive ? 'badge-green' : 'badge-red'}">
                    ${u.isActive ? 'Hoạt động' : 'Bị khóa'}
                </span>
            </td>
            <td style="font-family:var(--font-mono);font-size:11px;
                       color:var(--grey-light);">
                ${fmtDate(u.createdAt)}
            </td>
            <td onclick="event.stopPropagation()">
                <button class="tbl-action ${u.isActive ? 'danger' : 'success'}"
                        onclick="toggleUser('${u.id}', ${u.isActive})">
                    ${u.isActive ? 'Khóa' : 'Mở'}
                </button>
            </td>
        </tr>`;
    }).join('');

    renderPagination('users', total, page);
}

function viewUser(id) {
    const u = allUsers.find(x => x.id === id);
    if (!u) return;

    const avatar = (u.name || u.username || '?')[0].toUpperCase();
    const isAdmin = Array.isArray(u.roles)
        ? u.roles.includes('ADMIN')
        : String(u.roles || '').includes('ADMIN');
    const roles = Array.isArray(u.roles) ? u.roles.join(', ') : (u.roles || 'USER');

    // Header avatar + tên
    document.getElementById('ud-avatar').textContent = avatar;
    document.getElementById('ud-name').textContent = u.name || u.username || '—';
    document.getElementById('ud-username').textContent = `@${u.username || '—'}  •  ${roles}`;

    // Body — info grid
    const fields = [
        ['ID', u.id],
        ['Username', u.username],
        ['Họ và tên', u.name],
        ['Email', u.email],
        ['Số điện thoại', u.phone],
        ['Ngày sinh', fmtDate(u.dob)],
        ['Giới tính', u.gender],
        ['Vai trò', roles],
        ['Trạng thái', u.isActive ? '✓ Đang hoạt động' : '✕ Bị khóa'],
        ['Ngày tạo', fmtDateTime(u.createdAt)],
    ];

    document.getElementById('user-detail-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${fields.map(([k, v]) => `
            <div style="background:var(--black);padding:12px 14px;
                        border:1px solid var(--grey-border);">
                <div style="font-family:var(--font-mono);font-size:9px;
                            letter-spacing:2px;text-transform:uppercase;
                            color:var(--grey-light);margin-bottom:5px;">${k}</div>
                <div style="font-size:13px;
                    color:${k === 'Trạng thái'
        ? (u.isActive ? 'var(--green)' : 'var(--red)')
        : 'var(--white)'};">
                    ${v || '—'}
                </div>
            </div>`).join('')}
        </div>`;

    // Footer buttons
    document.getElementById('user-detail-footer').innerHTML = `
        <button class="btn btn-secondary"
                onclick="closeModal('modal-user')">
            Đóng
        </button>
        <button class="btn ${u.isActive ? 'btn-danger' : 'btn-success'}"
                onclick="toggleUser('${u.id}', ${u.isActive}); closeModal('modal-user')">
            ${u.isActive ? '🔒 Khóa tài khoản' : '🔓 Mở khóa tài khoản'}
        </button>`;

    openModal('modal-user');
}

async function toggleUser(id, isActive) {
    const action = isActive ? 'deactivate' : 'activate';
    const label = isActive ? 'khóa' : 'mở khóa';

    confirm2('Xác nhận', `Bạn muốn ${label} tài khoản này?`, async () => {
        try {
            await apiFetch(`/api/manage/user/${id}/${action}`, {method: 'PATCH'});
            showToast(`Đã ${label} tài khoản thành công!`);
        } catch (e) {
            showToast(`Đã ${label} tài khoản (demo)!`);
        }
        // Cập nhật local state
        const u = allUsers.find(x => x.id === id);
        if (u) u.isActive = !isActive;
        renderUsers();
    });
}

// ══════════════════════════
// PRODUCTS
// ══════════════════════════
async function loadProducts() {
    const body = document.getElementById('products-body');
    body.innerHTML = '<tr><td colspan="7" class="tbl-empty">ĐANG TẢI...</td></tr>';

    try {
        const res = await apiFetch('/api/product');
        allProducts = res?.result ?? res ?? [];
        if (!Array.isArray(allProducts)) allProducts = [];
    } catch (e) {
        allProducts = [];
        body.innerHTML = '<tr><td colspan="7" class="tbl-empty" style="color:var(--red);">⚠ KHÔNG THỂ TẢI SẢN PHẨM</td></tr>';
        return;
    }
    renderProducts();
}

function filterProducts() {
    currentPage.products = 1;
    renderProducts();
}

function renderProducts() {
    const status = document.getElementById('product-status-filter')?.value || '';
    const search = document.getElementById('product-search')?.value.toLowerCase() || '';

    let filtered = allProducts.filter(p => {
        const matchSearch =
            !search ||
            (p.name || '').toLowerCase().includes(search) ||
            (p.description || '').toLowerCase().includes(search);
        const matchStatus =
            !status ||
            p.status === status;
        return matchSearch && matchStatus;
    });

    // Label tổng
    const lbl = document.getElementById('products-total-label');
    if (lbl) lbl.textContent = `${filtered.length} / ${allProducts.length} sản phẩm`;

    const total = filtered.length;
    const page = currentPage.products;
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const body = document.getElementById('products-body');

    if (!paged.length) {
        body.innerHTML = '<tr><td colspan="8" class="tbl-empty">KHÔNG CÓ SẢN PHẨM</td></tr>';
        renderPagination('products', total, page);
        return;
    }

    body.innerHTML = paged.map((p, i) => {
        const idx = (page - 1) * PAGE_SIZE + i + 1;
        const price = Number(p.price || 0);

        return `<tr>
            <td style="color:var(--grey-light);font-family:var(--font-mono);
                       font-size:11px;width:40px;">${idx}</td>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="
                        width:36px;height:36px;
                        background:var(--grey3);
                        border:1px solid var(--grey-border);
                        display:flex;align-items:center;
                        justify-content:center;font-size:16px;
                        flex-shrink:0;">📟</div>
                    <div>
                        <div style="font-size:13px;font-weight:500;">
                            ${p.name || '—'}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:10px;
                                    color:var(--grey-light);margin-top:2px;">
                            ID: ${p.id ? p.id.slice(0, 8) : '—'}
                        </div>
                    </div>
                </div>
            </td>
            <td style="color:var(--grey-light);font-size:12px;
                       max-width:220px;overflow:hidden;
                       text-overflow:ellipsis;white-space:nowrap;">
                ${p.description || '—'}
            </td>
            <td style="font-family:var(--font-mono);font-size:13px;
                       color:var(--white);">
                ${fmt(price)}
            </td>
            <td>
    <span style="
        padding:4px 8px;
        border-radius:4px;
        font-size:11px;
        font-family:var(--font-mono);
        font-weight:600;
        ${p.status === 'ACTIVE'
            ? 'background:rgba(0,255,120,.12);color:#00ff88;border:1px solid rgba(0,255,120,.25);'
            : 'background:rgba(255,0,0,.12);color:#ff5c5c;border:1px solid rgba(255,0,0,.25);'}
    ">
        ${p.status || 'UNKNOWN'}
    </span>
</td>
            <td style="font-family:var(--font-mono);font-size:11px;
                       color:var(--grey-light);">
                ${fmtDate(p.createdAt)}
            </td>
            <td style="font-family:var(--font-mono);font-size:11px;
                       color:var(--grey-light);">
                ${fmtDate(p.updatedAt)}
            </td>
            <td>
                <button class="tbl-action" onclick="editProduct('${p.id}')">Sửa</button>         
            </td>
        </tr>`;
    }).join('');

    renderPagination('products', total, page);
}

function openProductModal() {
    document.getElementById('product-modal-title').textContent = 'THÊM SẢN PHẨM';
    document.getElementById('pm-id').value = '';
    document.getElementById('pm-name').value = '';
    document.getElementById('pm-desc').value = '';
    document.getElementById('pm-price').value = '';
    document.getElementById('pm-status').value = 'ACTIVE';
    document.getElementById('pm-device-id').value = '';
    document.getElementById('pm-device-name').value = '';
    document.getElementById('device-section').style.display = 'block';

    openModal('modal-product');
}

function editProduct(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('product-modal-title').textContent = 'SỬA SẢN PHẨM';
    document.getElementById('pm-id').value = p.id;
    document.getElementById('pm-name').value = p.name || '';
    document.getElementById('pm-desc').value = p.description || '';
    document.getElementById('pm-price').value = p.price || '';
    document.getElementById('pm-status').value = p.status || 'ACTIVE';
    // Ẩn section device khi SỬA
    document.getElementById('device-section').style.display = 'none';

    openModal('modal-product');
}

async function saveProduct() {
    const id = document.getElementById('pm-id').value;
    const name = document.getElementById('pm-name').value.trim();
    const desc = document.getElementById('pm-desc').value.trim();
    const price = Number(document.getElementById('pm-price').value);
    const status = document.getElementById('pm-status').value;

    if (!name || !price) {
        showToast('Vui lòng nhập tên và giá sản phẩm!', true);
        return;
    }

    let body;

    if (!id) {
        // ── THÊM MỚI — cần device
        const deviceId = document.getElementById('pm-device-id').value.trim();
        const deviceName = document.getElementById('pm-device-name').value.trim();

        if (!deviceId || !deviceName) {
            showToast('Vui lòng nhập thông tin thiết bị!', true);
            return;
        }

        body = {
            name, description: desc, price, status,
            device: {deviceId, name: deviceName}
        };
    } else {
        // ── SỬA — không có device
        body = {name, description: desc, price, status};
    }

    try {
        if (id) {
            await apiFetch(`/api/product/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            const p = allProducts.find(x => x.id === id);
            if (p) Object.assign(p, body);
            showToast('Đã cập nhật sản phẩm!');
        } else {
            const res = await apiFetch('/api/product', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            const newProd = res?.result ?? res;
            if (newProd) allProducts.unshift(newProd);
            showToast('Đã thêm sản phẩm mới!');
        }
    } catch (e) {
        const errMsg = e.response?.data?.message
            ?? e.response?.data?.result
            ?? e.message
            ?? (id ? 'Cập nhật thất bại!' : 'Thêm sản phẩm thất bại!');
        showToast(errMsg, true);
        console.error(e);
    }

    closeModal('modal-product');
    renderProducts();
}

function deleteProduct(id, name) {
    // Hiện modal confirm riêng
    document.getElementById('confirm-prod-name').textContent = name;
    document.getElementById('confirm-delete-prod-btn').onclick = async () => {
        closeModal('modal-confirm-product');
        try {
            await apiFetch(`/api/product/${id}`, {method: 'DELETE'});
            showToast('Đã xóa sản phẩm!');
        } catch (e) {
            showToast('Đã xóa (demo)!');
        }
        allProducts = allProducts.filter(p => p.id !== id);
        renderProducts();
    };
    openModal('modal-confirm-product');
}

// ══════════════════════════
// DEVICES
// ══════════════════════════
const DEV_STATUS = {
    ACTIVE: {label: 'Active', cls: 'badge-green', color: '#00c864', dot: '#00c864'},
    INACTIVE: {label: 'Inactive', cls: 'badge-grey', color: '#666', dot: '#444'},
    SOLD: {label: 'Sold', cls: 'badge-gold', color: '#f5c842', dot: '#f5c842'},
    OFFLINE: {label: 'Offline', cls: 'badge-red', color: '#e81c1c', dot: '#e81c1c'},
    BLOCKED: {label: 'Blocked', cls: 'badge-red', color: '#e81c1c', dot: '#e81c1c'},
};

async function loadDevices() {
    const body = document.getElementById('devices-body');
    body.innerHTML = '<tr><td colspan="7" class="tbl-empty">ĐANG TẢI...</td></tr>';

    try {
        const res = await apiFetch('/api/device');
        allDevices = res?.result ?? res ?? [];
        if (!Array.isArray(allDevices)) allDevices = [];
    } catch (e) {
        allDevices = [];
        body.innerHTML = '<tr><td colspan="7" class="tbl-empty" style="color:var(--red);">⚠ KHÔNG THỂ TẢI THIẾT BỊ</td></tr>';
        return;
    }
    renderDevices();
}

function filterDevices() {
    currentPage.devices = 1;
    renderDevices();
}

function renderDevices() {
    const search = document.getElementById('device-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('device-filter')?.value || '';

    let filtered = allDevices.filter(d => {
        const match = !search
            || (d.deviceId || '').toLowerCase().includes(search)
            || (d.name || '').toLowerCase().includes(search)
            || (d.userId || '').toLowerCase().includes(search);
        const sf = !filter || d.status === filter;
        return match && sf;
    });

    // Label tổng + đếm online
    const onlineCount = allDevices.filter(d => d.status === 'ACTIVE').length;
    const lbl = document.getElementById('devices-total-label');
    if (lbl) lbl.textContent =
        `${filtered.length} / ${allDevices.length} thiết bị  •  ${onlineCount} online`;

    const total = filtered.length;
    const page = currentPage.devices;
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const body = document.getElementById('devices-body');

    if (!paged.length) {
        body.innerHTML = '<tr><td colspan="7" class="tbl-empty">KHÔNG CÓ THIẾT BỊ</td></tr>';
        renderPagination('devices', total, page);
        return;
    }

    body.innerHTML = paged.map(d => {
        const st = DEV_STATUS[d.status] || {label: d.status || '—', cls: 'badge-grey', dot: '#444'};
        const hasOwner = !!d.userId;
        return `<tr style="cursor:pointer;" onclick="viewDeviceDetail('${d.deviceId}')">
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:8px;height:8px;border-radius:50%;
                                background:${st.dot};flex-shrink:0;
                                ${d.status === 'ACTIVE' ? 'box-shadow:0 0 6px ' + st.dot + ';' : ''}">
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;
                                 color:var(--white);">${d.deviceId || '—'}</span>
                </div>
            </td>
            <td style="font-size:13px;">${d.name || '—'}</td>
            <td>
                ${hasOwner
            ? `<span style="font-family:var(--font-mono);font-size:11px;
                                   color:var(--blue);">${d.userId.slice(0, 8).toUpperCase()}</span>`
            : `<span style="font-size:12px;color:var(--grey-light);">Chưa có chủ</span>`
        }
            </td>
            <td>
                <span class="badge ${st.cls}">${st.label}</span>
            </td>
            <td style="font-family:var(--font-mono);font-size:11px;
                       color:var(--grey-light);">
                ${fmtDateTime(d.configuredAt)}
            </td>
            <td style="font-family:var(--font-mono);font-size:11px;
                       color:var(--grey-light);">
                ${fmtDateTime(d.lastConnectedAt)}
            </td>
            <td onclick="event.stopPropagation()">
                <button class="tbl-action"
                        onclick="viewDeviceDetail('${d.deviceId}')">
                    Chi tiết
                </button>
            </td>
        </tr>`;
    }).join('');

    renderPagination('devices', total, page);
}

function viewDeviceDetail(deviceId) {
    const d = allDevices.find(x => x.deviceId === deviceId);
    if (!d) return;

    const st = DEV_STATUS[d.status] || {label: d.status || '—', cls: 'badge-grey', dot: '#444'};

    // Header
    document.getElementById('dev-status-dot').style.background = st.dot;
    document.getElementById('dev-status-dot').style.boxShadow =
        d.status === 'ACTIVE' ? `0 0 8px ${st.dot}` : 'none';
    document.getElementById('dev-modal-id').textContent = d.deviceId || '—';
    document.getElementById('dev-modal-name').textContent = d.name || '—';

    const fields = [
        ['Device ID', d.deviceId],
        ['Tên thiết bị', d.name],
        ['Chủ sở hữu (ID)', d.userId || 'Chưa có chủ'],
        ['Trạng thái', `<span class="badge ${st.cls}">${st.label}</span>`],
        ['Cấu hình lúc', fmtDateTime(d.configuredAt)],
        ['Kết nối lần cuối', fmtDateTime(d.lastConnectedAt)],
        ['Ngày tạo', fmtDateTime(d.created)],
    ];

    document.getElementById('device-detail-body').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${fields.map(([k, v]) => `
            <div style="background:var(--black);padding:12px 14px;
                        border:1px solid var(--grey-border);">
                <div style="font-family:var(--font-mono);font-size:9px;
                            letter-spacing:2px;text-transform:uppercase;
                            color:var(--grey-light);margin-bottom:5px;">${k}</div>
                <div style="font-size:13px;">${v || '—'}</div>
            </div>`).join('')}
        </div>`;

    // Footer
    document.getElementById('device-detail-footer').innerHTML = `
        <button class="btn btn-secondary"
                onclick="closeModal('modal-device')">Đóng</button>`;

    openModal('modal-device');
}

// ══════════════════════════
// ORDERS
// ══════════════════════════

// Map phương thức thanh toán hiển thị
const PAYMENT_METHOD = {
    BANKING: {label: 'Chuyển khoản', cls: 'badge-blue'},
    COD: {label: 'Tiền mặt (COD)', cls: 'badge-grey'},
    MOMO: {label: 'Momo', cls: 'badge-pink'},
    VNPAY: {label: 'VNPay', cls: 'badge-blue'},
};

async function loadOrders() {
    try {
        const res = await apiFetch('/api/orders');
        allOrders = res?.result ?? res ?? [];
        if (!Array.isArray(allOrders)) allOrders = [];
    } catch (e) {
        allOrders = demoOrders();
    }
    renderOrders();
}

function filterOrders() {
    currentPage.orders = 1;
    renderOrders();
}

function renderOrders() {
    const search = document.getElementById('order-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('order-filter')?.value || '';

    let filtered = allOrders.filter(o => {
        const match = !search
            || shortId(o.orderId).toLowerCase().includes(search)
            || (o.user?.username || '').toLowerCase().includes(search)
            || (o.user?.name || '').toLowerCase().includes(search)
            || (o.user?.email || '').toLowerCase().includes(search);
        return match && (!filter || o.orderStatus === filter);
    });

    const total = filtered.length, page = currentPage.orders;
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const body = document.getElementById('orders-body');

    if (!paged.length) {
        body.innerHTML = '<tr><td colspan="11" class="tbl-empty">KHÔNG CÓ ĐƠN HÀNG</td></tr>';
        renderPagination('orders', total, page);
        return;
    }

    body.innerHTML = paged.map(o => {
        const st = ORDER_STATUS[o.orderStatus] || {label: o.orderStatus, cls: 'badge-grey'};
        const pt = PAYMENT_STATUS[o.paymentStatus] || {label: o.paymentStatus, cls: 'badge-grey'};
        const pm = PAYMENT_METHOD[o.paymentMethod] || {label: o.paymentMethod || '—', cls: 'badge-grey'};
        const discount = Number(o.discountAmount || 0);
        const subtotal = Number(o.totalAmount || 0) + discount;   // tạm tính = tổng + giảm giá

        return `<tr>
      <td style="font-family:var(--font-mono);font-size:11px">${shortId(o.orderId)}</td>
      <td>
        <div>${o.user?.name || o.user?.username || '—'}</div>
        <div style="font-size:11px;color:var(--grey-light)">${o.user?.email || ''}</div>
      </td>
      <td style="color:var(--grey-light);font-size:12px">${o.items?.length || 0} sản phẩm</td>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--grey-light)">${fmt(subtotal)}</td>
      <td>
       ${o.voucherCode
            ? `<span class="badge badge-green">🎫 ${o.voucherCode}</span>`
            : '<span style="color:var(--grey-light);font-size:11px">—</span>'}
      </td>
      <td style="font-family:var(--font-mono)">${fmt(o.totalAmount)}</td>
      <td><span class="badge ${pm.cls}">${pm.label}</span></td>
      <td><span class="badge ${pt.cls}">${pt.label}</span></td>
      <td><span class="badge ${st.cls}">${st.label}</span></td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--grey-light)">${fmtDate(o.createdAt)}</td>
      <td>
        <button class="tbl-action" onclick="viewOrder('${o.orderId}')">Chi tiết</button>
      </td>
    </tr>`;
    }).join('');

    renderPagination('orders', total, page);
}

function viewOrder(id) {
    const o = allOrders.find(x => x.orderId === id);
    if (!o) return;

    const steps = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];
    const curIdx = steps.indexOf(o.orderStatus);
    const isCancelled = o.orderStatus === 'CANCELLED';
    const st = ORDER_STATUS[o.orderStatus] || {label: o.orderStatus, cls: 'badge-grey'};
    const pt = PAYMENT_STATUS[o.paymentStatus] || {label: o.paymentStatus, cls: 'badge-grey'};
    const pm = PAYMENT_METHOD[o.paymentMethod] || {label: o.paymentMethod || '—', cls: 'badge-grey'};
    const discount = Number(o.discountAmount || 0);
    const subtotal = Number(o.totalAmount || 0) + discount;

    document.getElementById('order-detail-body').innerHTML = `
    ${isCancelled ? `<div style="padding:12px 16px;background:rgba(232,28,28,.08);border:1px solid rgba(232,28,28,.2);margin-bottom:20px;font-family:var(--font-mono);font-size:11px;color:var(--red)">ĐƠN HÀNG ĐÃ BỊ HUỶ</div>` : `
    <div class="order-timeline" style="margin-bottom:24px">
      ${steps.map((s, i) => {
        const done = i < curIdx, active = i === curIdx;
        const labels = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao'];
        const icons = ['⏳', '✓', '🚚', '📦'];
        return `<div class="timeline-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
          <div class="timeline-dot">${icons[i]}</div>
          <div class="timeline-label">${labels[i]}</div>
        </div>`;
    }).join('')}
    </div>`}

    <!-- Thông tin đơn hàng -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div style="background:var(--black);padding:12px;border:1px solid var(--grey-border)">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light);margin-bottom:4px">MÃ ĐƠN</div>
        <div style="font-family:var(--font-mono);font-size:12px">${shortId(o.orderId)}</div>
      </div>
      <div style="background:var(--black);padding:12px;border:1px solid var(--grey-border)">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light);margin-bottom:4px">NGÀY TẠO</div>
        <div style="font-family:var(--font-mono);font-size:12px">${fmtDate(o.createdAt)}</div>
      </div>
      <div style="background:var(--black);padding:12px;border:1px solid var(--grey-border)">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light);margin-bottom:4px">PHƯƠNG THỨC TT</div>
        <span class="badge ${pm.cls}">${pm.label}</span>
      </div>
      <div style="background:var(--black);padding:12px;border:1px solid var(--grey-border)">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light);margin-bottom:4px">TRẠNG THÁI TT</div>
        <span class="badge ${pt.cls}">${pt.label}</span>
      </div>
      <div style="background:var(--black);padding:12px;border:1px solid var(--grey-border);grid-column:1 / -1">
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light);margin-bottom:4px">TRẠNG THÁI ĐƠN</div>
        <span class="badge ${st.cls}">${st.label}</span>
      </div>
    </div>

    <!-- Thông tin khách hàng -->
    <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:var(--grey-light);margin-bottom:10px">KHÁCH HÀNG</div>
    <div style="background:var(--black);padding:14px;border:1px solid var(--grey-border);margin-bottom:20px;
                display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light)">HỌ TÊN</div>
        <div style="font-size:13px">${o.user?.name || '—'}</div>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light)">USERNAME</div>
        <div style="font-size:13px">${o.user?.username || '—'}</div>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light)">EMAIL</div>
        <div style="font-size:13px">${o.user?.email || '—'}</div>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light)">SỐ ĐIỆN THOẠI</div>
        <div style="font-size:13px">${o.user?.phone || '—'}</div>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light)">GIỚI TÍNH</div>
        <div style="font-size:13px">${o.user?.gender || '—'}</div>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--grey-light)">NGÀY SINH</div>
        <div style="font-size:13px">${o.user?.dob ? fmtDate(o.user.dob) : '—'}</div>
      </div>
    </div>

    <!-- Sản phẩm -->
    ${o.items?.length ? `
    <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:var(--grey-light);margin-bottom:10px">SẢN PHẨM (${o.items.length})</div>
    ${o.items.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
                  padding:12px;border:1px solid var(--grey-border);margin-bottom:6px;background:var(--black)">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${item.product?.name || 'Sản phẩm'}</div>
          ${item.product?.description ? `<div style="font-size:11px;color:var(--grey-light);margin-top:2px">${item.product.description}</div>` : ''}
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--grey-light);margin-top:6px">
            ${fmt(item.unitPrice)} × ${item.quantity}
            ${item.deviceId ? `<span style="margin-left:8px;padding:2px 6px;background:rgba(70,130,220,.12);border:1px solid rgba(70,130,220,.3);color:var(--blue);border-radius:3px">Device: ${item.deviceId}</span>` : ''}
          </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:13px;white-space:nowrap;margin-left:12px">${fmt(item.subtotal)}</div>
      </div>`).join('')}` : '<div style="color:var(--grey-light);font-size:12px">Không có sản phẩm</div>'}

    <div style="border-top:1px solid var(--grey-border);padding-top:12px;margin-top:12px;
                display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:var(--grey-light)">TỔNG CỘNG</span>
      <span style="font-family:var(--font-display);font-size:24px;color:var(--red)">${fmt(o.totalAmount)}</span>
    </div>`;

    const footer = document.getElementById('order-detail-footer');
    const btns = [];
    if (o.orderStatus === 'PENDING') {
        btns.push(`<button class="btn btn-success" onclick="confirmOrder('${o.orderId}');closeModal('modal-order')">✓ XÁC NHẬN</button>`);
        btns.push(`<button class="btn btn-danger" onclick="cancelOrderAdmin('${o.orderId}');closeModal('modal-order')">✕ HUỶ ĐƠN</button>`);
    }
    if (o.orderStatus === 'CONFIRMED')
        btns.push(`<button class="btn btn-primary" onclick="updateOrderStatus('${o.orderId}','SHIPPING');closeModal('modal-order')">🚚 GỬI HÀNG</button>`);
    if (o.orderStatus === 'SHIPPING')
        btns.push(`<button class="btn btn-success" onclick="updateOrderStatus('${o.orderId}','DELIVERED');closeModal('modal-order')">📦 ĐÃ GIAO</button>`);
    footer.innerHTML = `<button class="btn btn-secondary" onclick="closeModal('modal-order')">Đóng</button>${btns.join('')}`;
    openModal('modal-order');
}

async function confirmOrder(id) {
    try {
        await apiFetch(`/api/orders/${id}/confirm`, {method: 'PUT'});
        showToast('Đã xác nhận đơn hàng');
        await loadOrders();
        document.getElementById('pending-badge').textContent =
            allOrders.filter(x => x.orderStatus === 'PENDING').length;
    } catch (e) {
        const msg = e.response?.data?.message ?? 'Xác nhận thất bại!';
        showToast(msg, true);
    }
}

async function cancelOrderAdmin(id) {
    confirm2('Huỷ đơn hàng', 'Xác nhận huỷ đơn hàng này?', async () => {
        try {
            await apiFetch(`/api/orders/${id}/cancel`, {method: 'POST'});
            showToast('Đã huỷ đơn hàng');
            await loadOrders();
        } catch (e) {
            const msg = e.response?.data?.message ?? 'Huỷ đơn thất bại!';
            showToast(msg, true);
        }
    });
}

async function updateOrderStatus(id, status) {
    try {
        await apiFetch(`/admin/orders/${id}/status`, {method: 'PATCH', body: JSON.stringify({status})});
        showToast('Đã cập nhật trạng thái');
    } catch (e) {
        showToast('Đã cập nhật (demo)');
    }
    const o = allOrders.find(x => x.orderId === id);
    if (o) o.orderStatus = status;
    renderOrders();
}

// ══════════════════════════
// ANALYTICS
// ══════════════════════════
async function loadAnalytics() {
    if (!allOrders.length) {
        try {
            const res = await apiFetch('/api/orders');
            allOrders = res?.result ?? res ?? [];
        } catch (e) {
            allOrders = [];
        }
    }
    const delivered = allOrders.filter(o => o.orderStatus === 'DELIVERED');
    const total = delivered.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const avg = delivered.length ? total / delivered.length : 0;
    const rate = allOrders.length ? (delivered.length / allOrders.length * 100) : 0; // Tỉ lệ Hoàn Thành

    document.getElementById('a-total').textContent = fmt(total);
    document.getElementById('a-success').textContent = delivered.length;
    document.getElementById('a-avg').textContent = fmt(avg);
    document.getElementById('a-rate').textContent = rate.toFixed(1) + '%';

    buildMonthlyChart();
    buildPaymentChart();
}

function buildMonthlyChart() {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();

    const year = Number(document.getElementById('year-select')?.value) || new Date().getFullYear();
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    const monthlyData = months.map((_, i) => {
        return allOrders
            .filter(o => {
                if (o.orderStatus !== 'DELIVERED') return false;
                const d = new Date(o.createdAt);
                return d.getFullYear() === year && d.getMonth() === i;
            })
            .reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    });

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Doanh thu',
                data: monthlyData,
                backgroundColor: 'rgba(232,28,28,.7)', borderColor: '#e81c1c', borderWidth: 1,
            }]
        },
        options: {
            responsive: true, plugins: {
                legend: {display: false}, tooltip: {
                    callbacks: {label: c => '  ' + fmt(c.parsed.y)},
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a',
                    borderWidth: 1,
                    titleColor: '#888',
                    bodyColor: '#f5f5f0',
                }
            }, scales: {
                x: {
                    grid: {color: 'rgba(255,255,255,.04)'},
                    ticks: {color: '#666', font: {family: 'Space Mono', size: 9}}
                },
                y: {
                    grid: {color: 'rgba(255,255,255,.04)'},
                    ticks: {color: '#666', font: {family: 'Space Mono', size: 9}, callback: v => fmt(v)}
                },
            }
        }
    });
}

function buildPaymentChart() {
    const ctx = document.getElementById('payment-chart').getContext('2d');
    if (paymentChart) paymentChart.destroy();

    const cod = allOrders.filter(o => o.paymentMethod === 'COD').length;
    const bank = allOrders.filter(o => o.paymentMethod === 'BANKING').length;

    paymentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['COD', 'Chuyển khoản'],
            datasets: [{
                data: [cod, bank],
                backgroundColor: ['#e81c1c', '#3b82f6'],
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true, plugins: {
                legend: {labels: {color: '#888', font: {family: 'Space Mono', size: 10}}},
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    borderColor: '#2a2a2a',
                    borderWidth: 1,
                    titleColor: '#888',
                    bodyColor: '#f5f5f0'
                },
            }
        }
    });
}

function loadYearChart() {
    buildMonthlyChart();
}

// ══════════════════════════
// VOUCHERS
// ══════════════════════════
async function loadVouchers() {
    try {
        const res = await apiFetch('/api/voucher');
        allVouchers = res?.result ?? res ?? [];
        if (!Array.isArray(allVouchers)) allVouchers = [];
    } catch (e) {
        allVouchers = [];
    }
    renderVouchers();
}

function renderVouchers() {
    const body = document.getElementById('vouchers-body');
    if (!allVouchers.length) {
        body.innerHTML = '<tr><td colspan="9" class="tbl-empty">CHƯA CÓ VOUCHER</td></tr>';
        return;
    }
    body.innerHTML = allVouchers.map(v => {
        const expired = v.expiredAt && new Date(v.expiredAt) < new Date();
        const isLive = v.active && !expired;

        return `<tr>
      <td style="font-family:var(--font-mono);font-size:12px;color:var(--gold)">${v.code}</td>
      <td><span class="badge badge-blue">${v.discountType === 'PERCENT' ? '%' : 'đ'}</span></td>
      <td style="font-family:var(--font-mono)">${v.discountType === 'PERCENT' ? v.discountValue + '%' : fmt(v.discountValue)}</td>
      <td style="font-family:var(--font-mono);color:var(--grey-light)">${v.maxDiscount ? fmt(v.maxDiscount) : '—'}</td>
      <td style="font-family:var(--font-mono)">${fmt(v.minOrderValue)}</td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--grey-light)">${v.expiredAt ? fmtDate(v.expiredAt) : 'Không hết hạn'}</td>
      <td><span class="badge ${isLive ? 'badge-green' : 'badge-red'}">${isLive ? 'Hoạt động' : 'Hết hạn'}</span></td>
      <td><button class="tbl-action danger" onclick="deleteVoucher('${v.id}')">Xoá</button></td>
    </tr>`;
    }).join('');
}

function toggleMaxDiscountField() {
    const type = document.getElementById('vm-type').value;
    const wrap = document.getElementById('vm-max-discount-wrap');
    wrap.style.display = type === 'PERCENT' ? 'block' : 'none';
    if (type === 'FIXED') document.getElementById('vm-max').value = '';
}

function openVoucherModal() {
    ['vm-code', 'vm-value', 'vm-min', 'vm-max'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('vm-type').value = 'PERCENT';
    document.getElementById('vm-expire').value = '';
    toggleMaxDiscountField();
    openModal('modal-voucher');
}

async function saveVoucher() {
    const type = document.getElementById('vm-type').value;
    const body = {
        code: document.getElementById('vm-code').value.trim().toUpperCase(),
        discountType: type,
        discountValue: Number(document.getElementById('vm-value').value),
        maxDiscount: type === 'PERCENT'
            ? (Number(document.getElementById('vm-max').value) || null)
            : null,
        minOrderValue: Number(document.getElementById('vm-min').value) || 0,
        expiredAt: document.getElementById('vm-expire').value || null,
        active: true,
    };

    if (!body.code || !body.discountValue) {
        showToast('Điền đầy đủ thông tin', true);
        return;
    }
    if (type === 'PERCENT' && body.discountValue > 100) {
        showToast('Giảm theo % không được vượt quá 100', true);
        return;
    }

    try {
        await apiFetch('/api/voucher', {method: 'POST', body: JSON.stringify(body)});
        showToast('Đã tạo voucher');
        await loadVouchers();
    } catch (e) {
        allVouchers.push({id: 'demo-' + Date.now(), createdAt: new Date().toISOString(), ...body});
        renderVouchers();
        showToast('Đã tạo (demo)');
    }
    closeModal('modal-voucher');
}

function deleteVoucher(id) {
    confirm2('Xoá voucher', 'Xác nhận xoá voucher này?', async () => {
        try {
            await apiFetch(`/api/voucher/${id}`, {method: 'DELETE'});
            showToast('Đã xoá');
        } catch (e) {
            showToast('Đã xoá (demo)');
        }
        allVouchers = allVouchers.filter(v => v.id !== id);
        renderVouchers();
    });
}

// ══════════════════════════
// PAGINATION
// ══════════════════════════
function renderPagination(key, total, current) {
    const el = document.getElementById(key + '-pagination');
    if (!el) return;
    const pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) {
        el.innerHTML = '';
        return;
    }
    let html = '';
    for (let i = 1; i <= Math.min(pages, 7); i++)
        html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="gotoPage('${key}',${i})">${i}</button>`;
    el.innerHTML = html + `<span class="page-info">${total} kết quả</span>`;
}

function gotoPage(key, page) {
    currentPage[key] = page;
    if (key === 'users') renderUsers();
    if (key === 'products') renderProducts();
    if (key === 'devices') renderDevices();
    if (key === 'orders') renderOrders();
}

// ══════════════════════════
// EXPOSE TO WINDOW
// ══════════════════════════
window.doLogin = doLogin;
window.doLogout = doLogout;
window.goPage = goPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openProductModal = openProductModal;
window.viewUser = viewUser;
window.toggleUser = toggleUser;
window.viewOrder = viewOrder;
window.confirmOrder = confirmOrder;
window.cancelOrderAdmin = cancelOrderAdmin;
window.updateOrderStatus = updateOrderStatus;
window.filterUsers = filterUsers;
window.filterProducts = filterProducts;
window.filterDevices = filterDevices;
window.filterOrders = filterOrders;
window.gotoPage = gotoPage;
window.setChartPeriod = setChartPeriod;
window.saveVoucher = saveVoucher;
window.openVoucherModal = openVoucherModal;
window.deleteVoucher = deleteVoucher;
window.loadYearChart = loadYearChart;
window.refreshPage = refreshPage;
window.toggleSidebar = toggleSidebar;
window.viewDeviceDetail = viewDeviceDetail;