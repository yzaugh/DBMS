<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

try {
    $pdo = db();

    $stats = [
        'totalPatients'      => (int) $pdo->query("SELECT COUNT(*) FROM patients")->fetchColumn(),
        'activeDoctors'      => (int) $pdo->query("SELECT COUNT(*) FROM doctors")->fetchColumn(),
        'totalRecords'       => (int) $pdo->query("SELECT COUNT(*) FROM medical_records")->fetchColumn(),
        'todaysAppointments' => (int) $pdo->query("SELECT COUNT(*) FROM appointments WHERE appointment_date = CURDATE() AND status != 'Cancelled'")->fetchColumn(),
    ];

    $activities = $pdo->query("
        SELECT mr.record_type AS type,
               COALESCE(up.name, 'Unknown Patient') AS patientName,
               COALESCE(ud.name, 'Unknown Doctor')  AS doctorName,
               mr.record_date AS date
        FROM medical_records mr
        LEFT JOIN patients p ON mr.patient_id = p.id
        LEFT JOIN users up   ON p.user_id = up.id
        LEFT JOIN doctors d  ON mr.doctor_id = d.id
        LEFT JOIN users ud   ON d.user_id = ud.id
        ORDER BY mr.record_date DESC
        LIMIT 5
    ")->fetchAll();

    $patients = $pdo->query("
        SELECT p.id, u.name, u.email, u.phone,
               p.registered_date AS registeredDate,
               p.last_visit      AS lastVisit
        FROM patients p
        JOIN users u ON p.user_id = u.id
        ORDER BY u.name
    ")->fetchAll();

    $doctors = $pdo->query("
        SELECT d.id, u.name, d.specialization,
               d.license_number   AS licenseNo,
               d.experience_years AS yearsExperience,
               d.consultation_fee AS consultationFee
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        ORDER BY u.name
    ")->fetchAll();

    $users = $pdo->query("SELECT id, name, email, role FROM users ORDER BY id")->fetchAll();

    $queue = $pdo->query("
        SELECT q.queue_number, up.name AS patient_name, ud.name AS doctor_name,
               q.check_in_time, q.wait_time, q.status
        FROM queues q
        LEFT JOIN patients p ON q.patient_id = p.id
        LEFT JOIN users up   ON p.user_id = up.id
        LEFT JOIN doctors d  ON q.doctor_id = d.id
        LEFT JOIN users ud   ON d.user_id = ud.id
    ")->fetchAll();

    echo json_encode([
        'success'    => true,
        'stats'      => $stats,
        'activities' => $activities,
        'patients'   => $patients,
        'doctors'    => $doctors,
        'users'      => $users,
        'queue'      => $queue,
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>