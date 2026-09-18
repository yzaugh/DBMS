// ============================================================
// CarePulse — Admin Dashboard Controller (MySQL backed)
// ============================================================

let dashboardData = {};

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

  // 2. Load
  initializeDashboard();
  await fetchDashboardData();
  loadOverviewSection();
});

// ------------------------------------------------------------
async function fetchDashboardData() {
  try {
    const res  = await fetch('get_admin_data.php');
    const data = await res.json();
    dashboardData = data.success ? data : {};
  } catch (e) {
    console.error('fetchDashboardData:', e);
    dashboardData = {};
  }
}

// ------------------------------------------------------------
function initializeDashboard() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.style.marginTop) return; // logout
      const href = item.getAttribute('href');
      if (href && href !== '#') return;  // real page link
      e.preventDefault();
    });
  });
}

function loadSection(sectionName) {
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');

  const target = document.getElementById(`section-${sectionName}`);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  if (window.event && window.event.target) {
    const nav = window.event.target.closest('.nav-item');
    if (nav) nav.classList.add('active');
  }

  const titles = {
    overview: 'Dashboard Overview',
    patients: 'Patient Management',
    appointments: 'Appointment Management',
    doctors: 'Doctor Management',
    records: 'Medical Records',
    users: 'User Management',
    queue: 'Queue Management'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  switch (sectionName) {
    case 'overview':  loadOverviewSection();  break;
    case 'patients':  loadPatientsSection();  break;
    case 'doctors':   loadDoctorsSection();   break;
    case 'records':   loadRecordsSection();   break;
    case 'users':     loadUsersSection();     break;
    case 'queue':     loadQueueSection();     break;
  }
}

// ------------------------------------------------------------
function loadOverviewSection() {
  const s = dashboardData.stats || { totalPatients: 0, activeDoctors: 0, totalRecords: 0, todaysAppointments: 0 };
  document.getElementById('total-patients').innerText      = s.totalPatients;
  document.getElementById('active-doctors').innerText      = s.activeDoctors;
  document.getElementById('total-records').innerText       = s.totalRecords;
  document.getElementById('todays-appointments').innerText = s.todaysAppointments;

  const tbody = document.getElementById('recent-activities');
  const activities = dashboardData.activities || [];

  if (activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No recent activities</td></tr>`;
    return;
  }
  tbody.innerHTML = activities.map(a => `
    <tr>
      <td>${escapeHtml(a.type || 'N/A')}</td>
      <td>${escapeHtml(a.patientName || 'N/A')}</td>
      <td>${escapeHtml(a.doctorName || 'N/A')}</td>
      <td>${formatDate(a.date)}</td>
      <td><span class="status completed">Completed</span></td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
function loadPatientsSection() {
  const tbody = document.getElementById('patients-table');
  const rows  = dashboardData.patients || [];

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No patients found</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(p => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.email)}</td>
      <td>${escapeHtml(p.phone || 'N/A')}</td>
      <td>${formatDate(p.registeredDate)}</td>
      <td>${formatDate(p.lastVisit)}</td>
      <td>
        <button class="btn-small" onclick="editPatient('${p.id}')">Edit</button>
        <button class="btn-small danger" onclick="deletePatient('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
function loadDoctorsSection() {
  const tbody = document.getElementById('doctors-table');
  const rows  = dashboardData.doctors || [];

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No doctors found</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(d => `
    <tr>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.specialization || 'General')}</td>
      <td>${escapeHtml(d.licenseNo || 'N/A')}</td>
      <td>${d.yearsExperience ?? 0} years</td>
      <td>$${parseFloat(d.consultationFee || 0).toFixed(2)}</td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
function loadRecordsSection() {
  const tbody = document.getElementById('records-table');
  const rows  = dashboardData.activities || [];

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No medical records found</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${escapeHtml(r.patientName || 'N/A')}</td>
      <td>${escapeHtml(r.doctorName || 'N/A')}</td>
      <td>${formatDate(r.date)}</td>
      <td>${escapeHtml(r.type || 'N/A')}</td>
      <td>General Diagnosis</td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
function loadUsersSection() {
  const tbody = document.getElementById('users-table');
  const rows  = dashboardData.users || [];

  const roleColors = {
    Admin:            '#e74c3c',
    Physician:        '#3498db',
    Patient:          '#2ecc71',
    Receptionist:     '#f39c12',
    Pharmacist:       '#9b59b6',
    InventoryManager: '#1abc9c'
  };

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No users found</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(u => `
    <tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge" style="background:${roleColors[u.role] || '#7f8c8d'};color:#fff;padding:4px 8px;border-radius:4px;">${escapeHtml(u.role)}</span></td>
      <td>
        <button class="btn-small" onclick="editUser('${u.id}')">Edit</button>
        <button class="btn-small danger" onclick="deleteUser('${u.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
function loadQueueSection() {
  const tbody = document.getElementById('queue-table');
  const rows  = dashboardData.queue || [];

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No patients currently in queue</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(q => `
    <tr>
      <td>#${q.queue_number ?? 'N/A'}</td>
      <td>${escapeHtml(q.patient_name || 'N/A')}</td>
      <td>${escapeHtml(q.doctor_name || 'N/A')}</td>
      <td>${escapeHtml(q.check_in_time || 'N/A')}</td>
      <td>${escapeHtml(q.wait_time || '0 mins')}</td>
      <td><span class="status ${(q.status || 'waiting').toLowerCase()}">${escapeHtml(q.status || 'Waiting')}</span></td>
    </tr>
  `).join('');
}

// ------------------------------------------------------------
function showForm(formType) {
  if (formType !== 'add-patient') {
    alert(`Form for ${formType} - To be implemented`);
    return;
  }

  const name  = prompt('Patient Name:');
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
      alert('Error: ' + (data.error || 'Unknown'));
    }
  })
  .catch(err => alert('Network error: ' + err));
}

function editPatient(id)   { alert('Edit patient ' + id); }
function deletePatient(id) { if (confirm('Delete this patient?')) alert('Delete ' + id); }
function editUser(id)      { alert('Edit user ' + id); }
function deleteUser(id)    { if (confirm('Delete this user?')) alert('Delete ' + id); }
function logoutUser()      { window.location.href = 'logout.php'; }

// ------------------------------------------------------------
function formatDate(s) {
  if (!s) return 'N/A';
  const d = new Date(s);
  return isNaN(d) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Expose to inline onclick handlers
window.loadSection   = loadSection;
window.showForm      = showForm;
window.editPatient   = editPatient;
window.deletePatient = deletePatient;
window.editUser      = editUser;
window.deleteUser    = deleteUser;
window.logoutUser    = logoutUser;