<?php
session_start();
require_once __DIR__ . '/config.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: login.html");
    exit();
}

$email        = trim($_POST['email'] ?? '');
$password     = trim($_POST['password'] ?? '');
$selectedRole = trim($_POST['role'] ?? '');

if (empty($email) || empty($password)) {
    echo "<script>alert('All fields are required.'); window.location.href='login.html';</script>";
    exit();
}

try {
    $stmt = db()->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch();
} catch (PDOException $e) {
    die("DB error: " . $e->getMessage());
}

if (!$row || $password !== $row['password']) {
    echo "<script>alert('Invalid email or password.'); window.location.href='login.html';</script>";
    exit();
}

if (!empty($selectedRole) && $row['role'] !== $selectedRole) {
    echo "<script>alert('Selected role does not match your account.'); window.location.href='login.html';</script>";
    exit();
}

$_SESSION['user_id'] = $row['id'];
$_SESSION['role']    = $row['role'];
$_SESSION['name']    = $row['name'];
$_SESSION['email']   = $row['email'];

$roleMap = [
    'Admin'            => 'admin',
    'Physician'        => 'doctor',
    'Patient'          => 'patient',
    'Receptionist'     => 'receptionist',
    'Pharmacist'       => 'pharmacist',
    'InventoryManager' => 'inventory_manager',
];
$targetMap = [
    'Admin'            => 'index.html',
    'Physician'        => 'doctor-portal.html',
    'Patient'          => 'patient-portal.html',
    'Receptionist'     => 'receptionist-portal.html',
    'Pharmacist'       => 'pharmacist-portal.html',
    'InventoryManager' => 'inventory-portal.html',
];

$jsRole = $roleMap[$row['role']]   ?? strtolower($row['role']);
$target = $targetMap[$row['role']] ?? 'login.html';

$sessionPayload = [
    'id'           => 'sess_' . bin2hex(random_bytes(4)),
    'email'        => $row['email'],
    'name'         => $row['name'],
    'role'         => $jsRole,
    'timestamp'    => round(microtime(true) * 1000),
    'lastActivity' => round(microtime(true) * 1000),
];

echo "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>
<script>
  try { localStorage.setItem('carepulse_user', " . json_encode(json_encode($sessionPayload)) . "); } catch (e) {}
  window.location.href = " . json_encode($target) . ";
</script>
</body></html>";
exit();
?>