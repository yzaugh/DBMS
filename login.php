<?php
session_start();
header('Content-Type: text/html');

$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email        = trim($_POST['email'] ?? '');
    $password     = trim($_POST['password'] ?? '');
    $selectedRole = trim($_POST['role'] ?? '');

    if (empty($email) || empty($password)) {
        echo "<script>alert('All fields are required.'); window.location.href='login.html';</script>";
        exit();
    }

    $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || $password !== $row['password']) {
        echo "<script>alert('Invalid email or password.'); window.location.href='login.html';</script>";
        exit();
    }

    // Enforce selected role matches the DB role
    if (!empty($selectedRole) && $row['role'] !== $selectedRole) {
        echo "<script>alert('Selected role does not match your account.'); window.location.href='login.html';</script>";
        exit();
    }

    // Store in PHP session
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['role']    = $row['role'];
    $_SESSION['name']    = $row['name'];
    $_SESSION['email']   = $row['email'];

    // Map DB role -> JS role (must match UserRoles in shared.js)
    $roleMap = [
        'Admin'            => 'admin',
        'Physician'        => 'doctor',
        'Patient'          => 'patient',
        'Receptionist'     => 'receptionist',
        'Pharmacist'       => 'pharmacist',
        'InventoryManager' => 'inventory_manager',
    ];

    // Map DB role -> portal page
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

    // Build the session object AuthManager expects in localStorage
    $sessionPayload = [
        'id'           => 'sess_' . bin2hex(random_bytes(4)),
        'email'        => $row['email'],
        'name'         => $row['name'],
        'role'         => $jsRole,
        'timestamp'    => round(microtime(true) * 1000),
        'lastActivity' => round(microtime(true) * 1000),
    ];

    // Write localStorage then redirect (browser will follow after JS runs)
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>
    <script>
      try {
        localStorage.setItem('carepulse_user', " . json_encode(json_encode($sessionPayload)) . ");
      } catch (e) {}
      window.location.href = " . json_encode($target) . ";
    </script>
    </body></html>";
    exit();
}
?>