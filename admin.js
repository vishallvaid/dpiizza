// --- DEFAULT DATA ---
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

function initApp() {
    initMenu();
    loadDashboard();
    setupAdminNav();
    setupProductForm();
}

document.addEventListener('DOMContentLoaded', initApp);

function initMenu() {
    if (!localStorage.getItem('dpizza_menu')) {
        localStorage.setItem('dpizza_menu', JSON.stringify(DEFAULT_MENU));
    }
}

function setupAdminNav() {
    const navItems = {
        'btnOrders': 'ordersSection',
        'btnMenu': 'menuSection',
        'btnCoupons': 'couponsSection',
        'btnCustomers': 'customersSection'
    };

    Object.entries(navItems).forEach(([btnId, sectionId]) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            btn.classList.add('active');
            Object.values(navItems).forEach(s => document.getElementById(s).classList.add('hidden'));
            document.getElementById(sectionId).classList.remove('hidden');
            if (sectionId === 'menuSection') loadMenu();
            if (sectionId === 'customersSection') loadCustomers();
            if (sectionId === 'couponsSection') loadCoupons();
            if (sectionId === 'ordersSection') loadDashboard();
        });
    });
}

function loadDashboard() {
    const history = safeParse('dpizza_history');
    if (document.getElementById('totalOrders')) document.getElementById('totalOrders').innerText = history.length;
    if (document.getElementById('totalSales')) document.getElementById('totalSales').innerText = `₹${history.reduce((sum, o) => sum + (o.total || 0), 0)}`;
    if (document.getElementById('totalCustomers')) document.getElementById('totalCustomers').innerText = new Set(history.map(o => o.phone)).size;

    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    [...history].reverse().forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td><strong>${order.name}</strong></td>
            <td>${(order.items || []).map(i => i.name).join(', ')}</td>
            <td>₹${order.total}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            <td>
                <select onchange="updateStatus('${order.id}', this.value)" style="padding: 4px; border-radius: 4px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="dispatched" ${order.status === 'dispatched' ? 'selected' : ''}>Dispatched</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.updateStatus = (orderId, newStatus) => {
    let history = safeParse('dpizza_history');
    const index = history.findIndex(o => o.id === orderId);
    if (index !== -1) {
        history[index].status = newStatus;
        localStorage.setItem('dpizza_history', JSON.stringify(history));
        loadDashboard();
    }
};

function loadMenu() {
    const menu = safeParse('dpizza_menu', DEFAULT_MENU);
    const tbody = document.getElementById('menuTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    menu.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${(item.images && item.images[0]) || ''}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px;"></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>₹${item.price}</td>
            <td>
                <button onclick="editProduct(${item.id})"><i class="fa-solid fa-edit"></i></button>
                <button onclick="deleteProduct(${item.id})" style="color: red;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const menu = safeParse('dpizza_menu', DEFAULT_MENU);
        const editId = document.getElementById('editProductId').value;
        const name = document.getElementById('itemName').value;
        const price = parseInt(document.getElementById('itemPrice').value);
        const category = document.getElementById('itemCategory').value;
        const rating = parseFloat(document.getElementById('itemRating').value);
        const imagesRaw = document.getElementById('itemImages').value;
        const images = imagesRaw.split('\n').filter(l => l.trim() !== '');
        const desc = document.getElementById('itemDesc').value;
        let reviews = [];
        try { reviews = JSON.parse(document.getElementById('itemReviews').value || '[]'); } catch (e) { reviews = []; }

        const newItem = { id: editId ? parseInt(editId) : Date.now(), name, category, price, rating, images, desc, reviews };

        if (editId) {
            const index = menu.findIndex(i => i.id === parseInt(editId));
            if (index !== -1) menu[index] = newItem;
        } else { menu.push(newItem); }

        localStorage.setItem('dpizza_menu', JSON.stringify(menu));
        hideProductModal();
        loadMenu();
        alert("Item saved!");
    });
}

window.showProductForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('modalTitle').innerText = 'Add Item';
    document.getElementById('editProductId').value = '';
    document.getElementById('productModal').classList.remove('hidden');
};

window.hideProductModal = () => document.getElementById('productModal').classList.add('hidden');

window.editProduct = (id) => {
    const menu = safeParse('dpizza_menu', DEFAULT_MENU);
    const item = menu.find(i => i.id === id);
    if (!item) return;

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemRating').value = item.rating || 4.5;
    document.getElementById('itemImages').value = (item.images || []).join('\n');
    document.getElementById('itemDesc').value = item.desc;
    document.getElementById('itemReviews').value = JSON.stringify(item.reviews || []);
    document.getElementById('editProductId').value = item.id;
    document.getElementById('modalTitle').innerText = 'Edit Item';
    document.getElementById('productModal').classList.remove('hidden');
};

window.deleteProduct = (id) => {
    if (confirm('Delete?')) {
        let menu = safeParse('dpizza_menu').filter(i => i.id !== id);
        localStorage.setItem('dpizza_menu', JSON.stringify(menu));
        loadMenu();
    }
};

function loadCoupons() {
    const coupons = safeParse('dpizza_coupons');
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    coupons.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c.code}</td><td>${c.discount}%</td><td>${c.active ? 'Active' : 'N/A'}</td><td><button onclick="deleteCoupon('${c.code}')">Delete</button></td>`;
        tbody.appendChild(tr);
    });
}
window.showCouponForm = () => {
    const code = prompt('Code:');
    const disc = prompt('%:');
    if (code && disc) {
        let c = safeParse('dpizza_coupons');
        c.push({ code: code.toUpperCase(), discount: parseInt(disc), active: true });
        localStorage.setItem('dpizza_coupons', JSON.stringify(c));
        loadCoupons();
    }
};
window.deleteCoupon = (code) => {
    let c = safeParse('dpizza_coupons').filter(x => x.code !== code);
    localStorage.setItem('dpizza_coupons', JSON.stringify(c));
    loadCoupons();
};
function loadCustomers() {
    const history = safeParse('dpizza_history');
    const map = {};
    history.forEach(o => { if (o.phone) { if (!map[o.phone]) map[o.phone] = { name: o.name, phone: o.phone, city: o.landmark, count: 0, ltv: 0 }; map[o.phone].count++; map[o.phone].ltv += o.total; } });
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    Object.values(map).forEach(c => {
        tbody.innerHTML += `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.city}</td><td>${c.count}</td><td>₹${c.ltv}</td></tr>`;
    });
}
