<?php
session_start();
header('Content-Type: application/json');

$host = '127.0.0.1';
$dbname = 'carepulse_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $totalPatients = $pdo->query("SELECT COUNT(*) FROM patients")->fetchColumn();
    $activeDoctors = $pdo->query("SELECT COUNT(*) FROM doctors")->fetchColumn();
    $totalRecords = $pdo->query("SELECT COUNT(*) FROM medical_records")->fetchColumn();
    $todaysAppointments = $pdo->query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE()")->fetchColumn();

    $patients = $pdo->query("
        SELECT p.id, u.name, u.email, u.phone, p.registered_date as registeredDate, p.last_visit as lastVisit
        FROM patients p
        JOIN users u ON p.user_id = u.id
    ")->fetchAll(PDO::FETCH_ASSOC);

    $doctors = $pdo->query("
        SELECT d.id, u.name, d.specialization, d.license_number as licenseNo, d.experience_years as yearsExperience, d.consultation_fee as consultationFee
        FROM doctors d
        JOIN users u ON d.user_id = u.id
    ")->fetchAll(PDO::FETCH_ASSOC);

    $users = $pdo->query("SELECT id, name, email, role FROM users")->fetchAll(PDO::FETCH_ASSOC);

    $activities = $pdo->query("
        SELECT mr.record_type as type, 
               COALESCE(up.name, 'Patient') as patientName, 
               COALESCE(ud.name, 'Doctor') as doctorName, 
               mr.record_date as date 
        FROM medical_records mr
        LEFT JOIN patients p ON mr.patient_id = p.id
        LEFT JOIN users up ON p.user_id = up.id
        LEFT JOIN doctors d ON mr.doctor_id = d.id
        LEFT JOIN users ud ON d.user_id = ud.id
        LIMIT 5
    ")->fetchAll(PDO::FETCH_ASSOC);

    $queue = $pdo->query("
        SELECT q.queue_number, up.name as patient_name, ud.name as doctor_name, q.check_in_time, q.wait_time, q.status
        FROM queues q
        LEFT JOIN patients p ON q.patient_id = p.id
        LEFT JOIN users up ON p.user_id = up.id
        LEFT JOIN doctors d ON q.doctor_id = d.id
        LEFT JOIN users ud ON d.user_id = ud.id
    ")->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => compact('totalPatients', 'activeDoctors', 'totalRecords', 'todaysAppointments'),
        'patients' => $patients,
        'doctors' => $doctors,
        'users' => $users,
        'activities' => $activities,
        'queue' => $queue
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>