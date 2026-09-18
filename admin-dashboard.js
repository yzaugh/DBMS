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
      // Skip the logout link (it has margin-top inline style)
      if (item.style.marginTop) return;
      // Links with real hrefs navigate normally
      if (item.getAttribute('href') && item.getAttribute('href') !== '#') return;
      e.preventDefault();
    });
  });
}

function loadSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });

  // Show target
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) targetSection.style.display = 'block';

  // Update nav highlight
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (event && event.target) {
    const nav = event.target.closest('.nav-item');
    if (nav) nav.classList.add('active');
  }

  // Title
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

  // Section-specific loaders
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
    // Still show zeros so the page isn't stuck on "Loading..."
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
  const records = dashboardData.activities || []; // reused from activities query

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
// ACTIONS
// ------------------------------------------------------------
function showForm(formType) {
  if (formType === 'add-patient') {
    const name = prompt('Patient Name:');
    if (!name) return;
    const email = prompt('Patient Email:');
    if (!email) return;
    const phone = prompt('Patient Phone (optional):') || '';

    fetch('add-patient.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        alert('Patient added successfully!');
        fetchDashboardData().then(() => {
          loadPatientsSection();
          loadOverviewSection();
        });
      } else {
        alert('Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => alert('Network error: ' + err));
  } else {
    alert(`Form for ${formType} - To be implemented`);
  }
}

function editPatient(patientId) {
  alert(`Editing patient ID: ${patientId}`);
}

function deletePatient(patientId) {
  if (confirm('Are you sure you want to delete this patient?')) {
    alert('Delete functionality to be linked to backend');
  }
}

function editUser(userId) {
  alert(`Editing user ID: ${userId}`);
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    alert('Delete functionality to be linked to backend');
  }
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
window.logoutUser    = logoutUser;