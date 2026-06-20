import api from "./api.js";

// ══════════════════════════
// DATA
// ══════════════════════════
const products = [
    {
        id: 1,
        name: 'SOS PRO X',
        sub: 'Phiên bản cao cấp',
        price: 1990000,
        oldPrice: 2490000,
        badge: 'Bán chạy',
        badgeType: '',
        category: 'pro',
        emoji: '⌚',
        colors: ['#0a0a0a', '#e81c1c', '#f5f5f0'],
        specs: {
            'GPS': 'Chính xác ±2m',
            'Pin': '7 ngày',
            'Chống nước': 'IP68 / 50m',
            'Màn hình': 'AMOLED 1.4"',
            'Kết nối': 'Bluetooth 5.2 + 4G',
            'Trọng lượng': '42g'
        }
    },
    {
        id: 2,
        name: 'SOS SPORT',
        sub: 'Cho vận động viên',
        price: 1490000,
        oldPrice: null,
        badge: 'Mới',
        badgeType: 'new',
        category: 'sport',
        emoji: '🏃',
        colors: ['#0a0a0a', '#e81c1c', '#2a2a2a'],
        specs: {
            'GPS': 'Chính xác ±3m',
            'Pin': '5 ngày',
            'Chống nước': 'IP67 / 30m',
            'Màn hình': 'LCD 1.2"',
            'Kết nối': 'Bluetooth 5.0',
            'Trọng lượng': '35g'
        }
    },
    {
        id: 3,
        name: 'SOS KIDS',
        sub: 'An toàn cho trẻ nhỏ',
        price: 990000,
        oldPrice: 1290000,
        badge: 'Sale',
        badgeType: '',
        category: 'kids',
        emoji: '🧒',
        colors: ['#ff9900', '#e81c1c', '#00aaff'],
        specs: {
            'GPS': 'Chính xác ±5m',
            'Pin': '4 ngày',
            'Chống nước': 'IP65',
            'Màn hình': 'LED',
            'Kết nối': 'Bluetooth + 4G',
            'Trọng lượng': '28g'
        }
    },
    {
        id: 4,
        name: 'SOS SENIOR',
        sub: 'Dành cho người cao tuổi',
        price: 1290000,
        oldPrice: null,
        badge: '',
        badgeType: '',
        category: 'senior',
        emoji: '👴',
        colors: ['#888888', '#f5f5f0', '#0a0a0a'],
        specs: {
            'GPS': 'Chính xác ±5m',
            'Pin': '10 ngày',
            'Chống nước': 'IP65',
            'Màn hình': 'E-Ink lớn',
            'Kết nối': '4G + WiFi',
            'Trọng lượng': '45g'
        }
    },
    {
        id: 5,
        name: 'SOS PRO ELITE',
        sub: 'Giới hạn cao cấp nhất',
        price: 2990000,
        oldPrice: 3490000,
        badge: 'Limited',
        badgeType: '',
        category: 'pro',
        emoji: '💎',
        colors: ['#f5f5f0', '#e8c000', '#e81c1c'],
        specs: {
            'GPS': 'Chính xác ±1m',
            'Pin': '10 ngày',
            'Chống nước': 'IP68 / 100m',
            'Màn hình': 'AMOLED 1.6"',
            'Kết nối': 'Bluetooth 5.3 + 5G',
            'Trọng lượng': '38g'
        }
    },
    {
        id: 6,
        name: 'SOS SPORT LITE',
        sub: 'Nhẹ nhàng - Hiệu năng cao',
        price: 890000,
        oldPrice: null,
        badge: 'Mới',
        badgeType: 'new',
        category: 'sport',
        emoji: '🚴',
        colors: ['#e81c1c', '#0a0a0a', '#ffffff'],
        specs: {
            'GPS': 'Chính xác ±4m',
            'Pin': '4 ngày',
            'Chống nước': 'IP65',
            'Màn hình': 'OLED 1.1"',
            'Kết nối': 'Bluetooth 5.0',
            'Trọng lượng': '25g'
        }
    },
    {
        id: 7,
        name: 'SOS KIDS PLUS',
        sub: 'Thêm tính năng học tập',
        price: 1190000,
        oldPrice: 1490000,
        badge: 'Sale',
        badgeType: '',
        category: 'kids',
        emoji: '🎒',
        colors: ['#00ccff', '#ff5500', '#f5f5f0'],
        specs: {
            'GPS': 'Chính xác ±3m',
            'Pin': '5 ngày',
            'Chống nước': 'IP67',
            'Màn hình': 'Color LCD 1.3"',
            'Kết nối': '4G + WiFi',
            'Trọng lượng': '30g'
        }
    },
    {
        id: 8,
        name: 'SOS FAMILY',
        sub: 'Kết nối cả gia đình',
        price: 1690000,
        oldPrice: null,
        badge: '',
        badgeType: '',
        category: 'senior',
        emoji: '👨‍👩‍👧',
        colors: ['#0a0a0a', '#e81c1c', '#888'],
        specs: {
            'GPS': 'Chính xác ±3m',
            'Pin': '7 ngày',
            'Chống nước': 'IP67',
            'Màn hình': 'LCD 1.4"',
            'Kết nối': '4G + Bluetooth',
            'Trọng lượng': '40g'
        }
    },
];

let cart = JSON.parse(localStorage.getItem('sosCart') || '[]');
let currentFilter = 'all';
let lastScrollY = 0;
let lastPage = 'home';

// ══════════════════════════
// FORMATTING
// ══════════════════════════
function fmt(n) {
    return n.toLocaleString('vi-VN') + '₫';
}

// ══════════════════════════
// PAGE NAVIGATION
// ══════════════════════════
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    window.scrollTo(0, 0);
    if (id === 'products') renderAllProducts();
    if (id === 'cart') renderCart();
    if (id === 'home') initReveal();
    if (id === 'forgot-password') resetForgotForm?.();
    setTimeout(initReveal, 50);
}

// ══════════════════════════
// PRODUCT CARD HTML (demo)
// ══════════════════════════
function productCardHTML(p, full = false) {
    const colors = p.colors.map(c => `<div class="color-dot" style="background:${c}" title="${c}"></div>`).join('');
    const price = `<span class="product-price">${fmt(p.price)}</span>`;
    const oldP = p.oldPrice ? `<span class="product-price old">${fmt(p.oldPrice)}</span>` : '';
    const badge = p.badge ? `<div class="product-badge ${p.badgeType}">${p.badge}</div>` : '';
    return `
    <div class="product-card" onclick="showDetail(${p.id})">
      <div class="product-img">
        ${badge}
        <div class="product-img-inner" style="font-size:80px;display:flex;align-items:center;justify-content:center;">${p.emoji}</div>
        <button class="product-quick-add" onclick="event.stopPropagation();addToCart(${p.id})">+ THÊM VÀO GIỎ</button>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-sub">${p.sub}</div>
        <div class="product-footer">
          <div style="display:flex;align-items:center;gap:8px;">${oldP}${price}</div>
          <div class="product-colors">${colors}</div>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════
// RENDER FEATURED (demo)
// ══════════════════════════
function renderFeatured() {
    const el = document.getElementById('featured-products');
    if (!el) return;
    el.innerHTML = products.slice(0, 4).map(p => productCardHTML(p)).join('');
}

// ══════════════════════════
// RENDER ALL PRODUCTS (demo)
// ══════════════════════════
function renderAllProducts() {
    const el = document.getElementById('all-products');
    if (!el) return;
    const filtered = currentFilter === 'all'
        ? products
        : products.filter(p => p.category === currentFilter);
    el.innerHTML = filtered.map(p => productCardHTML(p, true)).join('');
}

function filterProducts(cat, btn) {
    currentFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAllProducts();
}

// ══════════════════════════
// PRODUCT DETAIL (demo)
// ══════════════════════════
function showDetail(id) {
    lastScrollY = window.scrollY;
    lastPage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'home';
    const p = products.find(x => x.id === id);
    if (!p) return;
    const colors = p.colors.map((c, i) => `
        <div class="color-swatch ${i === 0 ? 'active' : ''}" style="background:${c}" onclick="selectColor(this)"></div>
    `).join('');
    const specs = Object.entries(p.specs).map(([k, v]) => `
        <div class="spec-row"><span class="spec-key">${k}</span><span>${v}</span></div>
    `).join('');
    const oldP = p.oldPrice
        ? `<span class="detail-price-old">${fmt(p.oldPrice)}</span><span class="detail-price-badge">SALE</span>`
        : '';

    document.getElementById('detail-content').innerHTML = `
    <div style="grid-column:1/-1; margin-bottom:24px; padding-top:24px;">
      <button id="btn-back-detail" data-page="products" style="
        font-family:var(--font-mono);font-size:11px;letter-spacing:2px;
        text-transform:uppercase;background:none;border:none;
        color:var(--grey-light);cursor:pointer;
        display:flex;align-items:center;gap:8px;padding:0;
      ">← QUAY LẠI</button>
    </div>

    <div class="detail-gallery">
      <div class="detail-main-img" style="font-size:120px;">${p.emoji}</div>
      <div class="detail-thumbs">
        <div class="detail-thumb active">${p.emoji}</div>
        <div class="detail-thumb" style="font-size:20px;">📦</div>
        <div class="detail-thumb" style="font-size:20px;">📱</div>
        <div class="detail-thumb" style="font-size:20px;">⚡</div>
      </div>
    </div>

    <div class="detail-info">
      <div class="detail-breadcrumb">
        <a href="#" data-page="home">Trang chủ</a> /
        <a href="#" data-page="products">Sản phẩm</a> /
        <span style="color:var(--white)">${p.name}</span>
      </div>
      <h1 class="detail-name">${p.name}</h1>
      <p class="detail-tagline">${p.sub}</p>
      <div class="detail-price">${fmt(p.price)} ${oldP}</div>
      <div class="label-sm">Màu sắc</div>
      <div class="colors-row">${colors}</div>
      <div class="label-sm">Số lượng</div>
      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty(-1)">−</button>
        <input class="qty-val" type="text" value="1" id="qty-input" readonly>
        <button class="qty-btn" onclick="changeQty(1)">+</button>
      </div>
      <button class="add-to-cart-btn" onclick="addToCartDetail(${p.id})"><span>THÊM VÀO GIỎ</span></button>
      <button class="wishlist-btn">♡ THÊM VÀO WISHLIST</button>
      <div class="detail-specs">
        <div class="label-sm" style="margin-bottom:20px;">Thông số kỹ thuật</div>
        ${specs}
      </div>
    </div>`;

    showPage('detail');
    document.getElementById('btn-back-detail')?.addEventListener('click', () => {
        showPage(lastPage);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({top: lastScrollY, behavior: 'instant'});
            });
        });
    });
}

function selectColor(el) {
    el.parentElement.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active');
}

function changeQty(delta) {
    const inp = document.getElementById('qty-input');
    if (!inp) return;
    let v = parseInt(inp.value) + delta;
    if (v < 1) v = 1;
    if (v > 99) v = 99;
    inp.value = v;
}

// ══════════════════════════
// DB PRODUCTS
// ══════════════════════════
function getProductEmoji(product) {
    const name = (product.name || '').toLowerCase();
    if (name.includes('pro')) return '⌚';
    if (name.includes('sport')) return '🏃';
    if (name.includes('kids')) return '🧒';
    if (name.includes('senior')) return '👴';
    if (name.includes('family')) return '👨‍👩‍👧';
    if (name.includes('elite')) return '💎';
    return '📟';
}

// Cache sản phẩm DB để dùng cho detail
let dbProductsCache = [];

function dbProductCardHTML(p) {
    const emoji = getProductEmoji(p);
    const price = `<span class="product-price">${fmt(Number(p.price))}</span>`;
    return `
    <div class="product-card" onclick="showDbDetail('${p.name}')">
      <div class="product-img">
        <div class="product-img-inner" style="font-size:80px;display:flex;align-items:center;justify-content:center;">${emoji}</div>
        <button class="product-quick-add" onclick="event.stopPropagation();addToCartDb('${p.id}','${p.name}',${Number(p.price)})">
          + THÊM VÀO GIỎ
        </button>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-sub">${p.description || ''}</div>
        <div class="product-footer">
          <div style="display:flex;align-items:center;gap:8px;">${price}</div>
          <div class="product-colors">
            <div class="color-dot" style="background:#0a0a0a"></div>
            <div class="color-dot" style="background:#e81c1c"></div>
            <div class="color-dot" style="background:#f5f5f0"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function addToCartDb(id, name, price) {
    const qty = parseInt(document.getElementById('qty-input')?.value || 1);
    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty += qty;
    else cart.push({id, qty, name, price, fromDb: true});
    saveCart();
    updateBadge();
    showToast(name + ' × ' + qty + ' — đã thêm!');
}

async function checkout() {
    const dbItems = cart.filter(x => x.fromDb);
    if (dbItems.length === 0) {
        showToast('Không có sản phẩm hợp lệ để đặt hàng!');
        return;
    }
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showToast('Vui lòng đăng nhập!');
        return;
    }
    try {
        const res = await api.get(`/users/address/${userId}`);
        const addresses = res.data?.result ?? res.data ?? [];
        const defaultAddr = addresses.find(a => a.isDefault) ?? addresses[0];
        if (!defaultAddr) {
            showToast('Bạn chưa có địa chỉ giao hàng!');
            return;
        }
        const paymentMethod = document.getElementById('payment-method')?.value || 'COD';
        const payload = {
            addressId: defaultAddr.id,
            paymentMethod,
            note: document.querySelector('.note-input')?.value || '',
            voucherCode: appliedVoucher ? appliedVoucher.code : null,
            items: dbItems.map(x => ({
                productId: String(x.id),
                quantity: x.qty
            }))
        };
        await api.post('/buy/orders', payload);
        cart = [];
        appliedVoucher = null;
        saveCart();
        updateBadge();
        showToast('Đặt hàng thành công!');
        showPage('home');
    } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        if (status === 401) {
            showToast('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!');
        } else {
            showToast(msg || 'Lỗi đặt hàng, thử lại!');
        }
        console.error(err);
    }
}

async function renderDBProducts() {
    const el = document.getElementById('db-products');
    if (!el) return;
    try {
        const res = await api.get('/products');
        const data = res.data?.result ?? res.data ?? [];
        console.log('product fields:', Object.keys(data[0])); // ← xem tên các field
        console.log('first product:', data[0]);
        dbProductsCache = data;
        if (!data.length) {
            el.innerHTML = `
              <div style="grid-column:1/-1;text-align:center;padding:40px;
                color:var(--grey-light);font-family:var(--font-mono);
                font-size:12px;letter-spacing:2px;">
                CHƯA CÓ SẢN PHẨM
              </div>`;
            return;
        }
        el.innerHTML = data.slice(0, 4).map(p => dbProductCardHTML(p)).join('');
        el.querySelectorAll('button, [onclick]').forEach(btn => {
            btn.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            btn.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });
    } catch (err) {
        console.error('Lỗi load sản phẩm DB:', err);
        el.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:40px;
            color:var(--red);font-family:var(--font-mono);
            font-size:12px;letter-spacing:2px;">
            ⚠ KHÔNG THỂ TẢI SẢN PHẨM
          </div>`;
    }
}

function showDbDetail(name) {
    lastScrollY = window.scrollY;
    lastPage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'home';
    const p = dbProductsCache.find(x => x.name === name);
    if (!p) return;

    const emoji = getProductEmoji(p);
    const price = Number(p.price);

    document.getElementById('detail-content').innerHTML = `
    <div style="grid-column:1/-1; margin-bottom:24px; padding-top:24px;">
      <button id="btn-back-detail" style="
        font-family:var(--font-mono);font-size:11px;letter-spacing:2px;
        text-transform:uppercase;background:none;border:none;
        color:var(--grey-light);cursor:pointer;
        display:flex;align-items:center;gap:8px;padding:0;
      ">← QUAY LẠI</button>
    </div>

    <div class="detail-gallery">
      <div class="detail-main-img" style="font-size:120px;">${emoji}</div>
      <div class="detail-thumbs">
        <div class="detail-thumb active">${emoji}</div>
        <div class="detail-thumb" style="font-size:20px;">📦</div>
        <div class="detail-thumb" style="font-size:20px;">📱</div>
        <div class="detail-thumb" style="font-size:20px;">⚡</div>
      </div>
    </div>

    <div class="detail-info">
      <div class="detail-breadcrumb">
        <a href="#" data-page="home">Trang chủ</a> /
        <a href="#" data-page="products">Sản phẩm</a> /
        <span style="color:var(--white)">${p.name}</span>
      </div>
      <h1 class="detail-name">${p.name}</h1>
      <p class="detail-tagline">${p.description || ''}</p>
      <div class="detail-price">${fmt(price)}</div>
      <div class="label-sm">Màu sắc</div>
      <div class="colors-row">
        <div class="color-swatch active" style="background:#0a0a0a" onclick="selectColor(this)"></div>
        <div class="color-swatch" style="background:#e81c1c" onclick="selectColor(this)"></div>
        <div class="color-swatch" style="background:#f5f5f0" onclick="selectColor(this)"></div>
      </div>
      <div class="label-sm">Số lượng</div>
      <div class="qty-row">
        <button class="qty-btn" onclick="changeQty(-1)">−</button>
        <input class="qty-val" type="text" value="1" id="qty-input" readonly>
        <button class="qty-btn" onclick="changeQty(1)">+</button>
      </div>
      <button class="add-to-cart-btn" onclick="addToCartDb('${p.id}', '${p.name}', ${price})"><span>THÊM VÀO GIỎ</span></button>
      <button class="wishlist-btn">♡ THÊM VÀO WISHLIST</button>
    </div>`;

    showPage('detail');
    document.getElementById('btn-back-detail')?.addEventListener('click', () => {
        showPage(lastPage);
        // Restore scroll sau khi trang đã hiển thị
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({top: lastScrollY, behavior: 'instant'});
            });
        });
    });
}

// ══════════════════════════
// CART
// ══════════════════════════
function addToCart(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    // Tìm theo String
    const existing = cart.find(x => String(x.id) === String(id));
    if (existing) existing.qty++;
    else cart.push({id, qty: 1});
    saveCart();
    updateBadge();
    showToast(p.name + ' — đã thêm vào giỏ!');
}

function addToCartDetail(id) {
    const qty = parseInt(document.getElementById('qty-input')?.value || 1);
    const p = products.find(x => x.id === id);
    if (!p) return;
    const existing = cart.find(x => String(x.id) === String(id));
    if (existing) existing.qty += qty;
    else cart.push({id, qty});
    saveCart();
    updateBadge();
    showToast(p.name + ' × ' + qty + ' — đã thêm!');
}

function removeFromCart(id) {
    cart = cart.filter(x => String(x.id) !== String(id));
    saveCart();
    updateBadge();
    renderCart();
}

function changeCartQty(id, delta) {
    const item = cart.find(x => String(x.id) === String(id));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(id);
        return;
    }
    saveCart();
    updateBadge();
    renderCart();
}

function saveCart() {
    localStorage.setItem('sosCart', JSON.stringify(cart));
}

function updateBadge() {
    const total = cart.reduce((s, x) => s + x.qty, 0);
    document.getElementById('cart-badge').textContent = total;
    document.getElementById('cart-count-text').textContent = total > 0 ? `(${total})` : '';
}

let appliedVoucher = null;   // { code, discount }

function renderCart() {
    const el = document.getElementById('cart-content');
    if (!el) return;
    if (cart.length === 0) {
        el.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h3>Giỏ hàng trống</h3>
        <p>Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm.</p>
        <button class="btn-primary" onclick="showPage('products')"><span>Khám phá sản phẩm</span></button>
      </div>`;
        return;
    }
    const total = cart.reduce((s, x) => {
        const p = products.find(pr => pr.id === x.id);
        return s + (p ? p.price * x.qty : (x.price || 0) * x.qty);
    }, 0);
    const shipping = 30000;
    const discount = appliedVoucher ? appliedVoucher.discount : 0;
    const grandTotal = Math.max(0, total + shipping - discount);

    const items = cart.map(x => {
        const p = products.find(pr => pr.id === x.id);
        const name = p ? p.name : x.name || 'Sản phẩm';
        const sub = p ? p.sub : x.description || '';
        const emoji = p ? p.emoji : getProductEmoji(x);
        const price = p ? p.price : (x.price || 0);
        return `
      <div class="cart-item">
        <div class="cart-item-img" style="font-size:40px;">${emoji}</div>
        <div>
          <div class="cart-item-name">${name}</div>
          <div class="cart-item-sub">${sub}</div>
          <div class="cart-item-actions">
            <div class="qty-row">
              <button class="qty-btn" onclick="changeCartQty('${x.id}',-1)" style="width:36px;height:36px;font-size:16px;">−</button>
              <input class="qty-val" type="text" value="${x.qty}" readonly style="width:48px;height:36px;font-size:13px;">
              <button class="qty-btn" onclick="changeCartQty('${x.id}',1)" style="width:36px;height:36px;font-size:16px;">+</button>
            </div>
            <button class="cart-remove" onclick="removeFromCart('${x.id}')">Xóa</button>
          </div>
        </div>
        <div class="cart-item-price">${fmt(price * x.qty)}</div>
      </div>`;
    }).join('');

    el.innerHTML = `
    <div class="cart-grid">
      <div class="cart-items">${items}</div>
      <div class="order-summary">
        <div class="summary-title">ĐƠN HÀNG</div>
        <div class="summary-row"><span>Tạm tính</span><span>${fmt(total)}</span></div>
        <div class="summary-row"><span>Phí giao hàng</span><span>${fmt(shipping)}</span></div>
        <div class="summary-row"><span>Giảm giá</span><span style="color:var(--red)">−${fmt(discount)}</span></div>
        <div class="summary-row total"><span>Tổng cộng</span><span>${fmt(grandTotal)}</span></div>

        <input class="promo-input" type="text" id="voucher-input"
               placeholder="MÃ GIẢM GIÁ"
               value="${appliedVoucher ? appliedVoucher.code : ''}"
               ${appliedVoucher ? 'disabled' : ''}>
        <button class="btn-outline" id="apply-voucher-btn"
                style="width:100%;padding:14px;font-family:var(--font-mono);font-size:10px;
                       letter-spacing:3px;text-transform:uppercase;cursor:pointer;margin-bottom:12px;"
                onclick="${appliedVoucher ? 'removeVoucher()' : 'applyVoucherCode()'}">
            ${appliedVoucher ? 'BỎ MÃ' : 'ÁP DỤNG'}
        </button>
        <div id="voucher-msg" style="display:none;font-family:var(--font-mono);
             font-size:11px;margin-bottom:12px;"></div>

        <select class="promo-input" id="payment-method" style="margin-bottom:12px;">
          <option value="COD">Thanh toán khi nhận hàng (COD)</option>
          <option value="BANKING">Chuyển khoản ngân hàng</option>
        </select>
        <button class="btn-primary" style="width:100%;padding:16px;font-size:11px;" onclick="checkout()"><span>THANH TOÁN NGAY</span></button>
      </div>
    </div>`;
}

async function applyVoucherCode() {
    const code = document.getElementById('voucher-input')?.value.trim();
    const msgEl = document.getElementById('voucher-msg');
    if (!code) {
        showVoucherMsg('Vui lòng nhập mã voucher!', true);
        return;
    }

    const total = cart.reduce((s, x) => {
        const p = products.find(pr => pr.id === x.id);
        return s + (p ? p.price * x.qty : (x.price || 0) * x.qty);
    }, 0);

    try {
        // BE endpoint kiểm tra voucher mà KHÔNG dùng nó (chỉ tính toán)
        const res = await api.post('/buy/preview', { code, orderTotal: total });
        const data = res.data?.result ?? res.data;
        appliedVoucher = { code, discount: Number(data.discount || 0) };
        showVoucherMsg(`Áp dụng thành công! Giảm ${fmt(appliedVoucher.discount)}`, false);
        renderCart();
    } catch (err) {
        const msg = err.response?.data?.message ?? 'Mã voucher không hợp lệ!';
        showVoucherMsg(msg, true);
    }
}

function removeVoucher() {
    appliedVoucher = null;
    renderCart();
}

function showVoucherMsg(text, isError) {
    const el = document.getElementById('voucher-msg');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'block';
    el.style.color = isError ? 'var(--red)' : 'var(--green)';
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
// MOBILE MENU
// ══════════════════════════
function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}


// ══════════════════════════
// FORGOT PASSWORD
// ══════════════════════════
let countdownTimer;
async function submitForgotPassword() {
    const email = document.getElementById('forgot-email')?.value.trim();
    const msgEl = document.getElementById('forgot-msg');
    const btn = document.getElementById('forgot-submit-btn');
    // Reset
    msgEl.style.display = 'none';
    msgEl.textContent = '';

    if (!email) {
        showForgotMsg('Vui lòng nhập email!', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showForgotMsg('Email không hợp lệ!', 'error');
        return;
    }

    // Loading state
    btn.disabled = true;
    btn.querySelector('span').textContent = 'ĐANG GỬI...';

    try {
        await api.post('/auth/forgot-password', {email});
        // Chuyển sang step 2
        document.getElementById('forgot-step-1').style.display = 'none';
        document.getElementById('forgot-step-2').style.display = 'flex';
        document.getElementById('forgot-email-display').textContent = email;
        startCountdown();

    } catch (err) {
        const msg = err.response?.data?.message ?? 'Có lỗi xảy ra, thử lại!';
        showForgotMsg(msg, 'error');
    } finally {
        btn.disabled = false;
        btn.querySelector('span').textContent = 'GỬI YÊU CẦU';
    }
}

function showForgotMsg(text, type) {
    const el = document.getElementById('forgot-msg');
    el.textContent = text;
    el.style.display = 'block';
    el.style.borderLeftColor = type === 'error' ? 'var(--red)' : '#00c864';
    el.style.color = type === 'error' ? 'var(--red)' : '#00c864';
}

function startCountdown() {
    let sec = 60;
    const numEl = document.getElementById('countdown-num');
    const countEl = document.getElementById('resend-countdown');
    const resendBtn = document.getElementById('resend-btn');

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        sec--;
        numEl.textContent = sec;
        if (sec <= 0) {
            clearInterval(countdownTimer);
            countEl.style.display = 'none';
            resendBtn.style.display = 'inline';
        }
    }, 1000);
}

async function resendEmail() {
    const email = document.getElementById('forgot-email')?.value.trim();
    if (!email) return;
    try {
        await api.post('/auth/forgot-password', {email});
        // Reset countdown
        document.getElementById('resend-btn').style.display = 'none';
        document.getElementById('resend-countdown').style.display = 'inline';
        startCountdown();
        showToast?.('Đã gửi lại email!');
    } catch (err) {
        showToast?.('Gửi lại thất bại, thử lại!');
    }
}

// Reset form khi quay lại trang
function resetForgotForm() {
    const s1 = document.getElementById('forgot-step-1');
    const s2 = document.getElementById('forgot-step-2');
    if (s1) s1.style.display = 'flex';
    if (s2) s2.style.display = 'none';
    const inp = document.getElementById('forgot-email');
    if (inp) inp.value = '';
    const msg = document.getElementById('forgot-msg');
    if (msg) msg.style.display = 'none';
    clearInterval(countdownTimer);
}


// ══════════════════════════
// CUSTOM CURSOR
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

function animateRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animateRing);
}

animateRing();

document.querySelectorAll('button, a, [onclick]').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

// ══════════════════════════
// SCROLL EFFECTS
// ══════════════════════════
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    initReveal();
});

function initReveal() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 80) el.classList.add('visible');
    });
}

// ══════════════════════════
// INIT — cuối file, sau tất cả hàm
// ══════════════════════════
window.showPage = showPage;
window.toggleMenu = toggleMenu;
window.addToCart = addToCart;
window.addToCartDetail = addToCartDetail;
window.showDetail = showDetail;
window.changeQty = changeQty;
window.changeCartQty = changeCartQty;
window.removeFromCart = removeFromCart;
window.filterProducts = filterProducts;
window.selectColor = selectColor;
window.showToast = showToast;
window.addToCartDb = addToCartDb;
window.showDbDetail = showDbDetail;
window.checkout = checkout;
window.submitForgotPassword = submitForgotPassword;
window.resendEmail = resendEmail;
window.applyVoucherCode = applyVoucherCode;
window.removeVoucher = removeVoucher;

renderFeatured();
renderDBProducts();
updateBadge();
setTimeout(initReveal, 300);

document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-page]');
    if (target) {
        e.preventDefault();
        showPage(target.dataset.page);
    }
});