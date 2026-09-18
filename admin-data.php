<?php
session_start();
header('Content-Type: application/json');

// Database credentials
$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Fetch KPI Counts
    $totalPatients = $pdo->query("SELECT COUNT(*) FROM patients")->fetchColumn();
    
    $todaysAppointments = $pdo->query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE()")->fetchColumn();
    
    $activeDoctors = $pdo->query("SELECT COUNT(*) FROM doctors")->fetchColumn();
    
    $totalRecords = $pdo->query("SELECT COUNT(*) FROM medical_records")->fetchColumn();

    // 2. Fetch Recent Activities
    $stmt = $pdo->query("
        SELECT a.activity_type, 
               COALESCE(up.name, 'N/A') as patient_name, 
               COALESCE(ud.name, 'N/A') as doctor_name, 
               a.activity_date, 
               a.status 
        FROM activities a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN users up ON p.user_id = up.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN users ud ON d.user_id = ud.id
        ORDER BY a.activity_date DESC 
        LIMIT 5
    ");
    $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return everything as a JSON object
    echo json_encode([
        'success' => true,
        'stats' => [
            'total_patients' => $totalPatients,
            'todays_appointments' => $todaysAppointments,
            'active_doctors' => $activeDoctors,
            'total_records' => $totalRecords
        ],
        'activities' => $activities
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>