// Pharmacist Portal Controller

document.addEventListener('DOMContentLoaded', () => {
  if (!AuthManager.requireRole(UserRoles.PHARMACIST)) {
    return;
  }

  initializePharmacistPortal();
  loadDashboardSection();
});

function initializePharmacistPortal() {
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
    dashboard: 'Pharmacist Dashboard',
    prescriptions: 'Prescription Management',
    inventory: 'Medicine Inventory',
    orders: 'Purchase Orders'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  switch(sectionName) {
    case 'dashboard':
      loadDashboardSection();
      break;
    case 'prescriptions':
      loadPrescriptionsSection();
      break;
    case 'inventory':
      loadInventorySection();
      break;
    case 'orders':
      loadOrdersSection();
      break;
  }
}

function loadDashboardSection() {
  const records = DataManager.getMedicalRecords();
  const prescriptionsWithMeds = records.filter(r => r.prescription && r.prescription !== 'None');

  document.getElementById('pending-count').innerText = prescriptionsWithMeds.length;
  document.getElementById('dispensed-count').innerText = Math.floor(prescriptionsWithMeds.length * 0.6);
  document.getElementById('low-stock-count').innerText = '2';

  const tbody = document.getElementById('pending-prescriptions');
  if (prescriptionsWithMeds.length > 0) {
    tbody.innerHTML = prescriptionsWithMeds.slice(0, 5).map(record => `
      <tr>
        <td>${formatDate(record.date)}</td>
        <td>${record.patientName}</td>
        <td>${record.doctorName}</td>
        <td>${record.prescription}</td>
        <td>As prescribed</td>
        <td>
          <button class="btn-small" onclick="dispensePrescription('${record.id}')">Dispense</button>
          <button class="btn-small" onclick="viewPrescriptionDetails('${record.id}')">View</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No pending prescriptions</td></tr>';
  }
}

function loadPrescriptionsSection() {
  const records = DataManager.getMedicalRecords();
  const prescriptions = records.filter(r => r.prescription && r.prescription !== 'None');

  const tbody = document.getElementById('prescriptions-table');
  tbody.innerHTML = prescriptions.map(record => `
    <tr>
      <td>${formatDate(record.date)}</td>
      <td>${record.patientName}</td>
      <td>${record.doctorName}</td>
      <td>${record.prescription}</td>
      <td>1</td>
      <td><span class="status confirmed">Active</span></td>
      <td>
        <button class="btn-small" onclick="dispensePrescription('${record.id}')">Dispense</button>
        <button class="btn-small" onclick="viewPrescriptionDetails('${record.id}')">View</button>
      </td>
    </tr>
  `).join('');

  if (prescriptions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No prescriptions</td></tr>';
  }
}

function loadInventorySection() {
  const inventory = [
    { id: 'inv_001', name: 'Aspirin 500mg', quantity: 150, unit: 'tablets', expiry: '2026-12-31', price: 5.99, reorderLevel: 50, status: 'Good Stock' },
    { id: 'inv_002', name: 'Ibuprofen 200mg', quantity: 30, unit: 'tablets', expiry: '2026-06-30', price: 4.99, reorderLevel: 100, status: 'Low Stock' },
    { id: 'inv_003', name: 'Amoxicillin 500mg', quantity: 200, unit: 'capsules', expiry: '2026-09-15', price: 8.99, reorderLevel: 100, status: 'Good Stock' },
    { id: 'inv_004', name: 'Lisinopril 10mg', quantity: 45, unit: 'tablets', expiry: '2027-01-20', price: 12.99, reorderLevel: 50, status: 'Low Stock' }
  ];

  const tbody = document.getElementById('inventory-table');
  tbody.innerHTML = inventory.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${formatDate(item.expiry)}</td>
      <td>$${item.price}</td>
      <td>${item.reorderLevel}</td>
      <td><span class="status ${item.status === 'Good Stock' ? 'confirmed' : 'pending'}">${item.status}</span></td>
    </tr>
  `).join('');
}

function loadOrdersSection() {
  const orders = [
    { id: 'ord_001', date: '2025-09-01', supplier: 'MediPharm Supplies', items: 15, amount: 2500, status: 'delivered' },
    { id: 'ord_002', date: '2025-09-05', supplier: 'Global Pharma', items: 20, amount: 3500, status: 'delivered' },
    { id: 'ord_003', date: '2025-09-12', supplier: 'MediPharm Supplies', items: 10, amount: 1800, status: 'pending' }
  ];

  const tbody = document.getElementById('orders-table');
  tbody.innerHTML = orders.map(order => `
    <tr>
      <td>${order.id}</td>
      <td>${formatDate(order.date)}</td>
      <td>${order.supplier}</td>
      <td>${order.items}</td>
      <td>$${order.amount}</td>
      <td><span class="status ${order.status === 'delivered' ? 'confirmed' : 'pending'}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
      <td>
        <button class="btn-small" onclick="viewOrder('${order.id}')">View</button>
      </td>
    </tr>
  `).join('');
}

function dispensePrescription(recordId) {
  const record = DataManager.getMedicalRecords().find(r => r.id === recordId);
  if (record && confirm(`Dispense prescription for ${record.patientName}?`)) {
    alert(`Prescription dispensed successfully`);
  }
}

function viewPrescriptionDetails(recordId) {
  const record = DataManager.getMedicalRecords().find(r => r.id === recordId);
  if (record) {
    alert(`Prescription Details\nPatient: ${record.patientName}\nDoctor: ${record.doctorName}\nMedication: ${record.prescription}\nNotes: ${record.notes}`);
  }
}

function addMedicine() {
  alert('Add medicine form - To be implemented');
}

function createOrder() {
  alert('Create purchase order form - To be implemented');
}

function viewOrder(orderId) {
  alert(`View order ${orderId} details - To be implemented`);
}

function logoutUser() {
  AuthManager.logout();
}
