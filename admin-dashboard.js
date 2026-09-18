// ============================================================
// CarePulse - Admin Dashboard Controller (MySQL Connected)
// ============================================================

let dashboardData = {};

// ------------------------------------------------------------
// BOOT
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verify PHP session
  try {
    const session = await fetch('check_session.php').then(r => r.json());
    if (!session.loggedIn || session.role !== 'Admin') {
      window.location.href = 'login.html';
      return;
    }
    document.getElementById('user-name').innerText   = session.name || 'Admin';
    document.getElementById('user-avatar').innerText = (session.name || 'AD').substring(0, 2).toUpperCase();
  } catch (e) {
    window.location.href = 'login.html';
    return;
  }

  // 2. Initialize UI + load data
  initializeDashboard();
  await fetchDashboardData();
  loadOverviewSection();
});

// ------------------------------------------------------------
// DATA FETCH
// ------------------------------------------------------------
async function fetchDashboardData() {
  try {
    const response = await fetch('get_admin_data.php');
    const data = await response.json();
    if (data.success) {
      dashboardData = data;
    } else {
      console.error('Failed to load database data:', data.error);
      dashboardData = {};
    }
  } catch (error) {
    console.error('Network error fetching dashboard data:', error);
    dashboardData = {};
  }
}

// ------------------------------------------------------------
// NAV / SECTION SWITCHING
// ------------------------------------------------------------
function initializeDashboard() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.style.marginTop) return;
      if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
      e.preventDefault();
    });
  });
}

function loadSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });

  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) targetSection.style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (event && event.target) {
    const nav = event.target.closest('.nav-item');
    if (nav) nav.classList.add('active');
  }

  const titles = {
    overview:     'Dashboard Overview',
    patients:     'Patient Management',
    appointments: 'Appointment Management',
    doctors:      'Doctor Management',
    records:      'Medical Records',
    users:        'User Management',
    queue:        'Queue Management'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  switch (sectionName) {
    case 'overview':     loadOverviewSection();    break;
    case 'patients':     loadPatientsSection();    break;
    case 'doctors':      loadDoctorsSection();     break;
    case 'records':      loadRecordsSection();     break;
    case 'users':        loadUsersSection();       break;
    case 'queue':        loadQueueSection();       break;
  }
}

// ------------------------------------------------------------
// OVERVIEW
// ------------------------------------------------------------
function loadOverviewSection() {
  if (!dashboardData.stats) {
    ['total-patients', 'active-doctors', 'total-records', 'todays-appointments']
      .forEach(id => { const el = document.getElementById(id); if (el) el.innerText = '0'; });
    const tbody = document.getElementById('recent-activities');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No data</td></tr>`;
    return;
  }

  document.getElementById('total-patients').innerText       = dashboardData.stats.totalPatients      ?? 0;
  document.getElementById('active-doctors').innerText        = dashboardData.stats.activeDoctors      ?? 0;
  document.getElementById('total-records').innerText         = dashboardData.stats.totalRecords       ?? 0;
  document.getElementById('todays-appointments').innerText   = dashboardData.stats.todaysAppointments ?? 0;

  const tbody = document.getElementById('recent-activities');
  const activities = dashboardData.activities || [];

  if (activities.length > 0) {
    tbody.innerHTML = activities.map(act => `
      <tr>
        <td>${escapeHtml(act.type || 'N/A')}</td>
        <td>${escapeHtml(act.patientName || 'N/A')}</td>
        <td>${escapeHtml(act.doctorName || 'N/A')}</td>
        <td>${formatDate(act.date)}</td>
        <td><span class="status completed">Completed</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No recent activities</td></tr>`;
  }
}

// ------------------------------------------------------------
// PATIENTS
// ------------------------------------------------------------
function loadPatientsSection() {
  const tbody = document.getElementById('patients-table');
  const patients = dashboardData.patients || [];

  if (patients.length > 0) {
    tbody.innerHTML = patients.map(patient => `
      <tr>
        <td>${escapeHtml(patient.name)}</td>
        <td>${escapeHtml(patient.email)}</td>
        <td>${escapeHtml(patient.phone || 'N/A')}</td>
        <td>${formatDate(patient.registeredDate)}</td>
        <td>${formatDate(patient.lastVisit)}</td>
        <td>
          <button class="btn-small" onclick="editPatient('${patient.id}')">Edit</button>
          <button class="btn-small danger" onclick="deletePatient('${patient.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No patients found in database</td></tr>`;
  }
}

// ------------------------------------------------------------
// DOCTORS
// ------------------------------------------------------------
function loadDoctorsSection() {
  const tbody = document.getElementById('doctors-table');
  const doctors = dashboardData.doctors || [];

  if (doctors.length > 0) {
    tbody.innerHTML = doctors.map(doctor => `
      <tr>
        <td>${escapeHtml(doctor.name)}</td>
        <td>${escapeHtml(doctor.specialization || 'General')}</td>
        <td>${escapeHtml(doctor.licenseNo || 'N/A')}</td>
        <td>${doctor.yearsExperience ?? 0} years</td>
        <td>$${parseFloat(doctor.consultationFee || 0).toFixed(2)}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No doctors found</td></tr>`;
  }
}

// ------------------------------------------------------------
// RECORDS
// ------------------------------------------------------------
function loadRecordsSection() {
  const tbody = document.getElementById('records-table');
  const records = dashboardData.activities || [];

  if (records.length > 0) {
    tbody.innerHTML = records.map(record => `
      <tr>
        <td>${escapeHtml(record.patientName || 'N/A')}</td>
        <td>${escapeHtml(record.doctorName || 'N/A')}</td>
        <td>${formatDate(record.date)}</td>
        <td>${escapeHtml(record.type || 'N/A')}</td>
        <td>General Diagnosis</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No medical records found</td></tr>`;
  }
}

// ------------------------------------------------------------
// USERS
// ------------------------------------------------------------
function loadUsersSection() {
  const tbody = document.getElementById('users-table');
  const users = dashboardData.users || [];

  const roleColors = {
    Admin:            '#e74c3c',
    Physician:        '#3498db',
    Patient:          '#2ecc71',
    Receptionist:     '#f39c12',
    Pharmacist:       '#9b59b6',
    InventoryManager: '#1abc9c'
  };

  if (users.length > 0) {
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>
          <span class="badge" style="background-color:${roleColors[user.role] || '#7f8c8d'};color:white;padding:4px 8px;border-radius:4px;">
            ${escapeHtml(user.role)}
          </span>
        </td>
        <td>
          <button class="btn-small" onclick="editUser('${user.id}')">Edit</button>
          <button class="btn-small danger" onclick="deleteUser('${user.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No users found</td></tr>`;
  }
}

// ------------------------------------------------------------
// QUEUE
// ------------------------------------------------------------
function loadQueueSection() {
  const tbody = document.getElementById('queue-table');
  const queue = dashboardData.queue || [];

  if (queue.length > 0) {
    tbody.innerHTML = queue.map(q => `
      <tr>
        <td>#${q.queue_number ?? 'N/A'}</td>
        <td>${escapeHtml(q.patient_name || 'N/A')}</td>
        <td>${escapeHtml(q.doctor_name || 'N/A')}</td>
        <td>${escapeHtml(q.check_in_time || 'N/A')}</td>
        <td>${escapeHtml(q.wait_time || '0 mins')}</td>
        <td><span class="status ${(q.status || 'waiting').toLowerCase()}">${escapeHtml(q.status || 'Waiting')}</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No patients currently in queue</td></tr>`;
  }
}

// ------------------------------------------------------------
// PATIENT ACTIONS
// ------------------------------------------------------------
function showForm(formType) {
  if (formType === 'add-patient') {
    showAddPatientModal();
  } else if (formType === 'add-user') {
    showAddUserModal();
  } else {
    alert(`Form for ${formType} - To be implemented`);
  }
}

function showAddPatientModal() {
  const modalHtml = `
    <div id="add-patient-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add New Patient</h2>
          <button onclick="closeModal('add-patient-modal')" style="background:none;border:none;cursor:pointer;font-size:24px;">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="new-patient-name" placeholder="Enter full name" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="new-patient-email" placeholder="Enter email" required>
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="new-patient-phone" placeholder="Enter phone number">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-small" style="background-color:#707ebe;" onclick="closeModal('add-patient-modal')">Cancel</button>
          <button class="btn-small" onclick="submitAddPatient()">Add Patient</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitAddPatient() {
  const name = document.getElementById('new-patient-name').value.trim();
  const email = document.getElementById('new-patient-email').value.trim();
  const phone = document.getElementById('new-patient-phone').value.trim();

  if (!name || !email) {
    alert('Name and email are required');
    return;
  }

  fetch('add-patient.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('Patient added successfully!');
      closeModal('add-patient-modal');
      fetchDashboardData().then(() => {
        loadPatientsSection();
        loadOverviewSection();
      });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

function editPatient(patientId) {
  const patient = (dashboardData.patients || []).find(p => p.id == patientId);
  if (!patient) {
    alert('Patient not found');
    return;
  }

  const modalHtml = `
    <div id="edit-patient-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Patient</h2>
          <button onclick="closeModal('edit-patient-modal')" style="background:none;border:none;cursor:pointer;font-size:24px;">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="edit-patient-name" value="${escapeHtml(patient.name)}" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="edit-patient-email" value="${escapeHtml(patient.email)}" required>
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="edit-patient-phone" value="${escapeHtml(patient.phone || '')}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-small" style="background-color:#707ebe;" onclick="closeModal('edit-patient-modal')">Cancel</button>
          <button class="btn-small" onclick="submitEditPatient('${patientId}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitEditPatient(patientId) {
  const name = document.getElementById('edit-patient-name').value.trim();
  const email = document.getElementById('edit-patient-email').value.trim();
  const phone = document.getElementById('edit-patient-phone').value.trim();

  if (!name || !email) {
    alert('Name and email are required');
    return;
  }

  fetch('update-patient.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: patientId, name, email, phone })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('Patient updated successfully!');
      closeModal('edit-patient-modal');
      fetchDashboardData().then(() => {
        loadPatientsSection();
        loadOverviewSection();
      });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

function deletePatient(patientId) {
  if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
    return;
  }

  fetch('delete-patient.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: patientId })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('Patient deleted successfully!');
      fetchDashboardData().then(() => {
        loadPatientsSection();
        loadOverviewSection();
      });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

// ------------------------------------------------------------
// USER ACTIONS
// ------------------------------------------------------------
function showAddUserModal() {
  const modalHtml = `
    <div id="add-user-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add New User</h2>
          <button onclick="closeModal('add-user-modal')" style="background:none;border:none;cursor:pointer;font-size:24px;">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="new-user-name" placeholder="Enter full name" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="new-user-email" placeholder="Enter email" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="new-user-password" placeholder="Default: default123">
          </div>
          <div class="form-group">
            <label>Role *</label>
            <select id="new-user-role" required>
              <option value="">Select role...</option>
              <option value="Admin">Admin</option>
              <option value="Physician">Physician</option>
              <option value="Patient">Patient</option>
              <option value="Receptionist">Receptionist</option>
              <option value="Pharmacist">Pharmacist</option>
              <option value="InventoryManager">Inventory Manager</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-small" style="background-color:#707ebe;" onclick="closeModal('add-user-modal')">Cancel</button>
          <button class="btn-small" onclick="submitAddUser()">Add User</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitAddUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const password = document.getElementById('new-user-password').value.trim() || 'default123';
  const role = document.getElementById('new-user-role').value;

  if (!name || !email || !role) {
    alert('Name, email, and role are required');
    return;
  }

  fetch('add-user.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('User added successfully!');
      closeModal('add-user-modal');
      fetchDashboardData().then(() => {
        loadUsersSection();
        loadOverviewSection();
      });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

function editUser(userId) {
  const user = (dashboardData.users || []).find(u => u.id == userId);
  if (!user) {
    alert('User not found');
    return;
  }

  const modalHtml = `
    <div id="edit-user-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit User</h2>
          <button onclick="closeModal('edit-user-modal')" style="background:none;border:none;cursor:pointer;font-size:24px;">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="edit-user-name" value="${escapeHtml(user.name)}" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="edit-user-email" value="${escapeHtml(user.email)}" required>
          </div>
          <div class="form-group">
            <label>Role *</label>
            <select id="edit-user-role" required>
              <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
              <option value="Physician" ${user.role === 'Physician' ? 'selected' : ''}>Physician</option>
              <option value="Patient" ${user.role === 'Patient' ? 'selected' : ''}>Patient</option>
              <option value="Receptionist" ${user.role === 'Receptionist' ? 'selected' : ''}>Receptionist</option>
              <option value="Pharmacist" ${user.role === 'Pharmacist' ? 'selected' : ''}>Pharmacist</option>
              <option value="InventoryManager" ${user.role === 'InventoryManager' ? 'selected' : ''}>Inventory Manager</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-small" style="background-color:#707ebe;" onclick="closeModal('edit-user-modal')">Cancel</button>
          <button class="btn-small" onclick="submitEditUser('${userId}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function submitEditUser(userId) {
  const name = document.getElementById('edit-user-name').value.trim();
  const email = document.getElementById('edit-user-email').value.trim();
  const role = document.getElementById('edit-user-role').value;

  if (!name || !email || !role) {
    alert('All fields are required');
    return;
  }

  fetch('update-user.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, name, email, role })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('User updated successfully!');
      closeModal('edit-user-modal');
      fetchDashboardData().then(() => {
        loadUsersSection();
        loadOverviewSection();
      });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    return;
  }

  fetch('delete-user.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId })
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      alert('User deleted successfully!');
      fetchDashboardData().then(() => {
        loadUsersSection();
        loadOverviewSection();
      });
    } else {
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

// ------------------------------------------------------------
// MODAL UTILITIES
// ------------------------------------------------------------
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.remove();
}

function logoutUser() {
  window.location.href = 'logout.php';
}

// ------------------------------------------------------------
// UTILITIES
// ------------------------------------------------------------
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Expose functions used by inline onclick handlers
window.loadSection   = loadSection;
window.showForm      = showForm;
window.editPatient   = editPatient;
window.deletePatient = deletePatient;
window.editUser      = editUser;
window.deleteUser    = deleteUser;
window.closeModal    = closeModal;
window.logoutUser    = logoutUser;
window.submitAddPatient = submitAddPatient;
window.submitEditPatient = submitEditPatient;
window.submitAddUser = submitAddUser;
window.submitEditUser = submitEditUser;