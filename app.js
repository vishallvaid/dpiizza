// --- CONFIG & STATE ---
let cart = [];
let currentUser = null;
let appliedCoupon = null;
let currentMenu = [];

const DEFAULT_MENU = [
    { id: 1, name: 'Margherita', category: 'veg', price: 299, desc: 'Classic delight with 100% real mozzarella cheese', image: 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=500&q=80' },
    { id: 2, name: 'Farmhouse', category: 'veg', price: 449, desc: 'Delightful combination of onion, capsicum, tomato & mushroom', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=500&q=80' }
];

// Safety wrapper for JSON parse
function safeParse(key, fallback = []) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    } catch (e) {
        console.error(`Error parsing ${key}:`, e);
        return fallback;
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    console.log("Initializing DPizza Site...");
    currentUser = safeParse('dpizza_profile', null);
    loadMenuFromStorage();
    checkProfile();
    setupEventListeners();
}

function loadMenuFromStorage() {
    // If no menu exists, initialize with default
    if (!localStorage.getItem('dpizza_menu')) {
        localStorage.setItem('dpizza_menu', JSON.stringify(DEFAULT_MENU));
    }

    currentMenu = safeParse('dpizza_menu', DEFAULT_MENU);
    if (currentMenu.length === 0) {
        document.getElementById('menuGrid').innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">No items available. Admin is updating the menu.</div>';
    } else {
        renderMenu('all');
    }
}

function setupEventListeners() {
    // Category filtering
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const active = document.querySelector('.cat-chip.active');
            if (active) active.classList.remove('active');
            chip.classList.add('active');
            renderMenu(chip.dataset.category);
        });
    });

    // Cart Interactions
    const cartFab = document.getElementById('cartFab');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartFab) cartFab.addEventListener('click', () => document.getElementById('cartOverlay').classList.remove('hidden'));
    if (closeCart) closeCart.addEventListener('click', () => document.getElementById('cartOverlay').classList.add('hidden'));

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            document.getElementById('cartOverlay').classList.add('hidden');
            document.getElementById('checkoutView').classList.remove('hidden');
            prefillForm();
        });
    }

    // Forms
    const orderForm = document.getElementById('orderForm');
    if (orderForm) orderForm.addEventListener('submit', handleOrderSubmit);

    // Profile
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) profileBtn.addEventListener('click', showProfile);

    // Global UI
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
        });
    });

    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            document.getElementById('successView').classList.add('hidden');
            cart = [];
            appliedCoupon = null;
            updateCartUI();
        });
    }
}

function prefillForm() {
    if (currentUser) {
        const fields = ['userName', 'userPhone', 'userAddress', 'userLandmark'];
        const dataKeys = ['name', 'phone', 'address', 'landmark'];
        fields.forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el) el.value = currentUser[dataKeys[idx]] || '';
        });
    }
}

// --- MENU & DETAIL ---
function renderMenu(category) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = category === 'all' ? currentMenu : currentMenu.filter(i => i.category === category);

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.onclick = () => showProductDetail(item.id);
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="menu-img">
            <div class="menu-info">
                <div class="menu-top">
                    <h3>${item.name}</h3>
                    <span class="badge ${item.category}">${item.category}</span>
                </div>
                <p class="menu-desc">${item.desc}</p>
                <div class="menu-action">
                    <span class="price">₹${item.price}</span>
                    <button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.id})">Add +</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.showProductDetail = (id) => {
    const item = currentMenu.find(i => i.id === id);
    if (!item) return;

    document.getElementById('detailImg').src = item.image;
    document.getElementById('detailName').innerText = item.name;
    document.getElementById('detailDesc').innerText = item.desc;
    document.getElementById('detailPrice').innerText = `₹${item.price}`;

    const badge = document.getElementById('detailBadge');
    badge.innerText = item.category;
    badge.className = `badge ${item.category}`;

    document.getElementById('detailAddBtn').onclick = () => {
        addToCart(item.id);
        hideProductDetail();
    };

    document.getElementById('productDetailModal').classList.remove('hidden');
};

window.hideProductDetail = () => {
    document.getElementById('productDetailModal').classList.add('hidden');
};

// --- CART & COUPONS ---
window.addToCart = (id) => {
    const item = currentMenu.find(i => i.id === id);
    if (!item) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
};

window.updateQty = (id, change) => {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
};

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (appliedCoupon) {
        discount = Math.floor(subtotal * (appliedCoupon.discount / 100));
    }

    const total = subtotal - discount;

    const fab = document.getElementById('cartFab');
    if (fab) {
        if (count > 0) {
            fab.classList.remove('hidden');
            document.getElementById('fabCount').innerText = count;
            document.getElementById('fabTotal').innerText = `₹${total}`;
        } else {
            fab.classList.add('hidden');
        }
    }

    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <div class="qty-controls">
                    <button onclick="updateQty(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQty(${item.id}, 1)">+</button>
                </div>
            `;
            cartItems.appendChild(div);
        });
    }

    const totalEl = document.getElementById('cartTotal');
    if (totalEl) {
        totalEl.innerHTML = appliedCoupon
            ? `<span style="text-decoration: line-through; color: #999; font-size: 1rem;">₹${subtotal}</span> ₹${total}`
            : `₹${total}`;
    }
}

window.applyCoupon = () => {
    const input = document.getElementById('couponInput');
    if (!input) return;
    const code = input.value.toUpperCase();
    const coupons = safeParse('dpizza_coupons');
    const found = coupons.find(c => c.code === code && c.active);
    const msg = document.getElementById('couponMsg');

    if (found) {
        appliedCoupon = found;
        msg.innerText = `Success! ${found.discount}% off applied.`;
        msg.style.color = "green";
        updateCartUI();
    } else {
        appliedCoupon = null;
        msg.innerText = "Invalid or expired coupon.";
        msg.style.color = "red";
        updateCartUI();
    }
};

// --- ORDER SUBMIT ---
async function handleOrderSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = appliedCoupon ? Math.floor(subtotal * (appliedCoupon.discount / 100)) : 0;

    const orderId = 'ORD' + Math.floor(Math.random() * 1000000);
    const orderData = {
        id: orderId,
        name: formData.get('name'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        landmark: formData.get('landmark'),
        payment: formData.get('payment'),
        items: cart,
        subtotal,
        discount,
        total: subtotal - discount,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    // Save profile
    const profile = { name: orderData.name, phone: orderData.phone, address: orderData.address, landmark: orderData.landmark };
    localStorage.setItem('dpizza_profile', JSON.stringify(profile));
    currentUser = profile;

    // Save history
    let history = safeParse('dpizza_history');
    history.push(orderData);
    localStorage.setItem('dpizza_history', JSON.stringify(history));
    localStorage.setItem('last_order_id', orderId);

    document.getElementById('successOrderId').innerText = `#${orderId}`;
    document.getElementById('checkoutView').classList.add('hidden');
    document.getElementById('successView').classList.remove('hidden');
    checkProfile();
}

// --- TRACKING ---
window.trackOrder = (orderId) => {
    if (orderId === 'current') orderId = localStorage.getItem('last_order_id');

    const history = safeParse('dpizza_history');
    const order = history.find(o => o.id === orderId);

    if (!order) {
        alert("Order not found.");
        return;
    }

    document.getElementById('trackOrderId').innerText = `#${order.id}`;
    const badge = document.getElementById('trackStatusBadge');
    badge.innerText = order.status;
    badge.className = `status-badge status-${order.status}`;

    const statusMap = { 'pending': 1, 'preparing': 2, 'dispatched': 3, 'delivered': 4, 'cancelled': 0 };
    const currentStep = statusMap[order.status] || 1;

    document.querySelectorAll('.step').forEach((el, idx) => {
        el.classList.remove('active', 'completed');
        if (idx + 1 < currentStep) el.classList.add('completed');
        if (idx + 1 === currentStep) el.classList.add('active');
    });

    const list = document.getElementById('trackItemsList');
    list.innerHTML = order.items.map(i => `<div class="track-item-row"><span>${i.name} x${i.quantity}</span><span>₹${i.price * i.quantity}</span></div>`).join('');

    document.getElementById('successView').classList.add('hidden');
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('trackingView').classList.remove('hidden');
};

function checkProfile() {
    if (currentUser) document.getElementById('profileBtn').classList.remove('hidden');
}

function showProfile() {
    if (!currentUser) return;
    document.getElementById('profName').innerText = currentUser.name;
    document.getElementById('profPhone').innerText = currentUser.phone;
    document.getElementById('profAddress').innerText = `${currentUser.address}, Near ${currentUser.landmark}`;

    const history = safeParse('dpizza_history');
    const list = document.getElementById('orderHistory');
    list.innerHTML = '';

    if (history.length === 0) {
        list.innerHTML = '<p class="text-muted">No orders yet.</p>';
    } else {
        [...history].reverse().forEach(order => {
            const div = document.createElement('div');
            div.className = 'history-card';
            div.style = 'background: white; padding: 1rem; border-radius: 12px; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);';
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between;"><strong>Order ${order.id}</strong><b>₹${order.total}</b></div>
                <p style="font-size: 0.8rem; margin: 5px 0;">Status: <span class="status-badge status-${order.status}">${order.status}</span></p>
                <div style="margin-top: 10px; display: flex; gap: 5px;">
                    <button class="secondary-btn" style="padding: 5px 10px; font-size: 0.7rem;" onclick="trackOrder('${order.id}')">Track</button>
                    <button class="primary-btn" style="padding: 5px 10px; font-size: 0.7rem;" onclick="reorder(${JSON.stringify(order.items).replace(/"/g, '&quot;')})">Reorder</button>
                </div>
            `;
            list.appendChild(div);
        });
    }
    document.getElementById('profileView').classList.remove('hidden');
}

window.reorder = (items) => {
    cart = [...items];
    document.getElementById('profileView').classList.add('hidden');
    updateCartUI();
    document.getElementById('cartOverlay').classList.remove('hidden');
};
