// --- DEFAULT DATA ---
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

function initApp() {
    console.log("Initializing Admin App...");
    initMenu();
    loadDashboard();
    setupAdminNav();
    setupProductForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

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
        if (!btn) {
            console.warn(`Nav button ${btnId} not found`);
            return;
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`Switching to section: ${sectionId}`);

            // Update Active Nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            btn.classList.add('active');

            // Show Section
            Object.values(navItems).forEach(s => {
                const sec = document.getElementById(s);
                if (sec) sec.classList.add('hidden');
            });

            const targetSec = document.getElementById(sectionId);
            if (targetSec) targetSec.classList.remove('hidden');

            // Specific Loaders
            if (sectionId === 'menuSection') loadMenu();
            if (sectionId === 'customersSection') loadCustomers();
            if (sectionId === 'couponsSection') loadCoupons();
            if (sectionId === 'ordersSection') loadDashboard();
        });
    });
}

// --- ORDER MANAGEMENT ---
function loadDashboard() {
    const history = safeParse('dpizza_history');
    const totalOrdersEl = document.getElementById('totalOrders');
    const totalSalesEl = document.getElementById('totalSales');
    const totalCustomersEl = document.getElementById('totalCustomers');

    if (totalOrdersEl) totalOrdersEl.innerText = history.length;
    if (totalSalesEl) totalSalesEl.innerText = `₹${history.reduce((sum, o) => sum + (o.total || 0), 0)}`;
    if (totalCustomersEl) totalCustomersEl.innerText = new Set(history.map(o => o.phone)).size;

    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    [...history].reverse().forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td><strong>${order.name}</strong><br><small>${order.phone}</small></td>
            <td>${(order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}</td>
            <td>₹${order.total}</td>
            <td><span class="status-badge status-${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            <td>
                <select onchange="updateStatus('${order.id}', this.value)" style="padding: 4px; border-radius: 4px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="dispatched" ${order.status === 'dispatched' ? 'selected' : ''}>Dispatched</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
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

window.clearOrders = () => {
    if (confirm('Are you sure you want to clear all orders?')) {
        localStorage.removeItem('dpizza_history');
        loadDashboard();
    }
};

// --- MENU MANAGEMENT ---
function loadMenu() {
    const menu = safeParse('dpizza_menu', DEFAULT_MENU);
    const tbody = document.getElementById('menuTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    menu.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
            <td>${item.name}</td>
            <td><span class="badge ${item.category}">${item.category}</span></td>
            <td>₹${item.price}</td>
            <td>
                <button onclick="editProduct(${item.id})" class="icon-btn" style="font-size: 1rem;"><i class="fa-solid fa-edit"></i></button>
                <button onclick="deleteProduct(${item.id})" class="icon-btn" style="font-size: 1rem; color: red;"><i class="fa-solid fa-trash"></i></button>
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
        const image = document.getElementById('itemImage').value || 'https://via.placeholder.com/500x350?text=Pizza';
        const desc = document.getElementById('itemDesc').value;

        const newItem = {
            id: editId ? parseInt(editId) : Date.now(),
            name, category, price, image, desc
        };

        if (editId) {
            const index = menu.findIndex(i => i.id === parseInt(editId));
            if (index !== -1) menu[index] = newItem;
        } else {
            menu.push(newItem);
        }

        localStorage.setItem('dpizza_menu', JSON.stringify(menu));
        hideProductModal();
        loadMenu();
        alert("Product saved successfully!");
    });

    const fileInput = document.getElementById('itemFile');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    document.getElementById('itemImage').value = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

window.showProductForm = () => {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    document.getElementById('modalTitle').innerText = 'Add Product';
    document.getElementById('editProductId').value = '';
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('hidden');
};

window.hideProductModal = () => {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('hidden');
};

window.editProduct = (id) => {
    const menu = safeParse('dpizza_menu', DEFAULT_MENU);
    const item = menu.find(i => i.id === id);
    if (item) {
        document.getElementById('modalTitle').innerText = 'Edit Product';
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemImage').value = item.image;
        document.getElementById('itemDesc').value = item.desc;
        document.getElementById('editProductId').value = item.id;
        const modal = document.getElementById('productModal');
        if (modal) modal.classList.remove('hidden');
    }
};

window.deleteProduct = (id) => {
    if (confirm('Delete this item?')) {
        let menu = safeParse('dpizza_menu', DEFAULT_MENU);
        menu = menu.filter(i => i.id !== id);
        localStorage.setItem('dpizza_menu', JSON.stringify(menu));
        loadMenu();
    }
};

// --- COUPON MANAGEMENT ---
function loadCoupons() {
    const coupons = safeParse('dpizza_coupons');
    const tbody = document.getElementById('couponsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    coupons.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.code}</strong></td>
            <td>${c.discount}%</td>
            <td><span class="badge ${c.active ? 'veg' : 'non-veg'}">${c.active ? 'Active' : 'Hidden'}</span></td>
            <td>
                <button onclick="deleteCoupon('${c.code}')" class="icon-btn" style="color: red;"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.showCouponForm = () => {
    const code = prompt('Enter Coupon Code (e.g. PIZZA50):');
    const discount = prompt('Enter Discount Percentage (e.g. 10):');
    if (code && discount) {
        let coupons = safeParse('dpizza_coupons');
        coupons.push({ code: code.toUpperCase(), discount: parseInt(discount), active: true });
        localStorage.setItem('dpizza_coupons', JSON.stringify(coupons));
        loadCoupons();
    }
};

window.deleteCoupon = (code) => {
    if (confirm(`Delete coupon ${code}?`)) {
        let coupons = safeParse('dpizza_coupons');
        coupons = coupons.filter(c => c.code !== code);
        localStorage.setItem('dpizza_coupons', JSON.stringify(coupons));
        loadCoupons();
    }
};

// --- CUSTOMERS ---
function loadCustomers() {
    const history = safeParse('dpizza_history');
    const customersMap = {};
    history.forEach(order => {
        if (!order.phone) return;
        if (!customersMap[order.phone]) {
            customersMap[order.phone] = { name: order.name, phone: order.phone, lastAddress: order.address, count: 0, ltv: 0 };
        }
        customersMap[order.phone].count++;
        customersMap[order.phone].ltv += (order.total || 0);
    });

    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    Object.values(customersMap).forEach(cust => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${cust.name}</td><td>${cust.phone}</td><td title="${cust.lastAddress}">${cust.lastAddress}</td><td>${cust.count}</td><td>₹${cust.ltv}</td>`;
        tbody.appendChild(tr);
    });
}
