<?php
session_start();
header('Content-Type: application/json');

$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['id'] ?? '';

if (empty($userId)) {
    echo json_encode(['success' => false, 'error' => 'User ID is required']);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Prevent deleting yourself
    if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $userId) {
        echo json_encode(['success' => false, 'error' => 'You cannot delete your own account']);
        exit();
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => 'User not found']);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>