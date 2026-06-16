import api from "./api.js";

// ══════════════════════════
// PRIZES CONFIG
// ══════════════════════════
const PRIZES = [
    {id: 0, label: 'Voucher 10%', emoji: '🎫', color: '#e8a020', textColor: '#0a0a0a', weight: 25},
    {id: 1, label: 'Voucher 30%', emoji: '🎟️', color: '#e81c1c', textColor: '#f5f5f0', weight: 15},
    {id: 2, label: 'May mắn lần sau', emoji: '💫', color: '#2a2a2a', textColor: '#888888', weight: 30},
    {id: 3, label: '1x SOS Pro', emoji: '⌚', color: '#1a3a6a', textColor: '#f5f5f0', weight: 3},
    {id: 4, label: '+1 Lượt quay', emoji: '🔄', color: '#1a4a2a', textColor: '#00c864', weight: 12},
    {id: 5, label: 'Voucher 100%', emoji: '🏆', color: '#f5c842', textColor: '#0a0a0a', weight: 2},
    {id: 6, label: 'Voucher 50%', emoji: '💎', color: '#6a1a6a', textColor: '#f5f5f0', weight: 8},
    {id: 7, label: 'Voucher 20%', emoji: '🎁', color: '#3a1a0a', textColor: '#f5a040', weight: 5},
];

// ══════════════════════════
// STATE
// ══════════════════════════
let spinCount = 0;
let totalSpun = 0;
let prizeCount = 0;
let isSpinning = false;
let currentAngle = 0;
let idleAnimId = null;
let spinHistory = [];

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const SIZE = canvas.width;
const R = SIZE / 2;
const SEG = (2 * Math.PI) / PRIZES.length;

// ══════════════════════════
// DRAW WHEEL
// ══════════════════════════
function drawWheel(angle = 0) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(angle);

    PRIZES.forEach((p, i) => {
        const start = i * SEG - Math.PI / 2;
        const end = start + SEG;

        // Segment fill
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R - 6, start, end);
        ctx.closePath();
        ctx.fillStyle = p.color;
        ctx.fill();

        // Segment border
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R - 6, start, end);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.save();
        ctx.rotate(start + SEG / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = p.textColor;
        ctx.font = `bold 12px 'Space Mono', monospace`;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 4;

        // Emoji
        ctx.font = '20px serif';
        ctx.fillText(p.emoji, R - 30, 6);

        // Label (split if long)
        ctx.font = `bold 11px 'Space Mono', monospace`;
        ctx.fillStyle = p.textColor;
        const words = p.label.split(' ');
        if (words.length <= 2) {
            ctx.fillText(p.label, R - 58, 5);
        } else {
            ctx.fillText(words.slice(0, 2).join(' '), R - 58, -3);
            ctx.fillText(words.slice(2).join(' '), R - 58, 12);
        }
        ctx.restore();
    });
    const grad = ctx.createRadialGradient(0, 0, R * 0.45, 0, 0, R - 6);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, R - 6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
}

// ══════════════════════════
// IDLE ANIMATION (slow rotate)
// ══════════════════════════
let lastTime = 0;

function idleLoop(ts) {
    if (!isSpinning) {
        const delta = ts - lastTime;
        lastTime = ts;
        currentAngle += (delta / 1000) * 0.25;
        drawWheel(currentAngle);
    }
    idleAnimId = requestAnimationFrame(idleLoop);
}

requestAnimationFrame(idleLoop);

// ══════════════════════════
// PRIZE LEGEND
// ══════════════════════════
function renderLegend() {
    const el = document.getElementById('prize-legend');
    el.innerHTML = PRIZES.map(p => `
    <div class="prize-item">
      <div class="prize-dot" style="background:${p.color};border:1px solid rgba(255,255,255,0.1);"></div>
      <div class="prize-label">
        <strong>${p.emoji} ${p.label}</strong>
      </div>
    </div>`).join('');
}

// ══════════════════════════
// LOAD USER SPINS
// ══════════════════════════
async function loadSpinData() {
    try {
        const res = await api.get('/spin/info');
        const data = res.data?.result ?? res.data;
        spinCount = data?.remainingSpins ?? 0;
        totalSpun = data?.totalSpins ?? 0;
        prizeCount = 0; // BE chưa trả prizeCount, tính tạm
        updateUI();
        if (data?.history?.length) renderHistory(data.history);
    } catch (err) {
        spinCount = 0;
        totalSpun = 0;
        updateUI();
    }
}

function updateUI() {
    document.getElementById('spinsDisplay').textContent = spinCount;
    document.getElementById('info-spins').textContent = spinCount;
    document.getElementById('info-total').textContent = totalSpun;
    document.getElementById('info-prizes').textContent = prizeCount;

    const btn = document.getElementById('spinBtn');
    if (spinCount <= 0) {
        btn.style.opacity = '0.5';
        document.getElementById('wheel-center-sub') && (document.querySelector('.wheel-center-sub').textContent = 'Hết lượt');
    } else {
        btn.style.opacity = '1';
        document.querySelector('.wheel-center-sub').textContent = 'Nhấn để quay';
    }
}


async function handleSpin() {
    if (isSpinning) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
        showToast('⚠ Vui lòng đăng nhập để quay!', true);
        return;
    }
    if (spinCount <= 0) {
        showToast('⚠ Bạn không còn lượt quay!', true);
        return;
    }

    isSpinning = true;
    cancelAnimationFrame(idleAnimId);

    try {
        const res = await api.post('/spin/spin');
        const data = res.data?.result ?? res.data;
        animateSpin(data.prizeIndex);   // BE trả 0/2/4/7 — FE quay đúng ô
        spinCount = data.remainingSpins;

    } catch (err) {
        isSpinning = false;
        idleAnimId = requestAnimationFrame(idleLoop);
        showToast('⚠ Lỗi kết nối, thử lại!', true);
    }
}

function animateSpin(targetIndex) {
    const segAngle = (2 * Math.PI) / PRIZES.length;
    const targetCenter = targetIndex * segAngle + segAngle / 2;
    const toTop = (2 * Math.PI) - (targetCenter % (2 * Math.PI));
    const normalizedCurrent = ((currentAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const extraSpins = (5 + Math.floor(Math.random() * 3)) * 2 * Math.PI;
    let diff = (toTop - normalizedCurrent + 2 * Math.PI) % (2 * Math.PI);
    if (diff < 0.1) diff += 2 * Math.PI;

    const endAngle = currentAngle + extraSpins + diff;

    const duration = 4500;
    const startAngle = currentAngle;
    const startTime = performance.now();

    function easeOut(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function spinFrame(ts) {
        const elapsed = ts - startTime;
        const progress = Math.min(elapsed / duration, 1);
        currentAngle = startAngle + (endAngle - startAngle) * easeOut(progress);
        drawWheel(currentAngle);

        if (progress < 1) {
            requestAnimationFrame(spinFrame);
        } else {
            isSpinning = false;
            idleAnimId = requestAnimationFrame(idleLoop);
            onSpinEnd(targetIndex);
        }
    }

    requestAnimationFrame(spinFrame);
}

function onSpinEnd(index) {
    const prize = PRIZES[index];
    totalSpun++;
    if (prize.id !== 2) prizeCount++;
    if (prize.id === 4) spinCount++;
    updateUI();
    const now = new Date();
    spinHistory.unshift({prize, time: now});
    renderHistory(spinHistory);
    if (prize.id !== 2) spawnConfetti(prize.color);

    // Hiển thị result
    setTimeout(() => showResult(prize), 400);
}

// ══════════════════════════
// RESULT
// ══════════════════════════
function showResult(prize) {
    const isBad = prize.id === 2;
    document.getElementById('result-emoji').textContent = prize.emoji;
    document.getElementById('result-prize').textContent = prize.label;
    document.getElementById('result-desc').textContent = isBad
        ? 'Đừng nản lòng! Hãy thử lại lần sau nhé 🍀'
        : 'Phần thưởng đã được lưu vào tài khoản của bạn. Kiểm tra trong mục Voucher!';

    const card = document.querySelector('.result-card');
    card.style.borderColor = isBad ? 'var(--grey-border)' : prize.color;
    card.querySelector('.result-label').style.color = isBad ? 'var(--grey-light)' : 'var(--gold)';
    document.getElementById('result-overlay').classList.add('show');
}

function closeResult() {
    document.getElementById('result-overlay').classList.remove('show');
}

// ══════════════════════════
// CONFETTI
// ══════════════════════════
function spawnConfetti(color) {
    const colors = [color, '#f5c842', '#e81c1c', '#ffffff', '#00c864'];
    for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.cssText = `
      left:${Math.random() * 100}vw;
      top:-10px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      width:${4 + Math.random() * 8}px;
      height:${4 + Math.random() * 8}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      --dur:${2 + Math.random() * 2}s;
      --delay:${Math.random() * 0.8}s;
    `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }
}

// ══════════════════════════
// HISTORY
// ══════════════════════════
function renderHistory(list) {
    const el = document.getElementById('history-list');
    if (!list || !list.length) {
        el.innerHTML = '<div class="history-empty">CHƯA CÓ LỊCH SỬ QUAY</div>';
        return;
    }
    el.innerHTML = list.slice(0, 20).map(h => {
        // BE trả prizeIndex và prizeLabel — map sang PRIZES để lấy color/emoji
        const prize = PRIZES[h.prizeIndex] ?? PRIZES[2];
        const time = h.spunAt ? new Date(h.spunAt) : new Date();
        return `
        <div class="history-item">
            <div class="history-prize-dot" style="background:${prize.color}"></div>
            <div class="history-prize-name">${prize.emoji} ${h.prizeLabel}</div>
            <div class="history-time">
                ${time.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
            </div>
        </div>`;
    }).join('');
}

// ══════════════════════════
// MODAL & TOAST
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

let toastTimer;

function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.style.borderLeftColor = isError ? 'var(--red)' : 'var(--gold)';
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ══════════════════════════
// CURSOR
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
document.addEventListener('mouseover', e => {
    if (e.target.closest('button,a,[onclick]')) document.body.classList.add('hovering');
});
document.addEventListener('mouseout', e => {
    if (e.target.closest('button,a,[onclick]')) document.body.classList.remove('hovering');
});



// ══════════════════════════
// EXPOSE & INIT
// ══════════════════════════
// ══════════════════════════
// EXPOSE & INIT
// ══════════════════════════
window.handleSpin  = handleSpin;
window.closeResult = closeResult;
window.openModal   = openModal;
window.closeModal  = closeModal;
window.showToast   = showToast;
renderLegend();
loadSpinData();
drawWheel(0);