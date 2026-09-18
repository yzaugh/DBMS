// Admin Dashboard Controller (MySQL Connected)

let dashboardData = {};

document.addEventListener('DOMContentLoaded', async () => {
  initializeDashboard();
  await fetchDashboardData();
  loadOverviewSection();
});

async function fetchDashboardData() {
  try {
    const response = await fetch('get_admin_data.php');
    const data = await response.json();
    if (data.success) {
      dashboardData = data;
    } else {
      console.error('Failed to load database data:', data.error);
    }
  } catch (error) {
    console.error('Network error fetching dashboard data:', error);
  }
}

function initializeDashboard() {
  // Set up nav item click handlers
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!item.style.marginTop) {
        e.preventDefault();
      }
    });
  });
}

function loadSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none';
  });

  // Show selected section
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.style.display = 'block';
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  event.target.closest('.nav-item')?.classList.add('active');

  // Update page title
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

  // Load section-specific data from MySQL payload
  switch(sectionName) {
    case 'overview':
      loadOverviewSection();
      break;
    case 'patients':
      loadPatientsSection();
      break;
    case 'doctors':
      loadDoctorsSection();
      break;
    case 'records':
      loadRecordsSection();
      break;
    case 'users':
      loadUsersSection();
      break;
    case 'queue':
      loadQueueSection();
      break;
  }
}

function loadOverviewSection() {
  if (!dashboardData.stats) return;

  // Update KPIs
  document.getElementById('total-patients').innerText = dashboardData.stats.totalPatients;
  document.getElementById('active-doctors').innerText = dashboardData.stats.activeDoctors;
  document.getElementById('total-records').innerText = dashboardData.stats.totalRecords;
  document.getElementById('todays-appointments').innerText = dashboardData.stats.todaysAppointments;

  // Load recent activities
  const tbody = document.getElementById('recent-activities');
  const activities = dashboardData.activities || [];
  
  if (activities.length > 0) {
    tbody.innerHTML = activities.map(act => `
      <tr>
        <td>${act.type}</td>
        <td>${act.patientName}</td>
        <td>${act.doctorName}</td>
        <td>${act.date}</td>
        <td><span class="status completed">Completed</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No recent activities</td></tr>`;
  }
}

function loadPatientsSection() {
  const tbody = document.getElementById('patients-table');
  const patients = dashboardData.patients || [];

  if (patients.length > 0) {
    tbody.innerHTML = patients.map(patient => `
      <tr>
        <td>${patient.name}</td>
        <td>${patient.email}</td>
        <td>${patient.phone || 'N/A'}</td>
        <td>${patient.registeredDate || 'N/A'}</td>
        <td>${patient.lastVisit || 'Never'}</td>
        <td>
          <button class="btn-small" onclick="editPatient('${patient.id}')">Edit</button>
          <button class="btn-small danger" onclick="deletePatient('${patient.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No patients found in database</td></tr>`;
  }
}

function loadDoctorsSection() {
  const tbody = document.getElementById('doctors-table');
  const doctors = dashboardData.doctors || [];

  if (doctors.length > 0) {
    tbody.innerHTML = doctors.map(doctor => `
      <tr>
        <td>${doctor.name}</td>
        <td>${doctor.specialization || 'General'}</td>
        <td>${doctor.licenseNo || 'N/A'}</td>
        <td>${doctor.yearsExperience || 0} years</td>
        <td>$${doctor.consultationFee || 0.00}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No doctors found</td></tr>`;
  }
}

function loadRecordsSection() {
  const tbody = document.getElementById('records-table');
  const records = dashboardData.activities || []; // mapped from records query

  if (records.length > 0) {
    tbody.innerHTML = records.map(record => `
      <tr>
        <td>${record.patientName}</td>
        <td>${record.doctorName}</td>
        <td>${record.date}</td>
        <td>${record.type}</td>
        <td>General Diagnosis</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No medical records found</td></tr>`;
  }
}

function loadUsersSection() {
  const tbody = document.getElementById('users-table');
  const users = dashboardData.users || [];

  const roleColors = { Admin: '#e74c3c', Physician: '#3498db', Patient: '#2ecc71', Receptionist: '#f39c12', Pharmacist: '#9b59b6', InventoryManager: '#1abc9c' };

  if (users.length > 0) {
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td><span class="badge" style="background-color: ${roleColors[user.role] || '#7f8c8d'}; color: white; padding: 4px 8px; border-radius: 4px;">${user.role}</span></td>
        <td>
          <button class="btn-small" onclick="editUser('${user.id}')">Edit</button>
          <button class="btn-small danger" onclick="deleteUser('${user.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No users found</td></tr>`;
  }
}

function loadQueueSection() {
  const tbody = document.getElementById('queue-table');
  const queue = dashboardData.queue || [];

  if (queue.length > 0) {
    tbody.innerHTML = queue.map(q => `
      <tr>
        <td>#${q.queue_number}</td>
        <td>${q.patient_name}</td>
        <td>${q.doctor_name}</td>
        <td>${q.check_in_time}</td>
        <td>${q.wait_time || '0 mins'}</td>
        <td><span class="status ${q.status.toLowerCase()}">${q.status}</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No patients currently in queue</td></tr>`;
  }
}

function logoutUser() {
  window.location.href = 'login.html';
}

function showForm(formType) {
  alert(`Form for ${formType} - To be implemented`);
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