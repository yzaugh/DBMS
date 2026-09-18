// Doctor Portal Controller

let currentDoctorId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!AuthManager.requireRole(UserRoles.DOCTOR)) {
    return;
  }

  initializeDoctorPortal();
  loadDashboardSection();
});

function initializeDoctorPortal() {
  const user = AuthManager.getCurrentUser();
  if (user) {
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-avatar').innerText = user.name.substring(0, 2).toUpperCase();
    
    const doctors = DataManager.getDoctors();
    const doctor = doctors.find(d => d.email === user.email);
    if (doctor) {
      currentDoctorId = doctor.id;
    }
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
    dashboard: 'Doctor Dashboard',
    patients: 'My Patients',
    appointments: 'My Appointments',
    schedule: 'My Working Hours',
    records: 'Medical Records',
    prescriptions: 'My Prescriptions'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  switch(sectionName) {
    case 'dashboard':
      loadDashboardSection();
      break;
    case 'patients':
      loadPatientsSection();
      break;
    case 'appointments':
      loadAppointmentsSection();
      break;
    case 'schedule':
      loadScheduleSection();
      break;
    case 'records':
      loadRecordsSection();
      break;
    case 'prescriptions':
      loadPrescriptionsSection();
      break;
  }
}


function loadDashboardSection() {
  if (!currentDoctorId) return;

  const appointments = DataManager.getAppointmentsByDoctor(currentDoctorId);
  const records = DataManager.getMedicalRecords().filter(r => r.doctorId === currentDoctorId);
  const today = getCurrentDate();
  const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'cancelled');

  document.getElementById('my-patients-count').innerText = appointments.length;
  document.getElementById('today-appointments-count').innerText = todayAppointments.length;
  document.getElementById('reviewed-count').innerText = records.length;

  const tbody = document.getElementById('todays-schedule');
  if (todayAppointments.length > 0) {
    tbody.innerHTML = todayAppointments.map(apt => `
      <tr>
        <td>${formatTime(apt.time)}</td>
        <td>${apt.patientName}</td>
        <td>${apt.reason}</td>
        <td><span class="status scheduled">Scheduled</span></td>
        <td>
          <button class="btn-small" onclick="startConsultation('${apt.id}')">Start</button>
          <button class="btn-small" onclick="completeAppointment('${apt.id}')">Complete</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No appointments today</td></tr>';
  }
}

function loadPatientsSection() {
  if (!currentDoctorId) return;

  const appointments = DataManager.getAppointmentsByDoctor(currentDoctorId);
  const patientIds = [...new Set(appointments.map(a => a.patientId))];
  const patients = DataManager.getPatients().filter(p => patientIds.includes(p.id));

  const tbody = document.getElementById('patients-table');
  tbody.innerHTML = patients.map(patient => `
    <tr>
      <td>${patient.name}</td>
      <td>${patient.email}</td>
      <td>${patient.phone}</td>
      <td>${formatDate(patient.lastVisit)}</td>
      <td>${patient.bloodType}</td>
      <td>
        <button class="btn-small" onclick="viewPatientRecord('${patient.id}')">View Records</button>
        <button class="btn-small" onclick="scheduleAppointment('${patient.id}')">Schedule</button>
      </td>
    </tr>
  `).join('');

  if (patients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No patients assigned</td></tr>';
  }
}

function loadAppointmentsSection() {
  if (!currentDoctorId) return;

  const appointments = DataManager.getAppointmentsByDoctor(currentDoctorId);
  const tbody = document.getElementById('appointments-table');

  tbody.innerHTML = appointments.map(apt => `
    <tr>
      <td>${formatDate(apt.date)}</td>
      <td>${formatTime(apt.time)}</td>
      <td>${apt.patientName}</td>
      <td>${apt.reason}</td>
      <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
      <td>
        <button class="btn-small" onclick="viewAppointmentDetails('${apt.id}')">View</button>
        ${apt.status === 'scheduled' ? `<button class="btn-small" onclick="completeAppointment('${apt.id}')">Complete</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function loadRecordsSection() {
  if (!currentDoctorId) return;

  const records = DataManager.getMedicalRecords().filter(r => r.doctorId === currentDoctorId);
  const tbody = document.getElementById('records-table');

  tbody.innerHTML = records.map(record => `
    <tr>
      <td>${formatDate(record.date)}</td>
      <td>${record.patientName}</td>
      <td>${record.type}</td>
      <td>${record.diagnosis}</td>
      <td>${record.prescription}</td>
      <td>
        <button class="btn-small" onclick="editRecord('${record.id}')">Edit</button>
        <button class="btn-small" onclick="viewFullRecord('${record.id}')">View</button>
      </td>
    </tr>
  `).join('');

  if (records.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records created yet</td></tr>';
  }
}

function loadScheduleSection() {
  if (!currentDoctorId) return;

  const availability = DataManager.getDoctorAvailability(currentDoctorId);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const container = document.getElementById('availability-editor');

  container.innerHTML = days.map(day => {
    const slot = availability.find(s => s.day === day) || { startTime: '', endTime: '' };
    const isActive = !!slot.startTime;

    return `
      <div class="availability-row" data-day="${day}">
        <div class="day-label">
          <input type="checkbox" id="check-${day}" ${isActive ? 'checked' : ''} onchange="toggleDay('${day}')">
          <label for="check-${day}">${day}</label>
        </div>
        <div class="time-inputs ${isActive ? '' : 'disabled'}" id="times-${day}">
          <input type="time" class="start-time" value="${slot.startTime}" ${isActive ? '' : 'disabled'}>
          <span>to</span>
          <input type="time" class="end-time" value="${slot.endTime}" ${isActive ? '' : 'disabled'}>
        </div>
      </div>
    `;
  }).join('');
}

function toggleDay(day) {
  const checkbox = document.getElementById(`check-${day}`);
  const timeContainer = document.getElementById(`times-${day}`);
  const inputs = timeContainer.querySelectorAll('input');

  if (checkbox.checked) {
    timeContainer.classList.remove('disabled');
    inputs.forEach(i => i.disabled = false);
  } else {
    timeContainer.classList.add('disabled');
    inputs.forEach(i => {
      i.disabled = true;
      i.value = '';
    });
  }
}

function saveAvailability() {
  const rows = document.querySelectorAll('.availability-row');
  const slots = [];

  rows.forEach(row => {
    const day = row.dataset.day;
    const checkbox = row.querySelector('input[type="checkbox"]');
    const startTime = row.querySelector('.start-time').value;
    const endTime = row.querySelector('.end-time').value;

    if (checkbox.checked && startTime && endTime) {
      if (startTime >= endTime) {
        alert(`End time must be after start time for ${day}`);
        return;
      }
      slots.push({ day, startTime, endTime });
    }
  });

  DataManager.updateDoctorAvailability(currentDoctorId, slots);
  alert('Availability schedule saved successfully!');
}


function startConsultation(appointmentId) {
  alert('Starting consultation - To be implemented');
}

function completeAppointment(appointmentId) {
  const apt = DataManager.getAppointments().find(a => a.id === appointmentId);
  if (apt && confirm('Mark this appointment as completed?')) {
    DataManager.updateAppointment(appointmentId, { status: 'completed' });
    alert('Appointment marked as completed');
    loadDashboardSection();
  }
}

function viewPatientRecord(patientId) {
  const patient = DataManager.getPatientById(patientId);
  if (patient) {
    alert(`Patient: ${patient.name}\nEmail: ${patient.email}\nPhone: ${patient.phone}\nBlood Type: ${patient.bloodType}`);
  }
}

function scheduleAppointment(patientId) {
  alert('Schedule appointment - To be implemented');
}

function viewAppointmentDetails(appointmentId) {
  const apt = DataManager.getAppointments().find(a => a.id === appointmentId);
  if (apt) {
    alert(`Appointment\nPatient: ${apt.patientName}\nDate: ${formatDate(apt.date)} at ${formatTime(apt.time)}\nReason: ${apt.reason}`);
  }
}

function createNewRecord() {
  alert('Create medical record form - To be implemented');
}

function editRecord(recordId) {
  alert('Edit medical record - To be implemented');
}

function viewFullRecord(recordId) {
  const record = DataManager.getMedicalRecords().find(r => r.id === recordId);
  if (record) {
    alert(`Medical Record\nDate: ${formatDate(record.date)}\nPatient: ${record.patientName}\nDiagnosis: ${record.diagnosis}\nPrescription: ${record.prescription}\nNotes: ${record.notes}`);
  }
}

function createPrescription() {
  alert('Create prescription - To be implemented');
}

function logoutUser() {
  AuthManager.logout();
}
