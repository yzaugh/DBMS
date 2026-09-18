// Receptionist Portal Controller

document.addEventListener('DOMContentLoaded', () => {
  if (!AuthManager.requireRole(UserRoles.RECEPTIONIST)) return;
  initializeReceptionistPortal();
  loadDashboardSection();
});

function initializeReceptionistPortal() {
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
    dashboard: 'Receptionist Dashboard',
    appointments: 'Appointment Management',
    queue: 'Queue Management',
    patients: 'Patient Check-in'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  switch(sectionName) {
    case 'dashboard':
      loadDashboardSection();
      break;
    case 'appointments':
      loadAppointmentsSection();
      break;
    case 'queue':
      loadQueueSection();
      break;
    case 'patients':
      loadPatientCheckInSection();
      break;
  }
}

function loadDashboardSection() {
  const appointments = DataManager.getAppointments();
  const today = getCurrentDate();
  const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'cancelled');
  const checkedIn = todayAppointments.filter(a => a.status === 'completed').length;
  const waiting = todayAppointments.filter(a => a.status === 'scheduled').length;

  document.getElementById('today-count').innerText = todayAppointments.length;
  document.getElementById('checkin-count').innerText = checkedIn;
  document.getElementById('waiting-count').innerText = waiting;

  const tbody = document.getElementById('today-appointments');
  if (todayAppointments.length > 0) {
    tbody.innerHTML = todayAppointments.map(apt => `
      <tr>
        <td>${formatTime(apt.time)}</td>
        <td>${apt.patientName}</td>
        <td>${apt.doctorName}</td>
        <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
        <td>
          <button class="btn-small" onclick="checkInPatient('${apt.id}')">Check-in</button>
          <button class="btn-small" onclick="rescheduleAppointment('${apt.id}')">Reschedule</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No appointments today</td></tr>';
  }
}

function loadAppointmentsSection() {
  const appointments = DataManager.getAppointments();
  const tbody = document.getElementById('appointments-table');

  tbody.innerHTML = appointments.map(apt => `
    <tr>
      <td>${formatDate(apt.date)}</td>
      <td>${formatTime(apt.time)}</td>
      <td>${apt.patientName}</td>
      <td>${apt.doctorName}</td>
      <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
      <td>
        <button class="btn-small" onclick="editAppointment('${apt.id}')">Edit</button>
        <button class="btn-small danger" onclick="cancelAppointmentConfirm('${apt.id}')">Cancel</button>
      </td>
    </tr>
  `).join('');
}

function loadQueueSection() {
  const appointments = DataManager.getAppointments();
  const today = getCurrentDate();
  const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));

  const tbody = document.getElementById('queue-table');
  if (todayAppointments.length > 0) {
    tbody.innerHTML = todayAppointments.map((apt, index) => {
      const checkInTime = new Date().toLocaleTimeString();
      const waitTime = '5 mins';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${apt.patientName}</td>
          <td>${apt.doctorName}</td>
          <td>${checkInTime}</td>
          <td>${waitTime}</td>
          <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
          <td>
            <button class="btn-small" onclick="completeQueue('${apt.id}')">Complete</button>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No patients in queue</td></tr>';
  }
}

function loadPatientCheckInSection() {
  const appointments = DataManager.getAppointments();
  const today = getCurrentDate();
  const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'cancelled');
  const patients = DataManager.getPatients();

  const tbody = document.getElementById('checkin-table');
  
  if (todayAppointments.length > 0) {
    tbody.innerHTML = todayAppointments.map(apt => {
      const patient = patients.find(p => p.id === apt.patientId);
      return `
        <tr>
          <td>${apt.patientName}</td>
          <td>${patient?.email || 'N/A'}</td>
          <td>${patient?.phone || 'N/A'}</td>
          <td>${formatTime(apt.time)}</td>
          <td>${apt.doctorName}</td>
          <td>
            <button class="btn-small" onclick="checkInPatient('${apt.id}')">Check-in</button>
            <button class="btn-small" onclick="viewPatientInfo('${apt.patientId}')">Info</button>
          </td>
        </tr>
      `;
    }).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No appointments today</td></tr>';
  }
}

function checkInPatient(appointmentId) {
  const apt = DataManager.getAppointments().find(a => a.id === appointmentId);
  if (apt) {
    if (confirm(`Check-in patient ${apt.patientName}?`)) {
      // Update appointment status - mark as in-progress or completed
      alert(`Patient ${apt.patientName} checked in successfully`);
    }
  }
}

function rescheduleAppointment(appointmentId) {
  alert('Reschedule appointment form - To be implemented');
}

function editAppointment(appointmentId) {
  alert('Edit appointment - To be implemented');
}

function cancelAppointmentConfirm(appointmentId) {
  const apt = DataManager.getAppointments().find(a => a.id === appointmentId);
  if (apt && confirm(`Cancel appointment for ${apt.patientName}?`)) {
    DataManager.cancelAppointment(appointmentId);
    alert('Appointment cancelled');
    loadAppointmentsSection();
  }
}

function completeQueue(appointmentId) {
  const apt = DataManager.getAppointments().find(a => a.id === appointmentId);
  if (apt && confirm(`Mark ${apt.patientName}'s appointment as completed?`)) {
    DataManager.updateAppointment(appointmentId, { status: 'completed' });
    alert('Appointment marked as completed');
    loadQueueSection();
  }
}

function viewPatientInfo(patientId) {
  const patient = DataManager.getPatientById(patientId);
  if (patient) {
    alert(`Patient: ${patient.name}\nEmail: ${patient.email}\nPhone: ${patient.phone}\nDOB: ${patient.dob}\nBlood Type: ${patient.bloodType}`);
  }
}

function createAppointment() {
  alert('Create appointment form - To be implemented');
}

function logoutUser() {
  AuthManager.logout();
}
