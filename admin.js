// --- ADMIN LOGIC ---
let uploadedImages = []; // Temp storage for Base64 strings during form edit/add

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

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    setupAdminNav();
    loadDashboard();
    setupProductForm();
    setupImageUpload();
});

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
    document.getElementById('totalOrders').innerText = history.length;
    document.getElementById('totalSales').innerText = `₹${history.reduce((sum, o) => sum + (o.total || 0), 0)}`;
    document.getElementById('totalCustomers').innerText = new Set(history.map(o => o.phone)).size;

    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    tbody.innerHTML = history.reverse().map(order => `
        <tr>
            <td>#${order.id}</td>
            <td><strong>${order.name}</strong><br><small>${order.phone}</small></td>
            <td>${(order.items || []).map(i => i.name).join(', ')}</td>
            <td>₹${order.total}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>
                <select onchange="updateStatus('${order.id}', this.value)" style="border-radius:8px; padding:5px;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="dispatched" ${order.status === 'dispatched' ? 'selected' : ''}>Dispatched</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
        </tr>
    `).join('');
}

window.updateStatus = (id, status) => {
    let history = safeParse('dpizza_history');
    const idx = history.findIndex(o => o.id === id);
    if (idx !== -1) {
        history[idx].status = status;
        localStorage.setItem('dpizza_history', JSON.stringify(history));
        loadDashboard();
    }
};

function loadMenu() {
    const menu = safeParse('dpizza_menu', DEFAULT_MENU);
    const tbody = document.getElementById('menuTableBody');
    if (!tbody) return;
    tbody.innerHTML = menu.map(item => `
        <tr>
            <td><img src="${(item.images && item.images[0]) || ''}" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;"></td>
            <td>${item.name}</td>
            <td><span class="badge ${item.category}">${item.category}</span></td>
            <td>₹${item.price}</td>
            <td>⭐ ${item.rating || '4.5'}</td>
            <td>
                <button onclick="editProduct(${item.id})" class="icon-btn"><i class="fa-solid fa-edit"></i></button>
                <button onclick="deleteProduct(${item.id})" class="icon-btn" style="color:red;"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function setupImageUpload() {
    const fileInput = document.getElementById('itemFiles');
    const preview = document.getElementById('imagePreview');

    if (!fileInput || !preview) return;

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        // Reset previews for new selection or append? Let's reset for clarity.
        preview.innerHTML = '';
        uploadedImages = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                uploadedImages.push(base64);

                const img = document.createElement('img');
                img.src = base64;
                img.style = 'width: 60px; height: 60px; object-fit: cover; border-radius: 10px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    });
}

function renderPreviews(imageUrls) {
    const preview = document.getElementById('imagePreview');
    if (!preview) return;
    preview.innerHTML = '';
    uploadedImages = [...imageUrls];

    if (uploadedImages.length === 0) {
        preview.innerHTML = '<span style="color: #a3b1cc; font-size: 0.8rem; margin: auto;">No images uploaded</span>';
        return;
    }

    uploadedImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style = 'width: 60px; height: 60px; object-fit: cover; border-radius: 10px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);';
        preview.appendChild(img);
    });
}

function setupProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const menu = safeParse('dpizza_menu', DEFAULT_MENU);
        const editId = document.getElementById('editProductId').value;

        if (uploadedImages.length === 0) {
            alert("Please upload at least one image catalog.");
            return;
        }

        const newItem = {
            id: editId ? parseInt(editId) : Date.now(),
            name: document.getElementById('itemName').value,
            category: document.getElementById('itemCategory').value,
            price: parseInt(document.getElementById('itemPrice').value),
            rating: parseFloat(document.getElementById('itemRating').value),
            images: uploadedImages,
            desc: document.getElementById('itemDesc').value,
            reviews: JSON.parse(document.getElementById('itemReviews').value || '[]')
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
    };
}

window.showProductForm = () => {
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('modalTitle').innerText = 'Add New Pizza';
    uploadedImages = [];
    renderPreviews([]);
    document.getElementById('productModal').classList.remove('hidden');
};

window.hideProductModal = () => document.getElementById('productModal').classList.add('hidden');

window.editProduct = (id) => {
    const item = safeParse('dpizza_menu').find(i => i.id === id);
    if (!item) return;

    document.getElementById('editProductId').value = item.id;
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemRating').value = item.rating || 4.5;

    document.getElementById('itemDesc').value = item.desc;
    document.getElementById('itemReviews').value = JSON.stringify(item.reviews || []);

    // Set previews
    renderPreviews(item.images || []);

    document.getElementById('modalTitle').innerText = 'Edit Pizza';
    document.getElementById('productModal').classList.remove('hidden');
};

window.deleteProduct = (id) => {
    if (confirm("Delete this item?")) {
        let menu = safeParse('dpizza_menu').filter(i => i.id !== id);
        localStorage.setItem('dpizza_menu', JSON.stringify(menu));
        loadMenu();
    }
};

window.clearOrders = () => { if (confirm("Clear all order history?")) { localStorage.removeItem('dpizza_history'); loadDashboard(); } };

// Coupons & Customers helper
function loadCoupons() {
    const c = safeParse('dpizza_coupons');
    document.getElementById('couponsTableBody').innerHTML = c.map(x => `
        <tr><td>${x.code}</td><td>${x.discount}%</td><td><button onclick="deleteCoupon('${x.code}')">Delete</button></td></tr>
    `).join('');
}
window.showCouponForm = () => {
    const code = prompt("Coupon Code:");
    const disc = prompt("Discount %:");
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
    const h = safeParse('dpizza_history');
    const map = {};
    h.forEach(o => { if (!map[o.phone]) map[o.phone] = { n: o.name, o: 0, s: 0, a: o.address }; map[o.phone].o++; map[o.phone].s += o.total; });
    document.getElementById('customersTableBody').innerHTML = Object.entries(map).map(([ph, d]) => `
        <tr><td>${d.n}</td><td>${ph}</td><td>${d.a}</td><td>${d.o}</td><td>₹${d.s}</td></tr>
    `).join('');
}
