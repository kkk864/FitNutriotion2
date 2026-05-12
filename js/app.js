// Общая логика: корзина (localStorage), счётчик, поиск
(function () {
  const CART_KEY = 'fitnutrition_cart';
  const USER_KEY = 'fitnutrition_user';

  function getCart() {
    try {
      const data = localStorage.getItem(CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const el = document.getElementById('cart-count');
    if (el) el.textContent = total;
  }

  window.FitNutrition = {
    getCart,
    saveCart,
    addToCart(productId, quantity = 1) {
      const cart = getCart();
      const existing = cart.find(i => i.id === productId);
      if (existing) existing.quantity = (existing.quantity || 1) + quantity;
      else cart.push({ id: productId, quantity });
      saveCart(cart);
    },
    removeFromCart(productId) {
      saveCart(getCart().filter(i => i.id !== productId));
    },
    setCartQuantity(productId, quantity) {
      if (quantity < 1) return this.removeFromCart(productId);
      const cart = getCart();
      const item = cart.find(i => i.id === productId);
      if (item) item.quantity = quantity;
      saveCart(cart);
    },
    getUser() {
      try {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
    setUser(user) {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    }
  };

  document.addEventListener('DOMContentLoaded', updateCartCount);
})();

(function () {
  const WISHLIST_KEY = 'fitnutrition_wishlist';

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getWishlist() {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(Number) : [];
    } catch {
      return [];
    }
  }

  function setWishlist(ids) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    } catch (_) {}
  }

  function toggleWishlist(productId) {
    const id = Number(productId);
    let list = getWishlist();
    if (list.includes(id)) list = list.filter((x) => x !== id);
    else list.push(id);
    setWishlist(list);
    return list.includes(id);
  }

  function productBrand(p) {
    const byCat = {
      protein: 'Optimum Nutrition',
      gainer: 'BSN',
      amino: 'Xtend',
      vitamins: 'NOW Sports',
      fatburner: 'Nutrex',
      creatine: 'CREAPURE',
      other: 'FitLine'
    };
    return p.brand || byCat[p.category] || 'Sport Series';
  }

  function productOldPrice(p) {
    if (p.oldPrice != null) return p.oldPrice;
    if (p.badge === 'sale') return Math.round(p.price / 0.82);
    return null;
  }

  function ratingStars(rating) {
    const r = Math.round(Number(rating) || 0);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  }

  function productCardHtml(p) {
    const brand = productBrand(p);
    const oldP = productOldPrice(p);
    const badge = p.badge
      ? `<span class="product-card-badge ${p.badge}">${p.badge === 'sale' ? '−20%' : 'Новинка'}</span>`
      : '';
    const wishlistActive = getWishlist().includes(p.id) ? ' is-active' : '';
    const oldPriceHtml = oldP
      ? `<span class="product-card-price-old">${oldP.toLocaleString('ru-RU')} ₽</span>`
      : '';
    const stars = ratingStars(p.rating);
    return `<article class="product-card" data-product-id="${p.id}">
      <div class="product-card-image">
        ${badge}
        <button type="button" class="product-card-fav${wishlistActive}" data-wishlist="${p.id}" aria-label="В избранное">♥</button>
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="product-card-body">
        <div class="product-card-brand">${escapeHtml(brand)}</div>
        <h3 class="product-card-title"><a href="product.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
        <div class="product-card-meta"><span class="product-card-rating">${stars}</span> ${(p.rating || 0).toFixed(1)} · ${escapeHtml(p.weight)}</div>
        <div class="product-card-price-row"><span class="product-card-price">${p.price.toLocaleString('ru-RU')} ₽</span>${oldPriceHtml}</div>
        <button type="button" class="btn btn-primary btn-with-icon" data-add-cart="${p.id}"><span class="btn-icon" aria-hidden="true">🛒</span>В корзину</button>
      </div>
    </article>`;
  }

  function bindProductCardButtons(container) {
    if (!container) return;
    container.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.addCart, 10);
        if (window.FitNutrition) window.FitNutrition.addToCart(id);
        const prev = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon" aria-hidden="true">✓</span>Добавлено';
        btn.classList.add('btn-success-state');
        setTimeout(() => {
          btn.innerHTML = prev;
          btn.classList.remove('btn-success-state');
        }, 1600);
      });
    });
  }

  document.addEventListener('click', function (e) {
    const fav = e.target.closest('[data-wishlist]');
    if (!fav) return;
    e.preventDefault();
    const id = parseInt(fav.dataset.wishlist, 10);
    const on = toggleWishlist(id);
    fav.classList.toggle('is-active', on);
  });

  function initNavActive() {
    const path = (location.pathname.split('/').pop() || '').toLowerCase();
    const current = path === '' ? 'index.html' : path;
    document.querySelectorAll('.nav a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const file = href.split('/').pop().split('?')[0].toLowerCase();
      if (file === current) a.classList.add('active');
    });
  }

  document.addEventListener('DOMContentLoaded', initNavActive);

  window.FitNutrition.productCardHtml = productCardHtml;
  window.FitNutrition.bindProductCardButtons = bindProductCardButtons;
  window.FitNutrition.getWishlist = getWishlist;
  window.FitNutrition.toggleWishlist = toggleWishlist;
  window.FitNutrition.productBrand = productBrand;
  window.FitNutrition.productOldPrice = productOldPrice;
})();
