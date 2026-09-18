// Inventory Manager Portal Controller

document.addEventListener('DOMContentLoaded', () => {
  if (!AuthManager.requireRole(UserRoles.INVENTORY_MANAGER)) {
    return;
  }

  initializeInventoryPortal();
  loadDashboardSection();
});

function initializeInventoryPortal() {
  const user = AuthManager.getCurrentUser();
  if (user) {
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-avatar').innerText = user.name.substring(0, 2).toUpperCase();
  }
}

function loadSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });

  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.nav-item')?.classList.add('active');

  const titles = {
    dashboard: 'Inventory Dashboard',
    inventory: 'Complete Inventory',
    orders: 'Purchase Orders',
    suppliers: 'Supplier Management',
    reports: 'Inventory Reports'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  switch(sectionName) {
    case 'dashboard':
      loadDashboardSection();
      break;
    case 'inventory':
      loadInventorySection();
      break;
    case 'orders':
      loadOrdersSection();
      break;
    case 'suppliers':
      loadSuppliersSection();
      break;
    case 'reports':
      loadReportsSection();
      break;
  }
}

function loadDashboardSection() {
  const inventory = getInventoryData();
  const orders = getOrdersData();

  document.getElementById('total-items').innerText = inventory.length;
  document.getElementById('low-stock').innerText = inventory.filter(i => i.quantity < i.reorderLevel).length;
  document.getElementById('pending-orders').innerText = orders.filter(o => o.status === 'pending').length;
  
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  document.getElementById('inventory-value').innerText = '$' + totalValue.toLocaleString();

  // Critical stock items
  const criticalItems = inventory.filter(i => i.quantity < i.reorderLevel);
  const tbody = document.getElementById('critical-items');

  if (criticalItems.length > 0) {
    tbody.innerHTML = criticalItems.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.reorderLevel}</td>
        <td><span class="status pending">Low Stock</span></td>
        <td>
          <button class="btn-small" onclick="createOrderForItem('${item.id}')">Reorder</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">All stock levels are adequate</td></tr>';
  }
}

function loadInventorySection() {
  const inventory = getInventoryData();
  const tbody = document.getElementById('inventory-table');

  tbody.innerHTML = inventory.map(item => `
    <tr>
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>$${item.unitCost}</td>
      <td>$${(item.quantity * item.unitCost).toFixed(2)}</td>
      <td>${item.reorderLevel}</td>
      <td>${formatDate(item.lastUpdated)}</td>
      <td>
        <button class="btn-small" onclick="editInventoryItem('${item.id}')">Edit</button>
        <button class="btn-small danger" onclick="deleteInventoryItem('${item.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function loadOrdersSection() {
  const orders = getOrdersData();
  const tbody = document.getElementById('orders-table');

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${formatDate(order.date)}</td>
      <td>${order.supplier}</td>
      <td>${order.items}</td>
      <td>$${order.totalAmount}</td>
      <td><span class="status ${order.status === 'delivered' ? 'confirmed' : 'pending'}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
      <td>${formatDate(order.expectedDelivery)}</td>
      <td>
        <button class="btn-small" onclick="viewOrder('${order.id}')">View</button>
        ${order.status === 'pending' ? `<button class="btn-small" onclick="updateOrderStatus('${order.id}')">Update</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function loadSuppliersSection() {
  const suppliers = getSuppliersData();
  const tbody = document.getElementById('suppliers-table');

  tbody.innerHTML = suppliers.map(supplier => `
    <tr>
      <td>${supplier.name}</td>
      <td>${supplier.contactPerson}</td>
      <td>${supplier.email}</td>
      <td>${supplier.phone}</td>
      <td>${supplier.address}</td>
      <td><span class="status confirmed">Active</span></td>
      <td>
        <button class="btn-small" onclick="editSupplier('${supplier.id}')">Edit</button>
        <button class="btn-small danger" onclick="deleteSupplier('${supplier.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function loadReportsSection() {
  // Reports section has static content - no data loading needed
}

// Data retrieval functions
function getInventoryData() {
  return [
    { id: 'inv_001', name: 'Surgical Gloves (Box)', category: 'PPE', quantity: 150, unitCost: 15, reorderLevel: 200, lastUpdated: '2025-09-12' },
    { id: 'inv_002', name: 'Syringes 10ml', category: 'Medical Supplies', quantity: 45, unitCost: 2.50, reorderLevel: 100, lastUpdated: '2025-09-11' },
    { id: 'inv_003', name: 'IV Fluids (Saline)', category: 'Fluids', quantity: 300, unitCost: 8, reorderLevel: 150, lastUpdated: '2025-09-13' },
    { id: 'inv_004', name: 'Bandages (Roll)', category: 'Medical Supplies', quantity: 500, unitCost: 3, reorderLevel: 200, lastUpdated: '2025-09-10' },
    { id: 'inv_005', name: 'Oxygen Tanks', category: 'Equipment', quantity: 25, unitCost: 150, reorderLevel: 20, lastUpdated: '2025-09-12' }
  ];
}

function getOrdersData() {
  return [
    { id: 'ord_001', date: '2025-09-01', supplier: 'MediSupply Co.', items: 10, totalAmount: 2500, status: 'delivered', expectedDelivery: '2025-09-05' },
    { id: 'ord_002', date: '2025-09-05', supplier: 'Global Medical', items: 15, totalAmount: 3800, status: 'delivered', expectedDelivery: '2025-09-10' },
    { id: 'ord_003', date: '2025-09-10', supplier: 'MediSupply Co.', items: 20, totalAmount: 5500, status: 'pending', expectedDelivery: '2025-09-15' }
  ];
}

function getSuppliersData() {
  return [
    { id: 'sup_001', name: 'MediSupply Co.', contactPerson: 'John Anderson', email: 'john@medisupply.com', phone: '+1-555-0301', address: '123 Industrial Ave' },
    { id: 'sup_002', name: 'Global Medical', contactPerson: 'Sarah Chen', email: 'sarah@globalmedical.com', phone: '+1-555-0302', address: '456 Commerce St' },
    { id: 'sup_003', name: 'PharmaCare Supplies', contactPerson: 'Mike Johnson', email: 'mike@pharmacare.com', phone: '+1-555-0303', address: '789 Medical Dr' }
  ];
}

// Action functions
function addInventoryItem() {
  alert('Add inventory item form - To be implemented');
}

function editInventoryItem(itemId) {
  alert(`Edit inventory item ${itemId} - To be implemented`);
}

function deleteInventoryItem(itemId) {
  if (confirm('Are you sure you want to delete this item?')) {
    alert('Item deleted - To be implemented');
  }
}

function createNewOrder() {
  alert('Create new purchase order form - To be implemented');
}

function createOrderForItem(itemId) {
  alert(`Create order for item ${itemId} - To be implemented`);
}

function viewOrder(orderId) {
  const orders = getOrdersData();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    alert(`Order: ${order.id}\nSupplier: ${order.supplier}\nDate: ${formatDate(order.date)}\nItems: ${order.items}\nAmount: $${order.totalAmount}\nStatus: ${order.status}`);
  }
}

function updateOrderStatus(orderId) {
  alert(`Update order ${orderId} status - To be implemented`);
}

function addSupplier() {
  alert('Add new supplier form - To be implemented');
}

function editSupplier(supplierId) {
  alert(`Edit supplier ${supplierId} - To be implemented`);
}

function deleteSupplier(supplierId) {
  if (confirm('Are you sure you want to delete this supplier?')) {
    alert('Supplier deleted - To be implemented');
  }
}

function generateReport() {
  alert('Report generation dialog - To be implemented');
}

function downloadReport(reportType) {
  const reportNames = {
    stock: 'Stock Summary Report',
    usage: 'Item Usage Report',
    orders: 'Order History Report',
    value: 'Inventory Value Report',
    expiry: 'Expiry Tracking Report'
  };

  const report = reportNames[reportType] || 'Report';
  alert(`Downloading ${report}...`);
}

function logoutUser() {
  AuthManager.logout();
}
