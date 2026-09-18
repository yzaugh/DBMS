let selectedRole = 'Admin';

const roleConfig = {
  'Admin':            { display: 'Admin',            redirect: 'index.html' },
  'Physician':        { display: 'Physician',        redirect: 'doctor-portal.html' },
  'Patient':          { display: 'Patient',          redirect: 'patient-portal.html' },
  'Receptionist':     { display: 'Receptionist',     redirect: 'receptionist-portal.html' },
  'Pharmacist':       { display: 'Pharmacist',       redirect: 'pharmacist-portal.html' },
  'InventoryManager': { display: 'Inventory Manager',redirect: 'inventory-portal.html' }
};

function selectRole(role) {
  selectedRole = role;
  document.getElementById('selected-role-input').value = role;

  Object.keys(roleConfig).forEach(r => {
    const btnKey = r === 'InventoryManager' ? 'inventory' : r.toLowerCase();
    const btn = document.getElementById(`btn-${btnKey}`);
    if (btn) btn.classList.toggle('active', role === r);
  });

  document.getElementById('submit-btn').innerText = `Login as ${roleConfig[role].display}`;
}

// Basic email format check before POST
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form').addEventListener('submit', (e) => {
    const email = document.getElementById('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.preventDefault();
      alert('Please enter a valid email address (e.g., admin@carepulse.com).');
    }
  });
});