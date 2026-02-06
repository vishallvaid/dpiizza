// --- CONFIG & STATE ---
let cart = [];
let currentUser = null;
let appliedCoupon = null;
let currentMenu = [];

const DEFAULT_MENU = [
    {
        id: 1, name: 'Margherita', category: 'veg', price: 299, rating: 4.8,
        desc: 'Classic delight with 100% real mozzarella cheese.',
        images: ['https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&w=500&q=80'],
        reviews: [{ user: 'Deepak', comment: 'Best margherita in town!' }, { user: 'Suman', comment: 'Very cheesy.' }]
    }
];

function safeParse(key, fallback = []) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    } catch (e) { return fallback; }
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
    checkForActiveOrder();
}

function loadMenuFromStorage() {
    if (!localStorage.getItem('dpizza_menu')) {
        localStorage.setItem('dpizza_menu', JSON.stringify(DEFAULT_MENU));
    }
    currentMenu = safeParse('dpizza_menu', DEFAULT_MENU);
    renderMenu('all');
}

function setupEventListeners() {
    document.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderMenu(chip.dataset.category);
        });
    });

    document.getElementById('cartFab').onclick = () => document.getElementById('cartOverlay').classList.remove('hidden');
    document.getElementById('closeCart').onclick = () => document.getElementById('cartOverlay').classList.add('hidden');
    document.getElementById('checkoutBtn').onclick = () => {
        document.getElementById('cartOverlay').classList.add('hidden');
        document.getElementById('checkoutView').classList.remove('hidden');
        prefillForm();
    };

    document.getElementById('orderForm').onsubmit = handleOrderSubmit;
    document.getElementById('profileBtn').onclick = showProfile;

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
        };
    });

    document.getElementById('homeBtn').onclick = () => {
        document.getElementById('successView').classList.add('hidden');
        document.getElementById('checkoutView').classList.add('hidden');
        cart = [];
        appliedCoupon = null;
        updateCartUI();
        window.location.reload(); // Hard reset for clean state
    };
}

function prefillForm() {
    if (currentUser) {
        if (document.getElementById('userName')) document.getElementById('userName').value = currentUser.name || '';
        if (document.getElementById('userPhone')) document.getElementById('userPhone').value = currentUser.phone || '';
        if (document.getElementById('userAddress')) document.getElementById('userAddress').value = currentUser.address || '';
        if (document.getElementById('userLandmark')) document.getElementById('userLandmark').value = currentUser.landmark || '';
    }
}

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
            <img src="${(item.images && item.images[0]) || ''}" alt="${item.name}" class="menu-img">
            <div class="menu-info">
                <div class="menu-top"><h3>${item.name}</h3><span class="badge ${item.category}">${item.category}</span></div>
                <p class="menu-desc">${item.desc}</p>
                <div class="menu-action"><span class="price">₹${item.price}</span><button class="add-btn" onclick="event.stopPropagation(); addToCart(${item.id})">Add +</button></div>
            </div>`;
        grid.appendChild(card);
    });
}

window.showProductDetail = (id) => {
    const item = currentMenu.find(i => i.id === id);
    if (!item) return;

    // Multi-Image Gallery
    const gallery = document.getElementById('detailGallery');
    gallery.innerHTML = (item.images || []).map(img => `<img src="${img}" alt="${item.name}">`).join('');

    document.getElementById('detailName').innerText = item.name;
    document.getElementById('detailDesc').innerText = item.desc;
    document.getElementById('detailPrice').innerText = `₹${item.price}`;
    document.getElementById('detailRating').innerHTML = `<i class="fa-solid fa-star"></i> ${item.rating || '4.5'} (${(item.reviews || []).length} Reviews)`;

    const badge = document.getElementById('detailBadge');
    badge.innerText = item.category;
    badge.className = `badge ${item.category}`;

    const reviewsList = document.getElementById('detailReviewsList');
    reviewsList.innerHTML = (item.reviews || []).map(r => `
        <div class="review-item">
            <span class="review-user">${r.user}</span>
            <span class="review-text">${r.comment}</span>
        </div>
    `).join('') || '<p style="color: #999; font-size: 0.8rem;">No reviews yet.</p>';

    document.getElementById('detailAddBtn').onclick = () => { addToCart(item.id); hideProductDetail(); };
    document.getElementById('productDetailModal').classList.remove('hidden');
};

window.hideProductDetail = () => document.getElementById('productDetailModal').classList.add('hidden');

window.addToCart = (id) => {
    const item = currentMenu.find(i => i.id === id);
    if (!item) return;
    const existing = cart.find(i => i.id === id);
    if (existing) { existing.quantity++; } else { cart.push({ ...item, quantity: 1 }); }
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
    const total = subtotal - (appliedCoupon ? Math.floor(subtotal * (appliedCoupon.discount / 100)) : 0);

    const fab = document.getElementById('cartFab');
    if (fab) {
        if (count > 0) { fab.classList.remove('hidden'); document.getElementById('fabCount').innerText = count; document.getElementById('fabTotal').innerText = `₹${total}`; }
        else { fab.classList.add('hidden'); }
    }

    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info"><h4>${item.name}</h4><p>₹${item.price}</p></div>
                <div class="qty-controls"><button onclick="updateQty(${item.id}, -1)">-</button><span>${item.quantity}</span><button onclick="updateQty(${item.id}, 1)">+</button></div>
            </div>`).join('');
    }
    if (document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = `₹${total}`;
}

window.applyCoupon = () => {
    const code = document.getElementById('couponInput').value.toUpperCase();
    const found = safeParse('dpizza_coupons').find(c => c.code === code && c.active);
    const msg = document.getElementById('couponMsg');
    if (found) { appliedCoupon = found; msg.innerText = `Applied! ${found.discount}% off`; msg.style.color = "green"; updateCartUI(); }
    else { appliedCoupon = null; msg.innerText = "Invalid"; msg.style.color = "red"; updateCartUI(); }
};

async function handleOrderSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const orderId = 'ORD' + Math.floor(Math.random() * 1000000);
    const orderData = {
        id: orderId, name: formData.get('name'), phone: formData.get('phone'),
        address: formData.get('address'), landmark: formData.get('landmark'),
        payment: formData.get('payment'), items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending', timestamp: new Date().toISOString()
    };
    localStorage.setItem('dpizza_profile', JSON.stringify({ name: orderData.name, phone: orderData.phone, address: orderData.address, landmark: orderData.landmark }));
    let history = safeParse('dpizza_history'); history.push(orderData);
    localStorage.setItem('dpizza_history', JSON.stringify(history));
    localStorage.setItem('last_order_id', orderId);

    document.getElementById('successOrderId').innerText = `#${orderId}`;
    document.getElementById('checkoutView').classList.add('hidden');
    document.getElementById('successView').classList.remove('hidden');
    checkProfile();
    checkForActiveOrder();
}

function checkForActiveOrder() {
    const lastId = localStorage.getItem('last_order_id');
    const history = safeParse('dpizza_history');
    const order = history.find(o => o.id === lastId);
    if (order && order.status !== 'delivered') {
        document.getElementById('quickTrack').classList.remove('hidden');
    } else {
        document.getElementById('quickTrack').classList.add('hidden');
    }
}

window.trackOrder = (orderId) => {
    if (orderId === 'current') orderId = localStorage.getItem('last_order_id');
    const order = safeParse('dpizza_history').find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('trackOrderId').innerText = `#${order.id}`;
    document.getElementById('trackStatusBadge').innerText = order.status;
    document.getElementById('trackStatusBadge').className = `status-badge status-${order.status}`;

    const stepMap = { pending: 1, preparing: 2, dispatched: 3, delivered: 4 };
    const current = stepMap[order.status] || 1;
    document.querySelectorAll('.step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < current) el.classList.add('completed');
        if (i + 1 === current) el.classList.add('active');
    });

    document.getElementById('trackItemsList').innerHTML = order.items.map(i => `<div class="track-item-row"><span>${i.name} x${i.quantity}</span><span>₹${i.price * i.quantity}</span></div>`).join('');
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    document.getElementById('trackingView').classList.remove('hidden');
};

window.hideTracking = () => document.getElementById('trackingView').classList.add('hidden');

function checkProfile() { if (currentUser) document.getElementById('profileBtn').classList.remove('hidden'); }

function showProfile() {
    document.getElementById('profName').innerText = currentUser.name;
    document.getElementById('profPhone').innerText = currentUser.phone;
    document.getElementById('profAddress').innerText = currentUser.address;
    document.getElementById('orderHistory').innerHTML = safeParse('dpizza_history').reverse().map(o => `
        <div class="history-card" style="background:white; padding:10px; border-radius:10px; margin-bottom:10px;">
            <b>${o.id} - ₹${o.total}</b><br>Status: ${o.status}<br>
            <button onclick="trackOrder('${o.id}')">Track</button>
        </div>`).join('') || 'No orders.';
    document.getElementById('profileView').classList.remove('hidden');
}
