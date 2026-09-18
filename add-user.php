<?php
session_start();
header('Content-Type: application/json');

$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

$data = json_decode(file_get_contents('php://input'), true);
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$role = $data['role'] ?? '';
$userPassword = $data['password'] ?? 'default123';

if (empty($name) || empty($email) || empty($role)) {
    echo json_encode(['success' => false, 'error' => 'Name, email, and role are required']);
    exit();
}

$allowedRoles = ['Admin', 'Physician', 'Patient', 'Receptionist', 'Pharmacist', 'InventoryManager'];
if (!in_array($role, $allowedRoles)) {
    echo json_encode(['success' => false, 'error' => 'Invalid role']);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Email already exists']);
        exit();
    }

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $userPassword, $role]);
    $userId = $pdo->lastInsertId();

    // If role is Patient, create patient record
    if ($role === 'Patient') {
        $stmt = $pdo->prepare("INSERT INTO patients (user_id, registered_date, last_visit) VALUES (?, CURDATE(), CURDATE())");
        $stmt->execute([$userId]);
    }

    // If role is Physician, create doctor record
    if ($role === 'Physician') {
        $stmt = $pdo->prepare("INSERT INTO doctors (user_id, specialization) VALUES (?, 'General')");
        $stmt->execute([$userId]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'User added successfully', 'id' => $userId]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>