// Patient Portal Controller

let currentPatientId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication and role
  if (!AuthManager.requireRole(UserRoles.PATIENT)) {
    return;
  }

  initializePatientPortal();
  loadDashboardSection();
});

function initializePatientPortal() {
  const user = AuthManager.getCurrentUser();
  if (user) {
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('user-avatar').innerText = user.name.substring(0, 2).toUpperCase();
    
    // Find patient record
    const patients = DataManager.getPatients();
    const patient = patients.find(p => p.email === user.email);
    if (patient) {
      currentPatientId = patient.id;
    }
  }
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
    dashboard: 'My Dashboard',
    'my-records': 'My Medical Records',
    'my-appointments': 'My Appointments',
    prescriptions: 'My Prescriptions',
    profile: 'My Profile'
  };
  document.getElementById('page-title').innerText = titles[sectionName] || 'Dashboard';

  // Load section-specific data
  switch(sectionName) {
    case 'dashboard':
      loadDashboardSection();
      break;
    case 'my-records':
      loadMyRecordsSection();
      break;
    case 'my-appointments':
      loadMyAppointmentsSection();
      break;
    case 'prescriptions':
      loadPrescriptionsSection();
      break;
    case 'profile':
      loadProfileSection();
      break;
  }
}

function loadDashboardSection() {
  if (!currentPatientId) return;

  const myRecords = DataManager.getRecordsByPatient(currentPatientId);
  const myAppointments = DataManager.getAppointmentsByPatient(currentPatientId);
  const upcomingAppointments = getUpcomingAppointments(myAppointments);

  document.getElementById('my-records-count').innerText = myRecords.length;
  document.getElementById('my-upcoming-count').innerText = upcomingAppointments.length;
  document.getElementById('my-prescriptions-count').innerText = myRecords.filter(r => r.prescription && r.prescription !== 'None').length;

  // Load upcoming appointments
  const tbody = document.getElementById('upcoming-appointments');
  if (upcomingAppointments.length > 0) {
    tbody.innerHTML = upcomingAppointments.slice(0, 5).map(apt => `
      <tr>
        <td>${apt.doctorName}</td>
        <td>${formatDate(apt.date)}</td>
        <td>${formatTime(apt.time)}</td>
        <td>${apt.reason}</td>
        <td><span class="status scheduled">Scheduled</span></td>
        <td>
          <button class="btn-small" onclick="viewAppointmentDetails('${apt.id}')">View</button>
          <button class="btn-small danger" onclick="cancelAppointment('${apt.id}')">Cancel</button>
        </td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No upcoming appointments</td></tr>';
  }
}

function loadMyRecordsSection() {
  if (!currentPatientId) return;

  const myRecords = DataManager.getRecordsByPatient(currentPatientId);
  const tbody = document.getElementById('my-records-table');

  tbody.innerHTML = myRecords.map(record => `
    <tr>
      <td>${formatDate(record.date)}</td>
      <td>${record.doctorName}</td>
      <td>${record.type}</td>
      <td>${record.diagnosis}</td>
      <td>${record.prescription}</td>
      <td>
        <button class="btn-small" onclick="viewRecord('${record.id}')">View</button>
        <button class="btn-small" onclick="downloadRecord('${record.id}')">Download</button>
      </td>
    </tr>
  `).join('');

  if (myRecords.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No medical records available</td></tr>';
  }
}

function loadMyAppointmentsSection() {
  if (!currentPatientId) return;

  const myAppointments = DataManager.getAppointmentsByPatient(currentPatientId);
  const tbody = document.getElementById('my-appointments-table');

  tbody.innerHTML = myAppointments.map(apt => `
    <tr>
      <td>${apt.doctorName}</td>
      <td>${formatDate(apt.date)}</td>
      <td>${formatTime(apt.time)}</td>
      <td>${apt.reason}</td>
      <td><span class="status ${apt.status}">${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</span></td>
      <td>
        <button class="btn-small" onclick="viewAppointmentDetails('${apt.id}')">View</button>
        ${apt.status === 'scheduled' ? `<button class="btn-small danger" onclick="cancelAppointmentConfirm('${apt.id}')">Cancel</button>` : ''}
      </td>
    </tr>
  `).join('');

  if (myAppointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No appointments scheduled</td></tr>';
  }
}

function loadPrescriptionsSection() {
  if (!currentPatientId) return;

  const myRecords = DataManager.getRecordsByPatient(currentPatientId);
  const prescriptions = myRecords.filter(r => r.prescription && r.prescription !== 'None');
  const tbody = document.getElementById('prescriptions-table');

  tbody.innerHTML = prescriptions.map(record => `
    <tr>
      <td>${formatDate(record.date)}</td>
      <td>${record.doctorName}</td>
      <td>${record.prescription}</td>
      <td>As prescribed</td>
      <td>As directed</td>
      <td>0</td>
    </tr>
  `).join('');

  if (prescriptions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No active prescriptions</td></tr>';
  }
}

function loadProfileSection() {
  if (!currentPatientId) return;

  const patient = DataManager.getPatientById(currentPatientId);
  if (patient) {
    document.getElementById('profile-name').value = patient.name;
    document.getElementById('profile-email').value = patient.email;
    document.getElementById('profile-phone').value = patient.phone;
    document.getElementById('profile-dob').value = patient.dob;
    document.getElementById('profile-gender').value = patient.gender;
    document.getElementById('profile-blood-type').value = patient.bloodType;
    document.getElementById('profile-address').value = patient.address;
  }
}

function bookAppointment() {
  const modalHtml = `
    <div id="booking-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Book Appointment</h2>
          <button onclick="closeBookingModal()" style="background:none; border:none; cursor:pointer;"><i data-feather="x"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Physician</label>
            <select id="book-doctor" onchange="updateAvailableSlots()">
              <option value="">Choose a doctor...</option>
              ${DataManager.getDoctors().map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Select Date</label>
            <input type="date" id="book-date" min="${getCurrentDate()}" onchange="updateAvailableSlots()">
          </div>
          <div class="form-group">
            <label>Available Time Slots</label>
            <select id="book-time" disabled>
              <option value="">Select doctor and date first</option>
            </select>
          </div>
          <div class="form-group">
            <label>Reason for Visit</label>
            <textarea id="book-reason" placeholder="Briefly describe your symptoms or reason for visit"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" style="background-color: #707ebe;" onclick="closeBookingModal()">Cancel</button>
          <button class="btn-primary" id="confirm-booking-btn" onclick="confirmBooking()" disabled>Confirm Booking</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  feather.replace();
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.remove();
}

function updateAvailableSlots() {
  const doctorId = document.getElementById('book-doctor').value;
  const date = document.getElementById('book-date').value;
  const timeSelect = document.getElementById('book-time');
  const confirmBtn = document.getElementById('confirm-booking-btn');

  if (!doctorId || !date) {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Select doctor and date first</option>';
    confirmBtn.disabled = true;
    return;
  }

  const slots = DataManager.getAvailableSlots(doctorId, date);
  
  if (slots.length > 0) {
    timeSelect.disabled = false;
    timeSelect.innerHTML = slots.map(s => `<option value="${s}">${formatTime(s)}</option>`).join('');
    confirmBtn.disabled = false;
  } else {
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">No slots available for this date</option>';
    confirmBtn.disabled = true;
  }
}

function confirmBooking() {
  const doctorId = document.getElementById('book-doctor').value;
  const date = document.getElementById('book-date').value;
  const time = document.getElementById('book-time').value;
  const reason = document.getElementById('book-reason').value;

  if (!doctorId || !date || !time || !reason) {
    alert('Please fill in all fields');
    return;
  }

  const doctor = DataManager.getDoctorById(doctorId);
  const patient = DataManager.getPatientById(currentPatientId);

  const newAppointment = {
    patientId: currentPatientId,
    patientName: patient.name,
    doctorId: doctorId,
    doctorName: doctor.name,
    date: date,
    time: time,
    reason: reason,
    status: 'scheduled',
    notes: ''
  };

  DataManager.addAppointment(newAppointment);
  alert('Appointment booked successfully!');
  closeBookingModal();
  loadMyAppointmentsSection();
  loadDashboardSection();
}


function viewAppointmentDetails(appointmentId) {
  const apt = DataManager.getAppointments().find(a => a.id === appointmentId);
  if (apt) {
    alert(`Appointment with ${apt.doctorName}\nDate: ${formatDate(apt.date)} at ${formatTime(apt.time)}\nReason: ${apt.reason}`);
  }
}

function cancelAppointment(appointmentId) {
  cancelAppointmentConfirm(appointmentId);
}

function cancelAppointmentConfirm(appointmentId) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    DataManager.cancelAppointment(appointmentId);
    alert('Appointment cancelled successfully');
    loadDashboardSection();
  }
}

function viewRecord(recordId) {
  const record = DataManager.getMedicalRecords().find(r => r.id === recordId);
  if (record) {
    alert(`Medical Record\nDate: ${formatDate(record.date)}\nDoctor: ${record.doctorName}\nDiagnosis: ${record.diagnosis}\nPrescription: ${record.prescription}`);
  }
}

function downloadRecord(recordId) {
  const record = DataManager.getMedicalRecords().find(r => r.id === recordId);
  if (record) {
    const content = `MEDICAL RECORD\n================\nDate: ${formatDate(record.date)}\nDoctor: ${record.doctorName}\nType: ${record.type}\nDiagnosis: ${record.diagnosis}\nPrescription: ${record.prescription}\nNotes: ${record.notes}`;
    downloadFile(content, `medical_record_${recordId}.txt`);
  }
}

function downloadRecords() {
  if (!currentPatientId) return;

  const patient = DataManager.getPatientById(currentPatientId);
  const records = DataManager.getRecordsByPatient(currentPatientId);

  let content = `PATIENT MEDICAL RECORDS\n`;
  content += `========================\n`;
  content += `Name: ${patient.name}\n`;
  content += `Email: ${patient.email}\n`;
  content += `Phone: ${patient.phone}\n`;
  content += `DOB: ${patient.dob}\n`;
  content += `Blood Type: ${patient.bloodType}\n\n`;
  content += `MEDICAL RECORDS:\n`;
  content += `----------------\n`;

  records.forEach(record => {
    content += `\nDate: ${formatDate(record.date)}\n`;
    content += `Doctor: ${record.doctorName}\n`;
    content += `Type: ${record.type}\n`;
    content += `Diagnosis: ${record.diagnosis}\n`;
    content += `Prescription: ${record.prescription}\n`;
    content += `Notes: ${record.notes}\n`;
    content += `---\n`;
  });

  downloadFile(content, `medical_records_${patient.name.replace(/\s/g, '_')}.txt`);
}

function editProfile() {
  alert('Profile editing - To be implemented with form submission');
}

function downloadFile(content, filename) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function logoutUser() {
  AuthManager.logout();
}
