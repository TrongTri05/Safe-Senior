// ══════════════════════════
// DB PRODUCTS
// ══════════════════════════

// Map emoji theo category hoặc tên sản phẩm (fallback)
function getProductEmoji(product) {
    const name = (product.name || '').toLowerCase();
    if (name.includes('pro'))    return '⌚';
    if (name.includes('sport'))  return '🏃';
    if (name.includes('kids'))   return '🧒';
    if (name.includes('senior')) return '👴';
    if (name.includes('family')) return '👨‍👩‍👧';
    if (name.includes('elite'))  return '💎';
    return '📟';
}

function dbProductCardHTML(p) {
    // Dùng imageUrl nếu có, fallback emoji
    const imgContent = p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}" style="width:70%;height:70%;object-fit:contain;">`
        : `<div style="font-size:80px;display:flex;align-items:center;justify-content:center;">${getProductEmoji(p)}</div>`;

    const price  = `<span class="product-price">${fmt(p.price)}</span>`;
    const oldP   = p.oldPrice ? `<span class="product-price old">${fmt(p.oldPrice)}</span>` : '';
    const badge  = p.badge    ? `<div class="product-badge ${p.badgeType || ''}">${p.badge}</div>` : '';

    return `
    <div class="product-card" onclick="showDbDetail('${p.id}')">
      <div class="product-img">
        ${badge}
        <div class="product-img-inner">${imgContent}</div>
        <button class="product-quick-add" onclick="event.stopPropagation();addToCartDb('${p.id}','${p.name}',${p.price})">
          + THÊM VÀO GIỎ
        </button>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-sub">${p.description || p.sub || ''}</div>
        <div class="product-footer">
          <div style="display:flex;align-items:center;gap:8px;">${oldP}${price}</div>
          <div class="product-colors">
            <div class="color-dot" style="background:#0a0a0a"></div>
            <div class="color-dot" style="background:#e81c1c"></div>
            <div class="color-dot" style="background:#f5f5f0"></div>
          </div>
        </div>
      </div>
    </div>`;
}

async function renderDbProducts() {
    const el = document.getElementById('db-products');
    if (!el) return;

    try {
        const res  = await api.get('/products');        // dùng axios instance của bạn
        const data = res.data?.result ?? res.data ?? [];

        if (!data.length) {
            el.innerHTML = `
              <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--grey-light);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;">
                CHƯA CÓ SẢN PHẨM
              </div>`;
            return;
        }

        el.innerHTML = data.slice(0, 4).map(p => dbProductCardHTML(p)).join('');

        // Re-attach hover cursor cho card mới
        el.querySelectorAll('button, [onclick]').forEach(btn => {
            btn.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
            btn.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
        });

    } catch (err) {
        console.error('Lỗi load sản phẩm DB:', err);
        el.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--red);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;">
            ⚠ KHÔNG THỂ TẢI SẢN PHẨM
          </div>`;
    }
}

// Thêm vào giỏ hàng cho sản phẩm DB
function addToCartDb(id, name, price) {
    const existing = cart.find(x => x.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, qty: 1, name, price, fromDb: true });
    saveCart();
    updateBadge();
    showToast(name + ' — đã thêm vào giỏ!');
}

// Xem detail sản phẩm DB (tuỳ bạn mở rộng sau)
function showDbDetail(id) {
    showToast('Đang tải chi tiết sản phẩm...');
    // TODO: fetch /products/{id} rồi gọi showPage('detail')
}
// Expose ra window
