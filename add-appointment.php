<?php
session_start();
header('Content-Type: application/json');

$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

$data = json_decode(file_get_contents('php://input'), true);
$patientId = $data['patientId'] ?? '';
$doctorId = $data['doctorId'] ?? '';
$date = $data['date'] ?? '';
$time = $data['time'] ?? '';
$reason = $data['reason'] ?? '';
$department = $data['department'] ?? 'General';

if (empty($patientId) || empty($doctorId) || empty($date) || empty($time)) {
    echo json_encode(['success' => false, 'error' => 'Patient, doctor, date, and time are required']);
    exit();
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check for conflicts
    $stmt = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'Cancelled'");
    $stmt->execute([$doctorId, $date, $time]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'This time slot is already booked']);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO appointments (patient_id, doctor_id, department, appointment_date, appointment_time, reason, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')");
    $stmt->execute([$patientId, $doctorId, $department, $date, $time, $reason]);
    $appointmentId = $pdo->lastInsertId();

    echo json_encode(['success' => true, 'message' => 'Appointment created successfully', 'id' => $appointmentId]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>