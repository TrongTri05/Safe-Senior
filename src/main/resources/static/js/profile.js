import api from "./api.js";

// ══════════════════════════
// CURSOR
// ══════════════════════════
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx=0, my=0, rx=0, ry=0;

document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
});

(function animateRing() {
    rx += (mx - rx) * .15;
    ry += (my - ry) * .15;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
})();

document.querySelectorAll('button, a, [onclick]').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
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
        const u   = res.data?.result ?? res.data;
        if (!u) return;
        renderUserView(u);
        renderUserEdit(u);
        renderUserSidebar(u);
    } catch (err) {
        console.error('Lỗi load user:', err);
    }
}

// Format helpers
function fmt(val)      { return val ?? '—'; }
function fmtDate(val)  {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? '—' : d.toLocaleDateString('vi-VN');
}
function fmtJoined(val) {
    if (!val) return '—';
    const d    = new Date(val);
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
    if (nameEl) nameEl.textContent = u.name   ?? u.username ?? '—';
    if (mailEl) mailEl.textContent = u.email  ?? '—';
    if (avatEl) avatEl.textContent = (u.name ?? u.username ?? '?')[0].toUpperCase();
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

    // Trigger fade-in
    tab.style.animation = 'none';
    tab.offsetHeight; // reflow
    tab.style.animation = 'fadeUp 0.4s ease forwards';
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
            name   : document.getElementById('edit-name')?.value || null,
            email  : document.getElementById('edit-email')?.value || null,
            phone  : document.getElementById('edit-phone')?.value || null,
            dob    : document.getElementById('edit-dob')?.value || null,
            gender : document.getElementById('edit-gender')?.value || null,
        };
        const res = await api.put(`/users/username/${username}`, body);
        const u   = res.data?.result ?? res.data;
        if (u) { renderUserView(u); renderUserSidebar(u); }
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
// EXPOSE TO WINDOW
// ══════════════════════════
window.switchTab   = switchTab;
window.toggleEdit  = toggleEdit;
window.saveInfo    = saveInfo;
window.openModal   = openModal;
window.closeModal  = closeModal;
window.toggleSwitch = toggleSwitch;
window.showToast   = showToast;

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
});