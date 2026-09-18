<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

$data  = json_decode(file_get_contents('php://input'), true);
$name  = trim($data['name']  ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');

if (empty($name) || empty($email)) {
    echo json_encode(['success' => false, 'error' => 'Name and email are required']);
    exit();
}

try {
    $pdo = db();
    $pdo->beginTransaction();

    $stmtUser = $pdo->prepare("INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, 'default123', 'Patient', ?)");
    $stmtUser->execute([$name, $email, $phone]);
    $userId = $pdo->lastInsertId();

    $stmtPatient = $pdo->prepare("INSERT INTO patients (user_id, registered_date, last_visit) VALUES (?, CURDATE(), NOW())");
    $stmtPatient->execute([$userId]);

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $userId]);

} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>