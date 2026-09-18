<?php
session_start();
header('Content-Type: application/json');

$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['id'] ?? '';
$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$role = $data['role'] ?? '';

if (empty($userId) || empty($name) || empty($email) || empty($role)) {
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
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

    $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?");
    $stmt->execute([$name, $email, $role, $userId]);

    echo json_encode(['success' => true, 'message' => 'User updated successfully']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>