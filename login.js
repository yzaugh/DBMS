let selectedRole = 'Admin';

const roleConfig = {
  'Admin': { display: 'Admin', redirect: 'index.html', icon: 'shield' },
  'Physician': { display: 'Physician', redirect: 'doctor-portal.html', icon: 'user-check' },
  'Patient': { display: 'Patient', redirect: 'patient-portal.html', icon: 'user' },
  'Receptionist': { display: 'Receptionist', redirect: 'receptionist-portal.html', icon: 'phone' },
  'Pharmacist': { display: 'Pharmacist', redirect: 'pharmacist-portal.html', icon: 'pill' },
  'InventoryManager': { display: 'Inventory Manager', redirect: 'inventory-portal.html', icon: 'package' }
};

function selectRole(role) {
  selectedRole = role;
  document.getElementById('selected-role-input').value = role;
  
  // Update button states
  Object.keys(roleConfig).forEach(r => {
    const btnKey = r === 'InventoryManager' ? 'inventory' : r.toLowerCase();
    const btn = document.getElementById(`btn-${btnKey}`);
    if (btn) {
      btn.classList.toggle('active', role === r);
    }
  });
  
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.innerText = `Login as ${roleConfig[role].display}`;
}